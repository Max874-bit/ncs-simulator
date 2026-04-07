/**
 * ═══════════════════════════════════════════════════
 *  Agent 1: QuestionFetchAgent (문제 수집 에이전트)
 * ═══════════════════════════════════════════════════
 *
 *  역할: 문제은행 + 공공데이터 API에서 문제를 수집/필터링/셔플
 *  입력: { level, questionCount, areas }
 *  출력: { examId, questions[], totalTime }
 */

const { QUESTIONS } = require('../data/questions');
const { NcsDatabase } = require('../data/database');

// 공공데이터 API 설정 (API키 등록 후 사용)
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
  }

  /**
   * 로컬 문제은행에서 문제를 수집한다 (DB 우선, 폴백: in-memory)
   */
  fetchFromLocalBank(options = {}) {
    const { level, questionCount = 20, areas } = options;
    this._emit('info', `문제은행에서 조건에 맞는 문제 수집 시작 (level=${level || '전체'}, count=${questionCount})`);

    let pool;
    try {
      pool = this.db.getQuestions({ level, areas });
      this._emit('info', `DB에서 ${pool.length}문제 로드`);
    } catch (e) {
      this._emit('warn', `DB 접근 실패, in-memory 폴백: ${e.message}`);
      pool = [...QUESTIONS];
    }

    // 난이도 필터 ('mixed'는 전체 포함)
    if (level && level !== 'mixed') {
      pool = pool.filter(q => q.level === level);
      this._emit('info', `난이도 '${level}' 필터 → ${pool.length}문제`);
    }

    // 영역 필터
    if (areas && areas.length > 0) {
      pool = pool.filter(q => areas.includes(q.area));
      this._emit('info', `영역 필터 [${areas.join(',')}] → ${pool.length}문제`);
    }

    // 영역별 균등 배분
    const availableAreas = [...new Set(pool.map(q => q.area))];
    const perArea = Math.ceil(questionCount / availableAreas.length);

    let selected = [];
    for (const area of availableAreas) {
      const areaQ = pool.filter(q => q.area === area);
      this._shuffle(areaQ);
      selected.push(...areaQ.slice(0, perArea));
    }

    this._shuffle(selected);
    selected = selected.slice(0, questionCount);

    const totalTime = selected.reduce((sum, q) => sum + q.timeLimit, 0);
    const examId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    this._emit('success', `문제 수집 완료: ${selected.length}문제, 총 시간 ${totalTime}초`);

    return {
      examId,
      totalTime,
      questions: selected,
      // 클라이언트용 (정답 제외)
      safeQuestions: selected.map(({ answer, explanation, ...rest }) => rest),
      // 채점용 (정답 포함)
      answerKey: selected.map(q => ({
        id: q.id,
        answer: q.answer,
        explanation: q.explanation,
        area: q.area,
        subArea: q.subArea,
        level: q.level,
        keywords: q.keywords
      }))
    };
  }

  /**
   * 공공데이터 API에서 NCS 정보 조회 (API 키 필요)
   */
  async fetchFromPublicAPI(apiKey, options = {}) {
    this._emit('info', '공공데이터 API 연결 시도...');

    if (!apiKey) {
      this._emit('warn', 'API 키가 없습니다. data.go.kr에서 활용신청 후 사용하세요.');
      return { success: false, message: 'API 키 필요' };
    }

    try {
      const url = `${API_SOURCES.ncsJobBase.endpoint}?serviceKey=${encodeURIComponent(apiKey)}&pageNo=1&numOfRows=10&dataType=JSON`;

      // Node.js 18+ 내장 fetch 사용
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
   * 약점 기반 보강 문제 수집
   */
  fetchReinforcementQuestions(weakAreas, weakKeywords, currentLevel) {
    this._emit('info', `보강 문제 수집: 약점 영역 [${weakAreas.join(',')}]`);

    let pool = QUESTIONS.filter(q =>
      weakAreas.includes(q.area) ||
      (q.keywords && q.keywords.some(k => weakKeywords.includes(k)))
    );

    // 현재 레벨과 한 단계 아래
    const levels = ['beginner', 'intermediate', 'advanced'];
    const idx = levels.indexOf(currentLevel);
    const targetLevels = idx > 0 ? [levels[idx - 1], currentLevel] : [currentLevel];

    pool = pool.filter(q => targetLevels.includes(q.level));
    this._shuffle(pool);

    const result = pool.slice(0, 10);
    this._emit('success', `보강 문제 ${result.length}개 수집 완료`);

    return result.map(({ answer, explanation, ...rest }) => rest);
  }

  /**
   * API 소스 목록 반환
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
    const entry = { agent: this.name, level, message, timestamp: new Date().toISOString() };
    this.log.push(entry);
  }

  getLog() { return this.log; }
  clearLog() { this.log = []; }
}

module.exports = { QuestionFetchAgent };
