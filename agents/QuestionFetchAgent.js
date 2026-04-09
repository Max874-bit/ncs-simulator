/**
 * ═══════════════════════════════════════════════════
 *  Agent 1: QuestionFetchAgent (문제 수집 에이전트)
 * ═══════════════════════════════════════════════════
 *
 *  역할: 문제은행 + 동적 생성으로 매번 새로운 문제를 공급
 *
 *  중복 방지 전략:
 *  1. DB에서 최근 N회 기출 문제 ID 조회
 *  2. 정적 은행에서 미출제 문제 우선 선별
 *  3. 정적 은행 소진 시 QuestionGenerator로 동적 생성
 *  4. 영역별 균등 배분 + 난이도 분포 유지
 */

const { QUESTIONS } = require('../data/questions');
const { NcsDatabase } = require('../data/database');
const { QuestionGenerator } = require('./QuestionGenerator');

// 공공데이터 API 설정
const API_SOURCES = {
  ncsJobBase: {
    name: 'NCS 직업기초능력 API',
    endpoint: 'http://apis.data.go.kr/B490007/ncsJobBase/openapi19',
    provider: '한국산업인력공단',
    description: 'NCS 능력단위별 직업기초능력 정보'
  },
  ncsStudyModule: {
    name: 'NCS 학습모듈정보 API',
    endpoint: 'http://apis.data.go.kr/B490007/ncsStudyModule/openapi21',
    provider: '한국산업인력공단',
    description: 'NCS 학습모듈 명칭/내용'
  },
  ncsInfo: {
    name: 'NCS 기준정보 조회 API',
    endpoint: 'http://apis.data.go.kr/B490007/ncsInfo/openapi23',
    provider: '한국산업인력공단',
    description: 'NCS 분류 정보(대/중/소/세분류)'
  },
  ncsRelated: {
    name: 'NCS 관련 정보 서비스',
    url: 'https://www.data.go.kr/data/15063879/openapi.do',
    provider: '한국산업인력공단 (CQ-Net)',
    description: '능력단위코드, 능력단위명 등 조회'
  },
  ncsFileData: {
    name: '직업기초능력 영역별 학습자료',
    url: 'https://www.data.go.kr/data/15077168/fileData.do',
    provider: '한국산업인력공단',
    description: '10개 영역별 학습자료 파일'
  },
  ncsSampleQuestions: {
    name: 'NCS 필기평가 예시 문항집',
    url: 'https://ncs.go.kr/blind/blp/bbs_lib_list.do?libDstinCd=55',
    provider: '한국산업인력공단',
    description: '연도별 직업기초능력 필기 문항 PDF'
  },
  hrdPortal: {
    name: '한국산업인력공단 오픈 API 포털',
    url: 'https://openapi.hrdkorea.or.kr/main',
    provider: '한국산업인력공단',
    description: '자격/훈련정보 통합 API'
  }
};

class QuestionFetchAgent {
  constructor(db = null) {
    this.name = 'QuestionFetchAgent';
    this.status = 'idle';
    this.log = [];
    this.db = db || new NcsDatabase();
    this.generator = new QuestionGenerator();
  }

  /**
   * ═══ 핵심: 스마트 문제 수집 (중복 방지 + 동적 생성) ═══
   */
  fetchFromLocalBank(options = {}) {
    const { level, questionCount = 20, areas, companyPreset } = options;
    this._emit('info', `스마트 문제 수집 시작 (level=${level || '전체'}, count=${questionCount}${companyPreset ? ', 기관=' + companyPreset.company_name : ''})`);

    // 기관 컨텍스트 설정 → QuestionGenerator에 전달
    if (companyPreset) {
      this.generator.setContext({
        companyName: companyPreset.company_name,
        description: companyPreset.description
      });
      this._emit('info', `기관 컨텍스트 설정: ${companyPreset.company_name}`);
    } else {
      this.generator.setContext(null);
    }

    // Step 1: 전체 풀 로드 (DB 우선)
    let pool;
    try {
      pool = this.db.getQuestions({ level, areas });
      this._emit('info', `DB에서 ${pool.length}문제 로드`);
    } catch (e) {
      this._emit('warn', `DB 접근 실패, in-memory 폴백: ${e.message}`);
      pool = [...QUESTIONS];
    }

    // 난이도 필터
    if (level && level !== 'mixed') {
      pool = pool.filter(q => q.level === level);
    }
    // 영역 필터
    if (areas && areas.length > 0) {
      pool = pool.filter(q => areas.includes(q.area));
    }

    // Step 2: 기출 이력 조회 → 미출제 문제 우선
    let recentIds = [];
    try {
      recentIds = this.db.getRecentQuestionIds(5);
      this._emit('info', `최근 5회 기출 ${recentIds.length}문제 확인`);
    } catch (e) {
      this._emit('warn', `기출 이력 조회 실패: ${e.message}`);
    }

    const unseenPool = pool.filter(q => !recentIds.includes(q.id));
    const seenPool = pool.filter(q => recentIds.includes(q.id));
    this._emit('info', `미출제: ${unseenPool.length}, 기출: ${seenPool.length}`);

    // Step 3: 영역별 배분 — 기관 프리셋 비중 or 균등
    let areaQuota = {};
    if (companyPreset && companyPreset.area_weights) {
      // 기관별 영역 비중에 따라 문제 수 배분
      const weights = companyPreset.area_weights;
      const totalWeight = Object.values(weights).reduce((s, w) => s + w, 0);
      let allocated = 0;
      const entries = Object.entries(weights).sort((a, b) => b[1] - a[1]);
      for (const [area, weight] of entries) {
        const cnt = Math.round(questionCount * weight / totalWeight);
        areaQuota[area] = cnt;
        allocated += cnt;
      }
      // 반올림 오차 보정 (가장 비중 높은 영역에서 조정)
      if (allocated !== questionCount && entries.length > 0) {
        areaQuota[entries[0][0]] += (questionCount - allocated);
      }
      this._emit('info', `기관별 배분: ${Object.entries(areaQuota).map(([a, n]) => `${a}(${n})`).join(', ')}`);
    } else {
      // 균등 배분
      const availableAreas = [...new Set(pool.map(q => q.area))];
      const perArea = Math.ceil(questionCount / availableAreas.length);
      availableAreas.forEach(a => { areaQuota[a] = perArea; });
    }

    let selected = [];

    for (const [area, quota] of Object.entries(areaQuota)) {
      if (quota <= 0) continue;
      const unseenArea = unseenPool.filter(q => q.area === area);
      const seenArea = seenPool.filter(q => q.area === area);

      this._shuffle(unseenArea);
      this._shuffle(seenArea);

      // 미출제 먼저, 부족하면 기출에서 보충
      const fromBank = [
        ...unseenArea.slice(0, quota),
        ...seenArea.slice(0, Math.max(0, quota - unseenArea.length))
      ].slice(0, quota);

      selected.push(...fromBank);

      // 부족분 또는 기관 맥락 강화를 위해 동적 생성
      const dynamicMin = companyPreset ? Math.max(1, Math.ceil(quota * 0.5)) : 0;
      const dynamicNeeded = Math.max(dynamicMin - 0, quota - fromBank.length);

      if (dynamicNeeded > 0) {
        // 기관 프리셋이면 동적 문제로 일부 교체 (기관 맥락 반영)
        const replace = Math.min(dynamicNeeded, fromBank.length);
        if (companyPreset && replace > 0 && fromBank.length > dynamicNeeded) {
          fromBank.splice(fromBank.length - replace, replace);
          selected.splice(selected.length - replace, replace);
        }
        const deficit = quota - (selected.filter(q => q.area === area).length || 0);
        if (deficit > 0) {
          this._emit('info', `${area} → ${deficit}문제 동적 생성 (기관 맥락 반영)`);
          const generated = this.generator.generate(deficit, { areas: [area], level });
          selected.push(...generated);
        }
      }
    }

    // Step 5: 최종 셔플 & 트림
    this._shuffle(selected);
    selected = selected.slice(0, questionCount);

    const totalTime = selected.reduce((sum, q) => sum + (q.timeLimit || 90), 0);
    const examId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const staticCount = selected.filter(q => !q.id.startsWith('gen-')).length;
    const genCount = selected.filter(q => q.id.startsWith('gen-')).length;
    this._emit('success', `문제 수집 완료: ${selected.length}문제 (정적 ${staticCount} + 동적 ${genCount}), 총 시간 ${totalTime}초`);

    return {
      examId,
      totalTime,
      questions: selected,
      safeQuestions: selected.map(({ answer, explanation, ...rest }) => rest),
      answerKey: selected.map(q => ({
        id: q.id,
        answer: q.answer,
        explanation: q.explanation,
        area: q.area,
        subArea: q.subArea,
        level: q.level,
        keywords: q.keywords || []
      }))
    };
  }

  /**
   * 공공데이터 API에서 NCS 정보 조회
   */
  async fetchFromPublicAPI(apiKey, options = {}) {
    this._emit('info', '공공데이터 API 연결 시도...');
    if (!apiKey) {
      this._emit('warn', 'API 키가 없습니다.');
      return { success: false, message: 'API 키 필요' };
    }
    try {
      const url = `${API_SOURCES.ncsJobBase.endpoint}?serviceKey=${encodeURIComponent(apiKey)}&pageNo=1&numOfRows=10&dataType=JSON`;
      const response = await fetch(url);
      const data = await response.json();
      this._emit('success', `공공 API 데이터 수신: ${JSON.stringify(data).length} bytes`);
      return { success: true, data };
    } catch (err) {
      this._emit('error', `API 호출 실패: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  /**
   * 약점 기반 보강 문제 수집 (정적 + 동적)
   */
  fetchReinforcementQuestions(weakAreas, weakKeywords, currentLevel) {
    this._emit('info', `보강 문제 수집: 약점 영역 [${weakAreas.join(',')}]`);

    let pool = QUESTIONS.filter(q =>
      weakAreas.includes(q.area) ||
      (q.keywords && q.keywords.some(k => weakKeywords.includes(k)))
    );

    const levels = ['beginner', 'intermediate', 'advanced'];
    const idx = levels.indexOf(currentLevel);
    const targetLevels = idx > 0 ? [levels[idx - 1], currentLevel] : [currentLevel];
    pool = pool.filter(q => targetLevels.includes(q.level));
    this._shuffle(pool);

    // 정적 부족 시 동적 생성 추가
    if (pool.length < 10) {
      const generated = this.generator.generate(10 - pool.length, { areas: weakAreas, level: currentLevel });
      pool.push(...generated);
    }

    const result = pool.slice(0, 10);
    this._emit('success', `보강 문제 ${result.length}개 수집 완료`);
    return result.map(({ answer, explanation, ...rest }) => rest);
  }

  /**
   * API 소스 목록
   */
  getApiSources() {
    return Object.values(API_SOURCES).map(s => ({
      ...s,
      url: s.url || s.endpoint || '#',
      authRequired: !!s.endpoint,
      freeQuota: s.endpoint ? '일 10,000건' : '무제한'
    }));
  }

  // ─── 유틸 ───
  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  _emit(level, message) {
    this.log.push({ agent: this.name, level, message, timestamp: new Date().toISOString() });
  }

  getLog() { return this.log; }
  clearLog() { this.log = []; }
}

module.exports = { QuestionFetchAgent };
