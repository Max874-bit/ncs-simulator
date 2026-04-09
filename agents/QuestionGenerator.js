/**
 * ═══════════════════════════════════════════════════
 *  QuestionGenerator (동적 문제 생성 에이전트)
 * ═══════════════════════════════════════════════════
 *
 *  역할: 시나리오 풀 + 변수 주입으로 매번 다른 문제 생성
 *  정적 은행 소진 시 동적으로 무한 문제 공급
 *
 *  설계 원칙:
 *  1. 시나리오 풀: 영역당 8~15개 시나리오 랜덤 선택
 *  2. 변수 주입: 숫자/이름/기한 등 파라미터 랜덤화
 *  3. NCS/PSAT 출제 패턴: 지문형, ㄱㄴㄷ보기형, 표해석형, 규정해석형, 상황판단형
 *  4. 정답 검증: 인덱스 범위, 중복 보기 체크
 */

// ═══════════════════════════════════════════════════
//  기관별 컨텍스트 프로필
// ═══════════════════════════════════════════════════
const INSTITUTION_PROFILES = {
  '한국전력공사 (KEPCO)': {
    depts: ['송배전사업처', '전력거래처', '신재생에너지처', '고객서비스처', '안전관리처', '경영지원처', '디지털혁신처', '연구개발처'],
    budgetItems: ['전력구입비', '송배전설비투자비', '신재생에너지사업비', '안전관리비', '인건비'],
    scenarios: [
      { situation: '하절기 전력수요 급증', item: '전력 공급량', unit: 'GWh' },
      { situation: '신재생에너지 발전비율 확대', item: '태양광 발전량', unit: 'MWh' },
      { situation: '노후 송전탑 교체 사업', item: '설비 교체율', unit: '%' },
      { situation: '전기요금 미납 민원 증가', item: '미납 민원 건수', unit: '건' },
      { situation: 'ESG 경영 실적 평가', item: '탄소배출 감축량', unit: '톤' },
    ],
    regulations: [
      { name: '전력설비 안전관리 규정', dept: '안전관리처' },
      { name: '신재생에너지 발전사업 운영 규정', dept: '신재생에너지처' },
      { name: '전기요금 부과 및 징수 규정', dept: '고객서비스처' },
    ],
    ethicsContext: '전력 공급의 공공성과 안전성, 에너지 전환 정책 이행'
  },
  '국민건강보험공단': {
    depts: ['건강보험운영부', '장기요양운영부', '건강관리부', '보험급여부', '재정관리부', '고객지원부', '정보화추진부', '감사실'],
    budgetItems: ['보험급여비', '장기요양급여비', '건강검진비', '관리운영비', '인건비'],
    scenarios: [
      { situation: '건강보험 재정 적자 확대', item: '보험급여 지출액', unit: '조원' },
      { situation: '노인장기요양 수급자 증가', item: '장기요양 이용자 수', unit: '만명' },
      { situation: '비급여 의료비 부담 민원', item: '민원 접수 건수', unit: '건' },
      { situation: '국가건강검진 수검률 향상', item: '검진 수검률', unit: '%' },
      { situation: '부정수급 적발 강화', item: '부정수급 적발 건수', unit: '건' },
    ],
    regulations: [
      { name: '건강보험 급여기준 규정', dept: '보험급여부' },
      { name: '장기요양등급 판정 기준', dept: '장기요양운영부' },
      { name: '건강검진 실시 기준', dept: '건강관리부' },
    ],
    ethicsContext: '국민 건강권 보장과 보험재정의 지속가능성'
  },
  '한국수자원공사 (K-water)': {
    depts: ['수도사업처', '댐운영처', '수질환경처', '스마트워터처', '안전방재처', '해외사업처', '경영기획처', '기술연구원'],
    budgetItems: ['댐관리운영비', '수도시설투자비', '수질관리비', '안전관리비', '인건비'],
    scenarios: [
      { situation: '가뭄 대비 용수 확보', item: '댐 저수율', unit: '%' },
      { situation: '수돗물 수질 민원 대응', item: '수질검사 부적합 건수', unit: '건' },
      { situation: '스마트 물관리 시스템 구축', item: '스마트미터 보급률', unit: '%' },
      { situation: '노후 상수관 교체 사업', item: '관로 교체율', unit: '%' },
      { situation: '홍수기 댐 방류량 관리', item: '방류량', unit: '톤/초' },
    ],
    regulations: [
      { name: '댐 운영·관리 규정', dept: '댐운영처' },
      { name: '수돗물 수질기준 관리 규정', dept: '수질환경처' },
      { name: '가뭄 대응 비상급수 매뉴얼', dept: '안전방재처' },
    ],
    ethicsContext: '안전한 물 공급과 수자원의 효율적 관리'
  },
  '한국토지주택공사 (LH)': {
    depts: ['주택건설처', '도시재생처', '택지개발처', '임대주택관리처', '주거복지처', '기술심사처', '경영관리처', '감사실'],
    budgetItems: ['택지개발비', '주택건설비', '임대주택관리비', '도시재생사업비', '인건비'],
    scenarios: [
      { situation: '공공임대주택 입주 대기자 증가', item: '임대주택 공급 호수', unit: '호' },
      { situation: '도시재생 뉴딜사업 추진', item: '사업 완료율', unit: '%' },
      { situation: '분양가 산정 민원', item: '민원 접수 건수', unit: '건' },
      { situation: '하자보수 처리 지연', item: '하자보수 처리율', unit: '%' },
      { situation: '3기 신도시 개발 사업', item: '택지 조성 면적', unit: '만㎡' },
    ],
    regulations: [
      { name: '임대주택 입주자 선정 기준', dept: '임대주택관리처' },
      { name: '공공분양 가격 산정 규정', dept: '주택건설처' },
      { name: '하자보수 처리 규정', dept: '기술심사처' },
    ],
    ethicsContext: '주거 안정과 공정한 주택 공급, 투기 방지'
  },
  '인천국제공항공사': {
    depts: ['항공마케팅처', '여객터미널운영처', '화물사업처', '공항시설처', '안전보안처', '스마트공항추진처', '경영기획처', '환경관리처'],
    budgetItems: ['시설유지보수비', '보안장비투자비', '마케팅비', '환경관리비', '인건비'],
    scenarios: [
      { situation: '여객 수요 회복에 따른 터미널 혼잡', item: '일평균 여객 수', unit: '만명' },
      { situation: '항공화물 물동량 증가', item: '화물 처리량', unit: '만톤' },
      { situation: '활주로 안전점검 강화', item: '안전점검 건수', unit: '건' },
      { situation: '스마트 공항 서비스 확대', item: '자동출입국 이용률', unit: '%' },
      { situation: '항공기 소음 민원 대응', item: '소음 민원 건수', unit: '건' },
    ],
    regulations: [
      { name: '공항 보안검색 운영 규정', dept: '안전보안처' },
      { name: '항공기 소음 관리 기준', dept: '환경관리처' },
      { name: '여객터미널 운영 매뉴얼', dept: '여객터미널운영처' },
    ],
    ethicsContext: '항공 안전과 서비스 품질, 공항 주변 환경 보호'
  },
  '한국도로공사': {
    depts: ['도로건설처', '교통관리처', '안전관리처', '고속도로관리처', '톨링시스템처', '건설기술처', '경영기획처', '감사실'],
    budgetItems: ['도로건설비', '유지보수비', '교통관리비', '안전시설투자비', '인건비'],
    scenarios: [
      { situation: '명절 고속도로 교통 혼잡', item: '일평균 교통량', unit: '만대' },
      { situation: '노후 교량 안전점검', item: '교량 보수 건수', unit: '건' },
      { situation: '하이패스 이용률 확대', item: '하이패스 이용률', unit: '%' },
      { situation: '고속도로 졸음운전 사고 예방', item: '졸음쉼터 이용 건수', unit: '건' },
      { situation: '스마트 톨링 시스템 전환', item: '시스템 전환율', unit: '%' },
    ],
    regulations: [
      { name: '고속도로 안전관리 규정', dept: '안전관리처' },
      { name: '통행료 부과·징수 규정', dept: '톨링시스템처' },
      { name: '도로 유지보수 기준', dept: '고속도로관리처' },
    ],
    ethicsContext: '도로 안전과 이용자 편의, 공정한 통행료 부과'
  },
  '한국가스공사 (KOGAS)': {
    depts: ['천연가스공급처', '배관관리처', 'LNG터미널운영처', '안전관리처', '해외사업처', '수소사업추진처', '기술연구원', '경영지원처'],
    budgetItems: ['천연가스도입비', '배관건설비', 'LNG저장시설비', '안전관리비', '인건비'],
    scenarios: [
      { situation: '동절기 천연가스 수요 급증', item: '일일 가스 공급량', unit: '백만㎥' },
      { situation: '가스 배관 노후화 점검', item: '배관 교체율', unit: '%' },
      { situation: '수소경제 전환 사업', item: '수소 충전소 설치 수', unit: '개소' },
      { situation: 'LNG 도입가 변동', item: 'LNG 도입 단가', unit: '달러/톤' },
      { situation: '가스 안전사고 예방', item: '안전점검 이행률', unit: '%' },
    ],
    regulations: [
      { name: '천연가스 공급 안전관리 규정', dept: '안전관리처' },
      { name: 'LNG 인수기지 운영 규정', dept: 'LNG터미널운영처' },
      { name: '가스 요금 산정 기준', dept: '천연가스공급처' },
    ],
    ethicsContext: '에너지 안정 공급과 안전관리, 탄소중립 전환'
  },
  '한국철도공사 (코레일)': {
    depts: ['여객사업처', '광역철도처', '물류사업처', '안전관리처', '차량관리처', '시설관리처', '역무사업처', '경영지원처'],
    budgetItems: ['차량유지보수비', '선로관리비', '안전시설투자비', '역사운영비', '인건비'],
    scenarios: [
      { situation: 'KTX 이용객 증가에 따른 좌석 부족', item: 'KTX 이용객 수', unit: '만명' },
      { situation: '열차 정시운행률 개선', item: '정시운행률', unit: '%' },
      { situation: '노후 차량 교체 사업', item: '차량 교체 대수', unit: '량' },
      { situation: '철도 안전사고 예방', item: '안전사고 발생 건수', unit: '건' },
      { situation: '무궁화호 적자 노선 운영', item: '노선별 영업손실', unit: '억원' },
    ],
    regulations: [
      { name: '열차 운행 안전 규정', dept: '안전관리처' },
      { name: '여객 운임 산정 기준', dept: '여객사업처' },
      { name: '철도 시설물 유지보수 기준', dept: '시설관리처' },
    ],
    ethicsContext: '철도 안전과 정시운행, 공공교통 서비스 형평성'
  },
  '서울교통공사': {
    depts: ['운전사업처', '차량관리처', '시설관리처', '안전관리처', '역무사업처', '고객서비스처', '경영기획처', '노사협력처'],
    budgetItems: ['전동차유지보수비', '시설관리비', '안전투자비', '역사운영비', '인건비'],
    scenarios: [
      { situation: '출퇴근 시간대 혼잡도 관리', item: '혼잡도', unit: '%' },
      { situation: '지하철 범죄 예방 강화', item: 'CCTV 설치 대수', unit: '대' },
      { situation: '노후 전동차 교체', item: '전동차 교체 편성 수', unit: '편성' },
      { situation: '역사 내 미세먼지 관리', item: '미세먼지 농도', unit: '㎍/㎥' },
      { situation: '장애인 이동권 보장 시설 확충', item: '엘리베이터 설치율', unit: '%' },
    ],
    regulations: [
      { name: '전동차 운행 안전 규정', dept: '안전관리처' },
      { name: '역사 시설 관리 기준', dept: '시설관리처' },
      { name: '고객 민원 처리 규정', dept: '고객서비스처' },
    ],
    ethicsContext: '시민 안전과 교통약자 배려, 대중교통 서비스 품질'
  },
  '국민연금공단': {
    depts: ['연금급여처', '가입지원처', '기금운용처', '장애심사처', '고객서비스처', '정보화추진처', '경영지원처', '감사실'],
    budgetItems: ['연금급여비', '기금운용관리비', '관리운영비', '정보화투자비', '인건비'],
    scenarios: [
      { situation: '국민연금 재정 안정화', item: '기금 적립금', unit: '조원' },
      { situation: '연금 수급자 증가', item: '연금 수급자 수', unit: '만명' },
      { situation: '기금 수익률 관리', item: '기금 운용 수익률', unit: '%' },
      { situation: '보험료 체납 관리', item: '체납률', unit: '%' },
      { situation: '장애등급 판정 민원', item: '심사 청구 건수', unit: '건' },
    ],
    regulations: [
      { name: '국민연금 급여 지급 기준', dept: '연금급여처' },
      { name: '기금 운용 지침', dept: '기금운용처' },
      { name: '장애등급 심사 규정', dept: '장애심사처' },
    ],
    ethicsContext: '노후소득 보장과 기금의 안정적 운용, 세대 간 형평성'
  },
  '근로복지공단': {
    depts: ['산재보상처', '재활지원처', '보험가입처', '직업재활처', '의료사업처', '고객지원처', '경영기획처', '감사실'],
    budgetItems: ['산재보험급여비', '재활치료비', '의료시설운영비', '직업훈련비', '인건비'],
    scenarios: [
      { situation: '산재 사망사고 감소 대책', item: '산재 사망자 수', unit: '명' },
      { situation: '직업재활 서비스 확대', item: '직업복귀율', unit: '%' },
      { situation: '산재보험 적용 사업장 확대', item: '가입 사업장 수', unit: '만개소' },
      { situation: '통근 재해 인정 범위 확대', item: '통근재해 승인 건수', unit: '건' },
      { situation: '요양급여 심사 민원', item: '심사 처리 건수', unit: '건' },
    ],
    regulations: [
      { name: '산재보험 급여 지급 기준', dept: '산재보상처' },
      { name: '재활급여 지원 규정', dept: '재활지원처' },
      { name: '직업재활 훈련 운영 기준', dept: '직업재활처' },
    ],
    ethicsContext: '산업재해 근로자 보호와 직업복귀 지원'
  },
  'SBA (서울경제진흥원)': {
    depts: ['중소기업지원처', '창업지원처', '소상공인지원처', '글로벌사업처', '경영기획처', '디지털전환지원처'],
    budgetItems: ['중소기업지원금', '창업보육비', '소상공인지원비', '글로벌사업비', '인건비'],
    scenarios: [
      { situation: '서울시 소상공인 경영난 지원', item: '지원 사업장 수', unit: '개소' },
      { situation: '청년 창업 지원 프로그램', item: '창업 기업 수', unit: '개' },
      { situation: '전통시장 활성화 사업', item: '매출 증가율', unit: '%' },
      { situation: '중소기업 디지털 전환 지원', item: '참여 기업 수', unit: '개' },
    ],
    regulations: [
      { name: '중소기업 자금지원 규정', dept: '중소기업지원처' },
      { name: '창업보육센터 운영 기준', dept: '창업지원처' },
    ],
    ethicsContext: '서울시 중소기업과 소상공인의 경쟁력 강화'
  },
  'KOTRA (대한무역투자진흥공사)': {
    depts: ['수출지원처', '투자유치처', '해외시장조사처', '무역관운영처', '디지털무역처', '경영지원처', '글로벌혁신처'],
    budgetItems: ['해외무역관운영비', '수출지원사업비', '투자유치사업비', '시장조사비', '인건비'],
    scenarios: [
      { situation: '수출 중소기업 해외진출 지원', item: '수출 상담 건수', unit: '건' },
      { situation: '외국인 직접투자(FDI) 유치', item: '투자 유치액', unit: '억달러' },
      { situation: '해외 전시회 참가 지원', item: '참가 기업 수', unit: '개' },
      { situation: '디지털 무역 플랫폼 확대', item: '온라인 수출액', unit: '억원' },
    ],
    regulations: [
      { name: '해외무역관 운영 규정', dept: '무역관운영처' },
      { name: '수출 바우처 사업 운영 기준', dept: '수출지원처' },
    ],
    ethicsContext: '대한민국 수출 경쟁력 강화와 공정한 지원'
  }
};

class QuestionGenerator {
  constructor() {
    this.name = 'QuestionGenerator';
    this.counter = 0;
    this.context = null; // 기관 컨텍스트
    this.templates = this._buildAllTemplates();
  }

  /** 기관 컨텍스트 설정 */
  setContext(context) {
    this.context = context;
  }

  /** 기관명 반환 (없으면 랜덤 기관명) */
  _orgName() {
    if (this.context && this.context.companyName) return this.context.companyName;
    const names = ['A공사', 'B공단', 'C기관', 'D공사', 'E기관', 'F공단', 'G기관', 'H공사'];
    return names[this._rand(0, names.length - 1)];
  }

  /** 기관별 부서명 */
  _orgDepts() {
    const c = this._getProfile();
    if (c) return this._shuffle([...c.depts]);
    return this._shuffle(['총무팀', '기획팀', '사업팀', '홍보팀', '인사팀', '재무팀', 'IT팀', '법무팀', '감사팀', '교육팀']);
  }

  /** 기관별 예산항목 */
  _orgBudgetItems() {
    const c = this._getProfile();
    if (c) return [...c.budgetItems];
    return ['인건비', '운영비', '사업비', '출장비', '교육비'];
  }

  /** 기관별 사업/상황 시나리오 */
  _orgScenario() {
    const c = this._getProfile();
    if (c) return c.scenarios[this._rand(0, c.scenarios.length - 1)];
    return { situation: '업무 효율화', item: '민원처리 건수', unit: '건' };
  }

  /** 기관별 규정/정책 시나리오 */
  _orgRegulation() {
    const c = this._getProfile();
    if (c) return c.regulations[this._rand(0, c.regulations.length - 1)];
    return { name: '출장 관리 규정', dept: '총무과' };
  }

  /** 기관 프로필 조회 */
  _getProfile() {
    if (!this.context || !this.context.companyName) return null;
    return INSTITUTION_PROFILES[this.context.companyName] || null;
  }

  /** 요청한 수만큼 동적 문제 생성 */
  generate(count = 10, options = {}) {
    const { areas, level } = options;
    let pool = [...this.templates];

    if (areas && areas.length) pool = pool.filter(t => areas.includes(t.area));
    if (level && level !== 'mixed') pool = pool.filter(t => t.level === level);

    this._shuffle(pool);
    const results = [];
    for (let i = 0; i < count; i++) {
      const template = pool[i % pool.length];
      results.push(this._instantiate(template));
    }
    return results;
  }

  /** 템플릿 인스턴스화 + 정답 검증 */
  _instantiate(template) {
    this.counter++;
    const id = `gen-${template.areaCode}-${Date.now().toString(36)}${this.counter.toString(36)}`;

    let q;
    if (template.generator) {
      q = { id, ...template.generator() };
    } else {
      q = { ...template.base, id };
    }

    // 정답 인덱스 유효성 검증
    if (q.choices && q.choices.length > 0) {
      if (q.answer < 0 || q.answer >= q.choices.length) {
        console.warn(`[QuestionGenerator] 잘못된 정답 인덱스 (${q.answer}) — ID: ${q.id}. 0으로 보정`);
        q.answer = 0;
      }
      const unique = new Set(q.choices.map(c => String(c).trim()));
      if (unique.size < q.choices.length) {
        console.warn(`[QuestionGenerator] 중복 보기 — ID: ${q.id}`);
      }
    }
    return q;
  }

  _buildAllTemplates() {
    return [
      ...this._mathBudgetTemplates(),
      ...this._mathGrowthTemplates(),
      ...this._mathProportionTemplates(),
      ...this._mathTableTemplates(),
      ...this._commRegulationTemplates(),
      ...this._commDocumentTemplates(),
      ...this._commStatementTemplates(),
      ...this._probSolvingTemplates(),
      ...this._probLogicTemplates(),
      ...this._resourceTemplates(),
      ...this._resourceScheduleTemplates(),
      ...this._infoTemplates(),
      ...this._infoSpreadsheetTemplates(),
      ...this._jobTemplates(),
      ...this._orgTemplates(),
      ...this._ethicsTemplates(),
      ...this._selfDevTemplates(),
      ...this._interPersonalTemplates(),
      ...this._techTemplates(),
    ];
  }

  // ════════════════════════════════════════
  //  수리능력
  // ════════════════════════════════════════

  _mathBudgetTemplates() {
    return ['beginner', 'intermediate', 'advanced'].map(level => ({
      area: '수리능력', areaCode: 'math', level,
      generator: () => {
        const depts = this._orgDepts();
        const selected = depts.slice(0, 4);
        const data = selected.map(d => {
          const budget = this._rand(200, 800) * 10;
          const exec = Math.floor(budget * (this._rand(55, 98) / 100));
          return { dept: d, budget, exec, remain: budget - exec };
        });
        const totalBudget = data.reduce((s, d) => s + d.budget, 0);
        const totalExec = data.reduce((s, d) => s + d.exec, 0);

        // 질문 유형 랜덤
        const qTypes = [
          { label: '집행률이 가장 낮은', finder: () => {
            let min = 100, dept = '';
            data.forEach(d => { const r = d.exec / d.budget * 100; if (r < min) { min = r; dept = d.dept; } });
            return dept;
          }},
          { label: '잔액이 가장 큰', finder: () => {
            let max = 0, dept = '';
            data.forEach(d => { if (d.remain > max) { max = d.remain; dept = d.dept; } });
            return dept;
          }},
          { label: '배정액 대비 집행액 비율이 가장 높은', finder: () => {
            let max = 0, dept = '';
            data.forEach(d => { const r = d.exec / d.budget * 100; if (r > max) { max = r; dept = d.dept; } });
            return dept;
          }}
        ];
        const qt = qTypes[this._rand(0, qTypes.length - 1)];
        const correctDept = qt.finder();

        const table = data.map(d =>
          `│ ${d.dept.padEnd(6)}│${String(d.budget).padStart(7)}│${String(d.exec).padStart(7)}│${String(d.remain).padStart(7)}│`
        ).join('\n');

        const choices = this._shuffle([...selected]);
        const answer = choices.indexOf(correctDept);

        return {
          area: '수리능력', subArea: '예산분석', level, type: 'PSAT형', timeLimit: level === 'advanced' ? 150 : 100,
          question: `다음은 ${this._orgName()}의 부서별 예산 현황이다. (단위: 만원)\n\n┌────────┬───────┬───────┬───────┐\n│  부서  │배정액 │집행액 │ 잔액  │\n├────────┼───────┼───────┼───────┤\n${table}\n├────────┼───────┼───────┼───────┤\n│  합계  │${String(totalBudget).padStart(7)}│${String(totalExec).padStart(7)}│${String(totalBudget - totalExec).padStart(7)}│\n└────────┴───────┴───────┴───────┘\n\n${qt.label} 부서는?`,
          choices, answer,
          explanation: data.map(d => `${d.dept}: 집행률 ${(d.exec/d.budget*100).toFixed(1)}%, 잔액 ${d.remain}`).join(', '),
          keywords: ['예산집행률', '자료해석', '대형표']
        };
      }
    }));
  }

  _mathGrowthTemplates() {
    return ['intermediate', 'advanced'].map(level => ({
      area: '수리능력', areaCode: 'math', level,
      generator: () => {
        const scn = this._orgScenario();
        const ctx = { item: scn.item, unit: scn.unit, org: this._orgName() };
        const years = [this._rand(2021, 2023), 0, 0];
        years[1] = years[0] + 1; years[2] = years[1] + 1;
        const vals = [this._rand(100, 500) * 10, 0, 0];
        vals[1] = vals[0] + this._rand(50, 200);
        vals[2] = vals[1] + this._rand(-30, 200);
        if (vals[2] < 100) vals[2] = vals[1] + this._rand(10, 100);

        const g1 = ((vals[1] - vals[0]) / vals[0] * 100).toFixed(1);
        const g2 = ((vals[2] - vals[1]) / vals[1] * 100).toFixed(1);
        const bigger = parseFloat(g1) > parseFloat(g2);

        const correctStatement = bigger
          ? `${years[1]}년의 전년대비 증가율이 ${years[2]}년보다 높다.`
          : `${years[2]}년의 전년대비 증가율이 ${years[1]}년보다 높다.`;

        const wrongStatements = [
          `${years[0]}년부터 ${years[2]}년까지 매년 감소하였다.`,
          `${years[2]}년 ${ctx.item}은 ${years[0]}년의 3배 이상이다.`,
          `연평균 증가율은 50%를 초과한다.`,
          `${years[1]}년과 ${years[2]}년의 증가율 차이는 ${(Math.abs(parseFloat(g1) - parseFloat(g2)) + 10).toFixed(1)}%p이다.`
        ];
        this._shuffle(wrongStatements);
        const choices = [correctStatement, ...wrongStatements.slice(0, 3)];
        this._shuffle(choices);

        return {
          area: '수리능력', subArea: '증감률분석', level, type: 'PSAT형', timeLimit: 120,
          question: `다음은 ${ctx.org}의 연도별 ${ctx.item} 현황이다. (단위: ${ctx.unit})\n\n${years[0]}년: ${vals[0]} → ${years[1]}년: ${vals[1]} → ${years[2]}년: ${vals[2]}\n\n다음 중 옳은 것은?`,
          choices, answer: choices.indexOf(correctStatement),
          explanation: `${years[1]}년 증가율: ${g1}%, ${years[2]}년 증가율: ${g2}%.`,
          keywords: ['증감률', '전년대비', '자료해석']
        };
      }
    }));
  }

  _mathProportionTemplates() {
    return ['beginner', 'intermediate'].map(level => ({
      area: '수리능력', areaCode: 'math', level,
      generator: () => {
        const categories = this._orgBudgetItems();
        const values = categories.map(() => this._rand(50, 400) * 10);
        const total = values.reduce((s, v) => s + v, 0);
        const proportions = values.map(v => (v / total * 100).toFixed(1));
        const maxIdx = values.indexOf(Math.max(...values));

        const correctChoice = `${categories[maxIdx]}의 비중이 가장 크다.`;
        const wrongs = [
          `${categories[(maxIdx + 1) % 5]}의 비중이 ${(parseFloat(proportions[(maxIdx + 1) % 5]) + 15).toFixed(1)}%이다.`,
          `전체 합계는 ${total + this._rand(100, 500)}만원이다.`,
          `가장 작은 항목의 비중은 ${(Math.min(...proportions.map(Number)) + 10).toFixed(1)}%이다.`
        ];
        const choices = [correctChoice, ...wrongs];
        this._shuffle(choices);

        return {
          area: '수리능력', subArea: '비중계산', level, type: 'PSAT형', timeLimit: 90,
          question: `다음은 ${this._orgName()}의 항목별 지출 내역이다. (단위: 만원)\n\n${categories.map((c, i) => `${c}: ${values[i]}`).join(', ')}\n합계: ${total}\n\n다음 중 옳은 것은?`,
          choices, answer: choices.indexOf(correctChoice),
          explanation: categories.map((c, i) => `${c}: ${proportions[i]}%`).join(', '),
          keywords: ['비중', '백분율', '자료해석']
        };
      }
    }));
  }

  /** 수리: 표 해석 + 계산 복합 */
  _mathTableTemplates() {
    return ['intermediate', 'advanced'].map(level => ({
      area: '수리능력', areaCode: 'math', level,
      generator: () => {
        const scenarios = [
          () => {
            // 할인/단가 계산
            const items = ['A4용지', '토너', '볼펜', '파일', '바인더'];
            const item = items[this._rand(0, items.length - 1)];
            const price = this._rand(5, 50) * 1000;
            const qty = this._rand(10, 100);
            const disc = this._rand(5, 25);
            const total = price * qty;
            const discAmt = Math.floor(total * disc / 100);
            const final_ = total - discAmt;
            const choices = [
              `${final_.toLocaleString()}원`,
              `${(final_ + this._rand(1, 5) * 1000).toLocaleString()}원`,
              `${(final_ - this._rand(1, 5) * 1000).toLocaleString()}원`,
              `${total.toLocaleString()}원`
            ];
            this._shuffle(choices);
            return {
              question: `${item}의 단가가 ${price.toLocaleString()}원이고 ${qty}개를 구매한다. ${disc}% 할인 적용 시 최종 결제 금액은?`,
              choices, answer: choices.indexOf(`${final_.toLocaleString()}원`),
              explanation: `총액: ${price.toLocaleString()}×${qty} = ${total.toLocaleString()}원. ${disc}% 할인: ${discAmt.toLocaleString()}원. 최종: ${final_.toLocaleString()}원.`,
              subArea: '손익분석'
            };
          },
          () => {
            // 평균/편차 계산
            const depts = ['기획팀', '사업팀', '총무팀', '홍보팀'];
            const scores = depts.map(() => this._rand(60, 95));
            const avg = (scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1);
            const maxDept = depts[scores.indexOf(Math.max(...scores))];
            const choices = [...depts];
            this._shuffle(choices);
            return {
              question: `부서별 업무 평가 점수가 다음과 같다.\n\n${depts.map((d, i) => `${d}: ${scores[i]}점`).join(', ')}\n\n평균(${avg}점) 이상이면서 가장 높은 점수를 받은 부서는?`,
              choices, answer: choices.indexOf(maxDept),
              explanation: `평균: ${avg}점. 최고점: ${maxDept} (${Math.max(...scores)}점).`,
              subArea: '통계해석'
            };
          },
          () => {
            // 비율 비교
            const y1 = this._rand(200, 400);
            const y2 = this._rand(200, 400);
            const total1 = this._rand(500, 800);
            const total2 = this._rand(500, 800);
            const r1 = (y1 / total1 * 100).toFixed(1);
            const r2 = (y2 / total2 * 100).toFixed(1);
            const higher = parseFloat(r1) > parseFloat(r2) ? '상반기' : '하반기';
            const correct = `${higher}의 목표 달성률이 더 높다.`;
            const wrongs = [
              `${higher === '상반기' ? '하반기' : '상반기'}의 달성률이 더 높다.`,
              `두 분기의 달성률 차이는 ${(Math.abs(parseFloat(r1) - parseFloat(r2)) + 5).toFixed(1)}%p이다.`,
              `두 분기 모두 달성률이 ${Math.max(parseFloat(r1), parseFloat(r2)) + 10}%를 초과한다.`
            ];
            const choices = [correct, ...wrongs];
            this._shuffle(choices);
            return {
              question: `상반기 실적 ${y1}건 (목표 ${total1}건), 하반기 실적 ${y2}건 (목표 ${total2}건)일 때, 옳은 것은?`,
              choices, answer: choices.indexOf(correct),
              explanation: `상반기 달성률: ${r1}%, 하반기 달성률: ${r2}%.`,
              subArea: '비율비교'
            };
          }
        ];
        const gen = scenarios[this._rand(0, scenarios.length - 1)]();
        return { area: '수리능력', level, type: 'PSAT형', timeLimit: 100, keywords: ['자료해석', '계산', gen.subArea], ...gen };
      }
    }));
  }

  // ════════════════════════════════════════
  //  의사소통능력
  // ════════════════════════════════════════

  _commRegulationTemplates() {
    return ['beginner', 'intermediate', 'advanced'].map(level => ({
      area: '의사소통능력', areaCode: 'comm', level,
      generator: () => {
        const regTypes = [
          () => {
            const days = this._rand(3, 14);
            const amount = this._rand(50, 500) * 10000;
            const amountStr = (amount / 10000) + '만원';
            const approver = amount >= 5000000 ? '기관장' : amount >= 1000000 ? '부서장' : '팀장';
            const reportDays = this._rand(3, 10);
            const penalty = this._rand(10, 50);
            const reg = this._orgRegulation();
            const dept = reg.dept;

            const correct = `출장 ${days}일 전에 신청서를 제출하면 적법하다.`;
            const wrongs = [
              `출장 ${days - 1}일 전에 제출해도 유효하다.`,
              `출장보고서는 종료 후 ${reportDays + 5}일까지 제출하면 된다.`,
              `${(amount / 2)}원의 출장비도 ${approver} 승인이 필요하다.`
            ];
            const choices = [correct, ...wrongs]; this._shuffle(choices);
            return {
              question: `다음은 ${dept}의 출장 관리 규정이다.\n\n제○조(출장)\n① 출장신청서는 출장 ${days}일 전까지 제출한다.\n② ${amountStr} 이상 출장비는 ${approver} 사전 승인이 필요하다.\n③ 출장보고서는 종료 후 ${reportDays}일 이내에 제출한다.\n④ 미제출 시 출장비의 ${penalty}%를 환수한다.\n\n위 규정에 부합하는 것은?`,
              choices, answer: choices.indexOf(correct),
              explanation: `${days}일 전까지 제출 필요, ${amountStr} 이상 ${approver} 승인, 보고서 ${reportDays}일 이내.`
            };
          },
          () => {
            const quorum = this._rand(5, 9);
            const approval = ['과반수', '출석위원 2/3 이상', '재적위원 과반수'][this._rand(0, 2)];
            const noticeDays = this._rand(3, 7);
            const minutesDays = this._rand(3, 7);
            const wrongNotice = noticeDays - this._rand(1, 2);

            const correct = `안건을 회의일 ${wrongNotice}일 전에 통보하면 규정 위반이다.`;
            const wrongs = [
              `안건을 회의일 ${noticeDays}일 전에 통보하면 적법하다.`,
              `위원장이 긴급 안건에 대해 임시회의를 소집할 수 있다.`,
              `회의록은 ${minutesDays}일 이내 작성·배포해야 한다.`
            ];
            const choices = [correct, ...wrongs]; this._shuffle(choices);
            return {
              question: `다음은 위원회 운영 규정이다.\n\n제○조(회의)\n① 위원회는 재적위원 ${quorum}인 이상 출석으로 개의한다.\n② 의결은 ${approval}의 찬성으로 한다.\n③ 안건은 회의일 ${noticeDays}일 전까지 각 위원에게 통보한다.\n④ 회의록은 회의 후 ${minutesDays}일 이내 작성한다.\n\n위 규정에 대한 설명으로 옳은 것은?`,
              choices, answer: choices.indexOf(correct),
              explanation: `안건 통보 기한은 ${noticeDays}일 전까지이므로 ${wrongNotice}일 전은 위반.`
            };
          },
          () => {
            const storeDays = this._rand(3, 10);
            const keepYears = this._rand(3, 10);
            const classes = ['1급 비밀', '2급 비밀', '3급 비밀', '대외비'][this._rand(0, 3)];
            const handler = ['보안담당관', '문서관리자', '부서장'][this._rand(0, 2)];

            const correct = `${classes} 문서의 보존기간은 ${keepYears}년이다.`;
            const wrongs = [
              `${classes} 문서의 보존기간은 ${keepYears + 3}년이다.`,
              `비밀문서는 일반문서와 같은 장소에 보관할 수 있다.`,
              `비밀문서 열람 시 별도의 승인 절차가 필요하지 않다.`
            ];
            const choices = [correct, ...wrongs]; this._shuffle(choices);
            return {
              question: `다음은 문서 보안 관리 규정이다.\n\n제○조(비밀문서)\n① ${classes} 문서는 이중 잠금장치가 있는 보관함에 보관한다.\n② 열람 시 ${handler}의 사전 승인을 받아야 한다.\n③ 보존기간은 ${keepYears}년이며, 기간 만료 시 파기한다.\n④ 복사 및 외부 반출은 원칙적으로 금지한다.\n\n위 규정에 대한 설명으로 옳은 것은?`,
              choices, answer: choices.indexOf(correct),
              explanation: `${classes}의 보존기간은 ${keepYears}년.`
            };
          }
        ];
        const gen = regTypes[this._rand(0, regTypes.length - 1)]();
        return {
          area: '의사소통능력', subArea: '규정해석', level,
          type: level === 'beginner' ? '피듈형' : 'PSAT형', timeLimit: level === 'advanced' ? 120 : 90,
          keywords: ['규정해석', '기한판단', '세부조건'], ...gen
        };
      }
    }));
  }

  _commDocumentTemplates() {
    return ['beginner', 'intermediate'].map(level => ({
      area: '의사소통능력', areaCode: 'comm', level,
      generator: () => {
        const scenarios = [
          () => {
            const events = ['건강검진', '정보보안교육', '소방훈련', '성희롱예방교육', '직장내괴롭힘교육', '개인정보보호교육'];
            const event = events[this._rand(0, events.length - 1)];
            const month = this._rand(3, 11);
            const day = this._rand(1, 20);
            const endDay = day + this._rand(7, 8);
            const exception = ['수습직원', '휴직자', '파견직원', '육아휴직자'][this._rand(0, 3)];
            const penalty = ['인사고과 반영', '복리후생 차감', '시말서 제출', '추가교육 이수'][this._rand(0, 3)];

            const particle = /[로러루르을릴률]$/.test(exception) ? '은' : /[가나다라마바사아자차카타파하]$/.test(exception) ? '는' : '은(는)';
            const correct = `${exception}${particle} 이번 ${event} 대상에서 제외된다.`;
            const wrongs = [
              `${event} 이수 기간은 ${month}월 ${endDay + 5}일까지이다.`,
              `미이수자에 대한 별도의 조치 사항은 없다.`,
              `계약직 직원은 ${event} 대상에 포함되지 않는다.`
            ];
            const choices = [correct, ...wrongs]; this._shuffle(choices);
            return {
              question: `다음 공지를 읽고 옳은 것을 고르시오.\n\n[공지] ${month}월 ${event} 안내\n1. 대상: 전 직원 (단, ${exception} 제외)\n2. 기간: ${month}월 ${day}일 ~ ${month}월 ${endDay}일\n3. 미이수 시: ${penalty}`,
              choices, answer: choices.indexOf(correct),
              explanation: `${exception} 제외, 기간 ${month}월 ${endDay}일까지, 미이수 시 ${penalty}.`
            };
          },
          () => {
            const purpose = ['사무실 이전', '시스템 점검', '냉난방기 교체', '네트워크 업그레이드'][this._rand(0, 3)];
            const date = `${this._rand(3, 11)}월 ${this._rand(10, 25)}일`;
            const hours = `${this._rand(9, 14)}:00 ~ ${this._rand(17, 22)}:00`;
            const floor = `${this._rand(3, 15)}층`;
            const contact = ['총무팀', '시설관리팀', 'IT지원팀'][this._rand(0, 2)];

            const correct = `${purpose} 작업은 ${date}에 진행된다.`;
            const wrongs = [
              `작업은 전 층에서 동시에 진행된다.`,
              `작업 중에도 해당 시설을 정상 이용할 수 있다.`,
              `문의처는 인사팀이다.`
            ];
            const choices = [correct, ...wrongs]; this._shuffle(choices);
            return {
              question: `다음 공지를 읽고 옳은 것을 고르시오.\n\n[안내] ${purpose} 일정\n1. 일시: ${date} ${hours}\n2. 대상: ${floor}\n3. 작업 중 해당 층 출입 제한\n4. 문의: ${contact}`,
              choices, answer: choices.indexOf(correct),
              explanation: `${purpose}은 ${date} ${hours}에 ${floor}에서 진행, 문의는 ${contact}.`
            };
          }
        ];
        const gen = scenarios[this._rand(0, scenarios.length - 1)]();
        return {
          area: '의사소통능력', subArea: '문서이해', level, type: '피듈형', timeLimit: 80,
          keywords: ['공지사항', '문서이해', '단서조건'], ...gen
        };
      }
    }));
  }

  /** 의사소통: ㄱㄴㄷ 보기형 (NCS 핵심 출제패턴) */
  _commStatementTemplates() {
    return ['intermediate', 'advanced'].map(level => ({
      area: '의사소통능력', areaCode: 'comm', level,
      generator: () => {
        const scenarios = [
          () => {
            const topic = '공문서 작성';
            const statements = [
              { text: '공문서의 날짜는 "2026. 4. 8."과 같이 마침표로 구분하며, 마지막에도 마침표를 찍는다.', correct: true },
              { text: '첨부물이 있는 경우 본문 끝에 "끝"을 쓰지 않고, 첨부 표시 다음 줄에 "끝"을 쓴다.', correct: true },
              { text: '공문서의 두문에는 발신자의 개인 휴대전화 번호를 기재해야 한다.', correct: false },
              { text: '공문서에서 항목 구분 시 첫째 항목은 1., 둘째는 가., 셋째는 1) 순으로 표기한다.', correct: true }
            ];
            return { topic, statements };
          },
          () => {
            const topic = '회의록 작성';
            const statements = [
              { text: '회의록에는 회의 일시, 장소, 참석자, 안건, 결정사항이 포함되어야 한다.', correct: true },
              { text: '회의록은 비공개 회의인 경우 작성하지 않아도 된다.', correct: false },
              { text: '회의 중 발언 내용은 발언자의 동의 없이 기록할 수 없다.', correct: false },
              { text: '회의록 작성 후 참석자의 확인 서명을 받는 것이 원칙이다.', correct: true }
            ];
            return { topic, statements };
          },
          () => {
            const topic = '업무 보고서 작성';
            const statements = [
              { text: '보고서의 결론은 서론보다 앞에 배치하여 핵심을 먼저 전달하는 것이 효과적이다.', correct: true },
              { text: '수치 데이터는 그래프나 표로 시각화하면 이해도가 높아진다.', correct: true },
              { text: '보고서 분량이 많을수록 충실한 보고서로 평가받는다.', correct: false },
              { text: '보고서에 개인적 의견을 포함할 때는 사실과 구분하여 명시해야 한다.', correct: true }
            ];
            return { topic, statements };
          },
          () => {
            const topic = '이메일 작성 예절';
            const statements = [
              { text: '업무 메일의 제목은 내용을 요약하여 구체적으로 작성한다.', correct: true },
              { text: '참조(CC)에 포함된 수신자는 메일 내용에 대한 결재 책임이 있다.', correct: false },
              { text: '대용량 첨부파일은 클라우드 링크로 대체하는 것이 바람직하다.', correct: true },
              { text: '회신(Reply) 시 원문을 항상 삭제한 후 보내는 것이 예절이다.', correct: false }
            ];
            return { topic, statements };
          }
        ];
        const s = scenarios[this._rand(0, scenarios.length - 1)]();
        this._shuffle(s.statements);
        const picked = s.statements.slice(0, 4);
        const labels = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ'];
        const correctLabels = picked.filter(st => st.correct).map((_, i) => {
          const idx = picked.indexOf(picked.filter(st => st.correct)[i]);
          return labels[idx];
        });
        // Recalculate correctly
        const correctOnes = [];
        picked.forEach((st, i) => { if (st.correct) correctOnes.push(labels[i]); });

        const correctStr = correctOnes.join(', ');
        const allCombos = this._generateCombos(labels, correctOnes);
        const choices = allCombos.slice(0, 4);
        if (!choices.includes(correctStr)) { choices[0] = correctStr; }
        this._shuffle(choices);

        return {
          area: '의사소통능력', subArea: '문서작성', level, type: 'PSAT형', timeLimit: 100,
          question: `다음 중 ${s.topic}에 대한 설명으로 옳은 것을 모두 고르면?\n\n${picked.map((st, i) => `${labels[i]}. ${st.text}`).join('\n')}`,
          choices, answer: choices.indexOf(correctStr),
          explanation: `옳은 것: ${correctStr}. ` + picked.map((st, i) => `${labels[i]}: ${st.correct ? 'O' : 'X'}`).join(', '),
          keywords: ['ㄱㄴㄷ보기', s.topic, '문서이해']
        };
      }
    }));
  }

  // ════════════════════════════════════════
  //  문제해결능력
  // ════════════════════════════════════════

  _probSolvingTemplates() {
    return ['intermediate', 'advanced'].map(level => ({
      area: '문제해결능력', areaCode: 'prob', level,
      generator: () => {
        const scenarios = [
          { situation: '민원처리 지연', criteria: ['긴급도', '영향범위', '해결가능성', '비용'],
            correct: '긴급도와 영향범위를 우선 고려하여 다수에게 영향을 미치는 민원부터 처리한다.',
            wrongs: ['접수 순서를 기준으로 선입선출 방식으로 순차 처리한다.', '비용 효율이 가장 높은 민원을 선별하여 우선 처리한다.', '해결 난이도가 낮은 민원부터 처리하여 처리 건수를 높인다.'] },
          { situation: '시스템 장애 발생', criteria: ['복구시간', '사용자수', '대체수단', '데이터손실위험'],
            correct: '사용자수와 데이터손실위험을 기준으로 우선순위를 정해 복구한다.',
            wrongs: ['가용 인력을 모든 시스템에 균등 배분하여 동시에 복구한다.', '복구 소요시간이 짧은 시스템부터 처리하여 가용률을 높인다.', '대체수단이 확보된 시스템은 별도 기한 없이 보류 처리한다.'] },
          { situation: '예산 삭감 대응', criteria: ['필수도', '법적의무', '성과기여도', '이해관계자영향'],
            correct: '법적 의무 사업은 유지하고, 성과기여도가 낮은 사업부터 조정한다.',
            wrongs: ['모든 사업의 예산을 동일 비율로 일괄 삭감하여 형평성을 유지한다.', '인건비 비중이 가장 큰 부서의 예산을 최우선으로 삭감한다.', '성과기여도가 높은 사업을 삭감하여 부서 간 균형을 맞춘다.'] },
          { situation: '고객 불만 급증', criteria: ['불만원인', '재발가능성', '브랜드영향', '대응비용'],
            correct: '불만 원인 분석 후 재발 가능성과 브랜드 영향이 큰 문제부터 해결한다.',
            wrongs: ['불만 접수 고객 전원에게 동일한 금액의 보상금을 일괄 지급한다.', '불만 건수가 적은 유형부터 처리하여 미처리 유형 수를 줄인다.', '과거 사례를 참고하여 불만이 자연 감소할 때까지 추이를 관망한다.'] },
          { situation: '인력 부족 상황', criteria: ['업무긴급도', '전문성요구', '외주가능성', '법정기한'],
            correct: '법정기한 업무를 최우선 배정하고 외주 가능한 업무는 외부 위탁을 검토한다.',
            wrongs: ['전 직원에게 초과근무를 지시하여 부족 인력을 보충한다.', '업무량을 개인별로 균등 분배하여 공평성을 최우선 확보한다.', '신규 직원 채용 절차가 완료될 때까지 비긴급 업무를 전면 보류한다.'] },
          { situation: '정보 유출 사고', criteria: ['유출범위', '정보민감도', '법적책임', '이해관계자통보'],
            correct: '유출 경로를 즉시 차단하고 관련 법령에 따라 감독기관과 피해자에게 통보한다.',
            wrongs: ['내부 조사를 완료한 뒤 그 결과를 바탕으로 감독기관에 보고한다.', '유출 사실의 외부 공개를 최소화하여 기관의 대외 이미지를 보호한다.', '법무팀의 법적 검토가 완료될 때까지 별도의 대응 조치를 보류한다.'] }
        ];
        const s = scenarios[this._rand(0, scenarios.length - 1)];
        const choices = [s.correct, ...s.wrongs]; this._shuffle(choices);
        return {
          area: '문제해결능력', subArea: '우선순위결정', level, type: 'PSAT형', timeLimit: 100,
          question: `${this._orgName()}에서 '${s.situation}' 상황이 발생하였다. 고려 기준: ${s.criteria.join(', ')}.\n\n가장 적절한 대응 방안은?`,
          choices, answer: choices.indexOf(s.correct),
          explanation: `${s.criteria[0]}와 ${s.criteria[1]}을 우선 고려하는 것이 합리적.`,
          keywords: ['우선순위', '의사결정', '상황판단']
        };
      }
    }));
  }

  /** 문제해결: 논리추론 (PSAT형 핵심) */
  _probLogicTemplates() {
    return ['intermediate', 'advanced'].map(level => ({
      area: '문제해결능력', areaCode: 'prob', level,
      generator: () => {
        const scenarios = [
          () => {
            // 조건 추론
            const names = ['김', '이', '박', '최', '정'];
            this._shuffle(names);
            const [a, b, c, d] = names;
            const depts = ['기획팀', '사업팀', '총무팀', '인사팀'];
            this._shuffle(depts);

            const correct = `${a}은(는) ${depts[0]}에 배치된다.`;
            const wrongs = [
              `${b}은(는) ${depts[0]}에 배치된다.`,
              `${c}은(는) ${depts[1]}에 배치된다.`,
              `${a}과(와) ${b}은(는) 같은 팀에 배치된다.`
            ];
            const choices = [correct, ...wrongs]; this._shuffle(choices);
            return {
              question: `다음 조건에 따라 4명을 배치할 때, 반드시 참인 것은?\n\n• ${a}은(는) ${depts[2]}이나 ${depts[3]}에 배치할 수 없다.\n• ${b}은(는) ${depts[1]}에 배치한다.\n• ${c}과(와) ${d}은(는) 같은 팀에 배치할 수 없다.\n• 각 팀에는 최소 1명 이상 배치한다.`,
              choices, answer: choices.indexOf(correct),
              explanation: `${a}은(는) ${depts[2]}, ${depts[3]} 불가이고 ${b}이(가) ${depts[1]}이므로, ${a}은(는) ${depts[0]}에 배치.`,
              subArea: '조건추론'
            };
          },
          () => {
            // 순서 추론
            const tasks = ['보고서 작성', '데이터 수집', '분석', '검토', '최종 제출'];
            const correct = '데이터 수집 → 분석 → 보고서 작성 → 검토 → 최종 제출';
            const wrongs = [
              '보고서 작성 → 데이터 수집 → 분석 → 검토 → 최종 제출',
              '데이터 수집 → 보고서 작성 → 분석 → 최종 제출 → 검토',
              '분석 → 데이터 수집 → 검토 → 보고서 작성 → 최종 제출'
            ];
            const choices = [correct, ...wrongs]; this._shuffle(choices);
            return {
              question: `다음 조건에 맞는 업무 순서는?\n\n• 분석은 데이터 수집 후에만 가능하다.\n• 보고서는 분석이 완료된 후 작성한다.\n• 검토는 보고서 작성 후에 한다.\n• 최종 제출은 검토 후 마지막에 한다.`,
              choices, answer: choices.indexOf(correct),
              explanation: `조건에 따라: 수집→분석→작성→검토→제출.`,
              subArea: '순서추론'
            };
          },
          () => {
            // 참/거짓 추론
            const people = ['A', 'B', 'C', 'D'];
            const correct = 'C의 진술이 거짓이다.';
            const wrongs = ['A의 진술이 거짓이다.', 'B의 진술이 거짓이다.', 'D의 진술이 거짓이다.'];
            const choices = [correct, ...wrongs]; this._shuffle(choices);
            return {
              question: `4명 중 1명만 거짓말을 하고 있다. 거짓말쟁이는?\n\nA: "나는 범인이 아니다."\nB: "C가 거짓말을 하고 있다."\nC: "A가 범인이다."\nD: "나는 B의 말이 맞다고 생각한다."`,
              choices, answer: choices.indexOf(correct),
              explanation: `B와 D가 C를 지목하고, A가 자신은 아니라고 함. C가 거짓이면 모순 없음.`,
              subArea: '참거짓추론'
            };
          }
        ];
        const gen = scenarios[this._rand(0, scenarios.length - 1)]();
        return {
          area: '문제해결능력', level, type: 'PSAT형', timeLimit: level === 'advanced' ? 150 : 120,
          keywords: ['논리추론', gen.subArea, 'PSAT'], ...gen
        };
      }
    }));
  }

  // ════════════════════════════════════════
  //  자원관리능력
  // ════════════════════════════════════════

  _resourceTemplates() {
    return ['beginner', 'intermediate', 'advanced'].map(level => ({
      area: '자원관리능력', areaCode: 'res', level,
      generator: () => {
        const totalBudget = this._rand(5, 20) * 1000;
        const budgetItems = this._orgBudgetItems();
        const items = budgetItems.length >= 4 ? budgetItems.slice(0, 4) : ['인건비', '시설비', '운영비', '사업비'];
        const ratios = [this._rand(30, 50), this._rand(15, 25), this._rand(10, 20), 0];
        ratios[3] = 100 - ratios[0] - ratios[1] - ratios[2];
        if (ratios[3] < 5) { ratios[2] -= 5; ratios[3] += 5; }

        const amounts = ratios.map(r => Math.round(totalBudget * r / 100));
        const largest = items[ratios.indexOf(Math.max(...ratios))];

        const correct = `${largest}이(가) 전체 예산의 가장 큰 비중을 차지한다.`;
        const wrongs = [
          `${items[2]}는 전체 예산의 ${ratios[2] + 15}%를 차지한다.`,
          `${items[3]}은 ${amounts[3] + 500}만원이다.`,
          `${items[0]}와 ${items[1]}의 합은 전체의 ${ratios[0] + ratios[1] + 10}%이다.`
        ];
        const choices = [correct, ...wrongs]; this._shuffle(choices);

        return {
          area: '자원관리능력', subArea: '예산배분', level, type: 'PSAT형', timeLimit: 90,
          question: `${this._orgName()} 총 예산 ${totalBudget}만원의 배분 현황이다.\n\n${items.map((it, i) => `${it}: ${ratios[i]}% (${amounts[i]}만원)`).join('\n')}\n\n옳은 것은?`,
          choices, answer: choices.indexOf(correct),
          explanation: items.map((it, i) => `${it}: ${ratios[i]}%`).join(', '),
          keywords: ['예산배분', '비중분석', '자원관리']
        };
      }
    }));
  }

  /** 자원관리: 일정/인력 배분 */
  _resourceScheduleTemplates() {
    return ['intermediate', 'advanced'].map(level => ({
      area: '자원관리능력', areaCode: 'res', level,
      generator: () => {
        const scenarios = [
          () => {
            const total = this._rand(5, 12);
            const projA = this._rand(2, Math.floor(total / 2));
            const projB = this._rand(2, total - projA - 1);
            const projC = total - projA - projB;
            const projects = ['A프로젝트', 'B프로젝트', 'C프로젝트'];
            const alloc = [projA, projB, projC];
            const deadlines = [this._rand(1, 3), this._rand(2, 4), this._rand(3, 5)].map(m => `${m}개월`);
            const perPerson = alloc.map((a, i) => (parseInt(deadlines[i]) / a).toFixed(1));
            const minVal = Math.min(...perPerson.map(Number));
            const mostEfficient = projects[perPerson.indexOf(minVal.toFixed(1))];

            const correct = `인력 대비 기간이 가장 효율적인 프로젝트는 ${mostEfficient}이다.`;
            const wrongs = [
              `${projects[0]}에 인력을 추가 배치하면 기간이 반으로 줄어든다.`,
              `${projects[1]}은 ${alloc[1] + 2}명이 필요하다.`,
              `전체 인력이 ${total + 3}명이면 모든 프로젝트를 동시에 완료할 수 있다.`
            ];
            const choices = [correct, ...wrongs]; this._shuffle(choices);
            return {
              question: `총 ${total}명의 인력을 3개 프로젝트에 배분한다.\n\n${projects.map((p, i) => `${p}: ${alloc[i]}명, 기한 ${deadlines[i]}`).join('\n')}\n\n옳은 것은?`,
              choices, answer: choices.indexOf(correct),
              explanation: projects.map((p, i) => `${p}: 1인당 ${perPerson[i]}개월`).join(', '),
              subArea: '인력배분'
            };
          },
          () => {
            const rooms = this._rand(3, 6);
            const meetings = this._rand(5, 10);
            const hours = this._rand(8, 10);
            const maxCapacity = rooms * hours;
            const used = this._rand(Math.floor(maxCapacity * 0.6), maxCapacity - 2);
            const utilRate = (used / maxCapacity * 100).toFixed(1);

            const correct = `회의실 가동률은 ${utilRate}%이다.`;
            const wrongs = [
              `회의실 가동률은 ${(parseFloat(utilRate) + 10).toFixed(1)}%이다.`,
              `하루 최대 수용 가능 시간은 ${maxCapacity + rooms}시간이다.`,
              `회의실 ${rooms + 2}개가 있으면 가동률은 100%가 된다.`
            ];
            const choices = [correct, ...wrongs]; this._shuffle(choices);
            return {
              question: `회의실 ${rooms}개, 운영시간 1일 ${hours}시간이다. 오늘 총 ${used}시간이 사용되었다.\n\n옳은 것은?`,
              choices, answer: choices.indexOf(correct),
              explanation: `최대 가용시간: ${rooms}×${hours}=${maxCapacity}시간. 가동률: ${used}/${maxCapacity}×100=${utilRate}%.`,
              subArea: '시설관리'
            };
          }
        ];
        const gen = scenarios[this._rand(0, scenarios.length - 1)]();
        return {
          area: '자원관리능력', level, type: 'PSAT형', timeLimit: 100,
          keywords: ['자원배분', gen.subArea, '효율성'], ...gen
        };
      }
    }));
  }

  // ════════════════════════════════════════
  //  정보능력 (시나리오 풀 확장)
  // ════════════════════════════════════════

  _infoTemplates() {
    return ['beginner', 'intermediate', 'advanced'].map(level => ({
      area: '정보능력', areaCode: 'info', level,
      generator: () => {
        const pools = {
          beginner: [
            { q: '다음 중 컴퓨터 바이러스 감염을 예방하는 방법으로 가장 적절한 것은?',
              correct: '출처가 불분명한 이메일의 첨부파일을 열지 않는다.',
              wrongs: ['업무용 PC와 개인용 PC를 같은 네트워크에 연결한다.', '보안 업데이트는 업무에 지장이 없을 때만 설치한다.', '자주 쓰는 프로그램은 편의를 위해 관리자 권한으로 실행한다.'], sub: '정보보안' },
            { q: '개인정보보호법에 따른 개인정보에 해당하지 않는 것은?',
              correct: '법인의 사업자등록번호',
              wrongs: ['주민등록번호', '휴대전화번호', '이메일 주소'], sub: '정보보안' },
            { q: '다음 중 피싱(Phishing) 공격의 특징으로 옳은 것은?',
              correct: '정상적인 기관을 사칭하여 개인정보를 탈취하려는 시도이다.',
              wrongs: ['컴퓨터의 처리 속도를 저하시키는 공격이다.', '물리적으로 서버를 파괴하는 행위이다.', '네트워크 대역폭을 점유하는 공격이다.'], sub: '정보보안' },
            { q: '스프레드시트에서 셀 범위 A1:A10의 합계를 구하는 함수는?',
              correct: 'SUM(A1:A10)',
              wrongs: ['ADD(A1:A10)', 'TOTAL(A1:A10)', 'COUNT(A1:A10)'], sub: '컴퓨터활용' },
            { q: '운영체제(OS)의 역할로 적절하지 않은 것은?',
              correct: '문서의 내용을 자동으로 번역한다.',
              wrongs: ['하드웨어 자원을 관리한다.', '프로그램 실행 환경을 제공한다.', '파일 시스템을 관리한다.'], sub: '컴퓨터활용' }
          ],
          intermediate: [
            { q: 'SQL 인젝션 공격을 방지하는 방법으로 가장 적절한 것은?',
              correct: '매개변수화된 쿼리(Prepared Statement)를 사용한다.',
              wrongs: ['비밀번호를 주기적으로 변경한다.', '방화벽을 설치한다.', 'HTTP 대신 FTP를 사용한다.'], sub: '정보보안' },
            { q: '다음 중 개인정보의 기술적 보호 조치로 적절하지 않은 것은?',
              correct: '개인정보를 평문으로 데이터베이스에 저장한다.',
              wrongs: ['전송 시 SSL/TLS 암호화를 적용한다.', '접근 권한을 최소한으로 부여한다.', '접속 기록을 6개월 이상 보관한다.'], sub: '정보보안' },
            { q: 'VLOOKUP 함수의 설명으로 옳은 것은?',
              correct: '지정 범위의 첫 번째 열에서 값을 찾아 같은 행의 다른 열 값을 반환한다.',
              wrongs: ['지정된 셀 범위에 포함된 모든 숫자의 합계를 계산하여 반환한다.', '주어진 조건을 만족하는 셀의 개수를 계산하여 정수로 반환한다.', '셀에 입력된 텍스트 문자열을 수치 데이터로 변환하여 반환한다.'], sub: '컴퓨터활용' },
            { q: '클라우드 컴퓨팅의 서비스 모델 중 IaaS에 해당하는 것은?',
              correct: '가상 서버, 스토리지, 네트워크 등 인프라를 제공하는 서비스',
              wrongs: ['완성된 소프트웨어를 인터넷으로 제공하는 서비스', '개발 플랫폼과 도구를 제공하는 서비스', '데이터 분석 알고리즘만 제공하는 서비스'], sub: '정보기술' },
            { q: '데이터베이스에서 정규화(Normalization)의 주된 목적은?',
              correct: '데이터 중복을 최소화하고 무결성을 유지한다.',
              wrongs: ['데이터 검색 속도를 최대화한다.', '데이터베이스 용량을 줄인다.', '사용자 인터페이스를 개선한다.'], sub: '정보기술' }
          ],
          advanced: [
            { q: '랜섬웨어 감염 시 가장 우선해야 할 조치는?',
              correct: '감염 시스템을 네트워크에서 즉시 분리한다.',
              wrongs: ['해커에게 몸값을 지불한다.', '감염 파일을 직접 삭제한다.', '백신으로 전체 스캔을 실행한다.'], sub: '정보보안' },
            { q: '제로데이(Zero-day) 취약점에 대한 설명으로 옳은 것은?',
              correct: '소프트웨어 제조사가 아직 패치를 제공하지 못한 보안 취약점이다.',
              wrongs: ['발견된 지 하루 이내에 패치되는 취약점이다.', '공격에 사용될 가능성이 0%인 취약점이다.', '네트워크 장비에서만 발견되는 취약점이다.'], sub: '정보보안' },
            { q: 'DDoS 공격에 대한 설명으로 옳은 것은?',
              correct: '다수의 시스템에서 동시에 트래픽을 전송하여 서비스를 마비시키는 공격이다.',
              wrongs: ['한 대의 컴퓨터에서 비밀번호를 무차별 대입하는 공격이다.', '웹 페이지에 악성 스크립트를 삽입하는 공격이다.', '네트워크 패킷을 도청하는 공격이다.'], sub: '정보보안' },
            { q: '블록체인 기술의 특성으로 옳지 않은 것은?',
              correct: '중앙 관리 서버가 모든 거래를 승인하고 기록한다.',
              wrongs: ['분산 원장 기술을 기반으로 한다.', '한번 기록된 데이터는 변경이 매우 어렵다.', '합의 알고리즘을 통해 거래를 검증한다.'], sub: '정보기술' }
          ]
        };
        const pool = pools[level] || pools.intermediate;
        const c = pool[this._rand(0, pool.length - 1)];
        const choices = [c.correct, ...c.wrongs]; this._shuffle(choices);
        return {
          area: '정보능력', subArea: c.sub, level, type: level === 'beginner' ? '피듈형' : 'PSAT형', timeLimit: 80,
          question: c.q, choices, answer: choices.indexOf(c.correct),
          explanation: `정답: ${c.correct}`,
          keywords: ['정보능력', c.sub]
        };
      }
    }));
  }

  /** 정보능력: 스프레드시트 실무 계산 */
  _infoSpreadsheetTemplates() {
    return ['beginner', 'intermediate'].map(level => ({
      area: '정보능력', areaCode: 'info', level,
      generator: () => {
        const scenarios = [
          () => {
            const vals = Array.from({ length: 5 }, () => this._rand(60, 100));
            const avg = (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1);
            const func = 'AVERAGE';
            const correct = `${avg}`;
            const wrongs = [
              `${(parseFloat(avg) + this._rand(2, 5)).toFixed(1)}`,
              `${(parseFloat(avg) - this._rand(2, 5)).toFixed(1)}`,
              `${vals.reduce((s, v) => s + v, 0)}`
            ];
            const choices = [correct, ...wrongs]; this._shuffle(choices);
            return {
              question: `셀 B2~B6에 값 ${vals.join(', ')}이 입력되어 있다.\n=AVERAGE(B2:B6)의 결과값은?`,
              choices, answer: choices.indexOf(correct),
              explanation: `합계: ${vals.reduce((s, v) => s + v, 0)}, 개수: 5, 평균: ${avg}`,
              sub: '컴퓨터활용'
            };
          },
          () => {
            const val = this._rand(10000, 99999);
            const roundTo = [10, 100, 1000][this._rand(0, 2)];
            const rounded = Math.round(val / roundTo) * roundTo;
            const correct = `${rounded}`;
            const wrongs = [
              `${Math.floor(val / roundTo) * roundTo}`,
              `${Math.ceil(val / roundTo) * roundTo}`,
              `${val}`
            ];
            // Ensure unique
            const uniqueWrongs = [...new Set(wrongs)].filter(w => w !== correct).slice(0, 3);
            let offset = 1;
            while (uniqueWrongs.length < 3) {
              const filler = `${rounded + roundTo * offset}`;
              if (filler !== correct && !uniqueWrongs.includes(filler)) uniqueWrongs.push(filler);
              offset++;
            }
            const choices = [correct, ...uniqueWrongs]; this._shuffle(choices);
            return {
              question: `=ROUND(${val}, -${Math.log10(roundTo)})의 결과값은?`,
              choices, answer: choices.indexOf(correct),
              explanation: `${val}을 ${roundTo}의 자리에서 반올림하면 ${rounded}.`,
              sub: '컴퓨터활용'
            };
          },
          () => {
            const score = this._rand(50, 100);
            const pass = this._rand(60, 80);
            const result = score >= pass ? '합격' : '불합격';
            const correct = result;
            const wrongs = [result === '합격' ? '불합격' : '합격', 'TRUE', `${score}`];
            const choices = [correct, ...wrongs]; this._shuffle(choices);
            return {
              question: `A1에 ${score}이 입력되어 있을 때,\n=IF(A1>=${pass}, "합격", "불합격")의 결과는?`,
              choices, answer: choices.indexOf(correct),
              explanation: `${score} ${score >= pass ? '>=' : '<'} ${pass}이므로 "${result}".`,
              sub: '컴퓨터활용'
            };
          }
        ];
        const gen = scenarios[this._rand(0, scenarios.length - 1)]();
        return {
          area: '정보능력', level, type: '피듈형', timeLimit: 70,
          keywords: ['스프레드시트', gen.sub, '함수'], ...gen
        };
      }
    }));
  }

  // ════════════════════════════════════════
  //  직무수행능력 (통합 시나리오 풀)
  // ════════════════════════════════════════

  _jobTemplates() {
    const allConcepts = [
      // 경영학
      { q: '매슬로의 욕구단계이론에서 가장 상위 욕구는?', correct: '자아실현 욕구',
        wrongs: ['안전 욕구', '소속 욕구', '존경 욕구'], sub: '조직행동론', level: 'beginner' },
      { q: 'BCG 매트릭스에서 시장성장률이 높고 시장점유율이 낮은 사업은?',
        correct: '물음표(Question Mark)', wrongs: ['스타(Star)', '캐시카우(Cash Cow)', '개(Dog)'], sub: '경영전략', level: 'intermediate' },
      { q: 'Y이론에 따르면 사람은?', correct: '자기지시와 자기통제가 가능하다.',
        wrongs: ['본질적으로 일을 싫어한다.', '외부 통제 없이는 일하지 않는다.', '책임 회피를 선호한다.'], sub: '조직행동론', level: 'intermediate' },
      { q: 'PEST 분석의 4가지 환경 요인은?',
        correct: '정치적, 경제적, 사회적, 기술적',
        wrongs: ['가격, 환율, 공급, 무역', '인구, 교육, 안보, 기술', '정부, 윤리, 전략, 세금'], sub: '경영전략', level: 'beginner' },
      { q: 'SWOT 분석에서 외부 환경 요인에 해당하는 것은?',
        correct: '기회(Opportunity)와 위협(Threat)',
        wrongs: ['강점(Strength)과 기회(Opportunity)', '강점(Strength)과 약점(Weakness)', '약점(Weakness)과 위협(Threat)'], sub: '경영전략', level: 'beginner' },
      { q: '균형성과표(BSC)의 4가지 관점에 해당하지 않는 것은?',
        correct: '기술 혁신 관점',
        wrongs: ['재무 관점', '고객 관점', '학습과 성장 관점'], sub: '경영전략', level: 'intermediate' },
      // 경제학
      { q: '수요곡선이 우하향하는 이유는?', correct: '한계효용체감의 법칙',
        wrongs: ['수확체감의 법칙', '세이의 법칙', '그레셤의 법칙'], sub: '미시경제학', level: 'beginner' },
      { q: '경기침체 시 확장적 통화정책으로 옳은 것은?',
        correct: '기준금리 인하', wrongs: ['기준금리 인상', '지급준비율 인상', '국채 매각'], sub: '거시경제학', level: 'intermediate' },
      { q: 'GDP 디플레이터에 대한 설명으로 옳은 것은?',
        correct: '명목GDP를 실질GDP로 나눈 후 100을 곱한 값이다.',
        wrongs: ['실질GDP를 명목GDP로 나눈 값이다.', 'CPI와 동일한 개념이다.', '수입품 가격만 반영한다.'], sub: '거시경제학', level: 'advanced' },
      { q: '완전경쟁시장의 특성으로 옳지 않은 것은?',
        correct: '개별 기업이 시장 가격에 영향력을 행사할 수 있다.',
        wrongs: ['다수의 공급자와 수요자가 존재한다.', '제품의 동질성이 있다.', '진입과 퇴출이 자유롭다.'], sub: '미시경제학', level: 'intermediate' },
      { q: '공공재의 특성으로 옳은 것은?',
        correct: '비배제성과 비경합성을 갖는다.',
        wrongs: ['배제성과 경합성을 갖는다.', '비배제성과 경합성을 갖는다.', '배제성과 비경합성을 갖는다.'], sub: '미시경제학', level: 'intermediate' },
      // 행정학
      { q: '통솔범위(Span of Control)에 대한 설명으로 옳은 것은?',
        correct: '한 관리자가 효과적으로 감독할 수 있는 부하의 수에는 한계가 있다.',
        wrongs: ['모든 권한은 최고관리자에게 집중되어야 한다.', '같은 업무 직원은 한 부서에 소속되어야 한다.', '모든 구성원은 동일한 보상을 받아야 한다.'], sub: '조직론', level: 'intermediate' },
      { q: '신공공관리론(NPM)의 핵심 원리와 거리가 먼 것은?',
        correct: '규칙과 절차 준수를 통한 투입 중심의 통제 강화',
        wrongs: ['산출과 결과를 기준으로 한 성과 중심 관리', '민간 부문의 시장 메커니즘을 공공 부문에 적용', '공공서비스 이용자를 고객으로 보는 고객 지향적 접근'], sub: '행정이론', level: 'advanced' },
      { q: '주민참여예산제도에 대한 설명으로 옳은 것은?',
        correct: '주민이 예산 편성 과정에 직접 참여하여 의견을 제시할 수 있다.',
        wrongs: ['주민이 집행된 예산에 대해 직접 감사를 실시하는 제도이다.', '주민투표를 통해 지방세의 세율을 직접 결정하는 제도이다.', '주민 대표가 공무원의 인사 평가에 참여하는 제도이다.'], sub: '재무행정', level: 'beginner' },
      { q: '행정 책임성의 유형에서 "외부적·공식적 책임성"의 사례에 해당하는 것은?',
        correct: '국회가 정부 예산안을 심의하고 국정감사를 통해 행정부를 통제하는 것',
        wrongs: ['공무원이 전문가적 양심에 따라 정책의 적절성을 스스로 판단하는 것', '학회나 전문가 집단이 동료 평가를 통해 정책을 검토하는 것', '공무원 개인이 직업윤리 강령에 따라 자율적으로 행동을 규율하는 것'], sub: '행정이론', level: 'advanced' },
      // 회계학
      { q: '복식부기의 원리에 대한 설명으로 옳은 것은?',
        correct: '모든 거래는 차변과 대변에 동시에 같은 금액으로 기록한다.',
        wrongs: ['현금의 수입과 지출만 발생 시점에 기록하는 것을 원칙으로 한다.', '자산의 증가는 대변에, 부채의 증가는 차변에 기록한다.', '거래 발생 시 차변 또는 대변 중 한쪽에만 기록한다.'], sub: '회계원리', level: 'beginner' },
      { q: '다음 중 자산에 해당하는 것은?', correct: '매출채권',
        wrongs: ['미지급금', '자본금', '매출액'], sub: '회계원리', level: 'beginner' },
      { q: '감가상각의 목적으로 옳은 것은?',
        correct: '자산의 취득원가를 내용연수에 걸쳐 체계적으로 배분한다.',
        wrongs: ['자산의 시장가치 하락을 실시간 반영한다.', '자산을 매각할 때의 손익을 미리 계산한다.', '자산의 유지보수 비용을 예측한다.'], sub: '회계원리', level: 'intermediate' },
    ];

    return allConcepts.map(c => ({
      area: '직무수행능력', areaCode: 'job', level: c.level,
      generator: () => {
        const choices = [c.correct, ...c.wrongs]; this._shuffle(choices);
        return {
          area: '직무수행능력', subArea: c.sub, level: c.level,
          type: c.level === 'beginner' ? '피듈형' : 'PSAT형', timeLimit: 80,
          question: c.q, choices, answer: choices.indexOf(c.correct),
          explanation: `정답: ${c.correct}`, keywords: [c.sub, '직무수행']
        };
      }
    }));
  }

  // ════════════════════════════════════════
  //  조직이해능력 (시나리오 풀 확장)
  // ════════════════════════════════════════

  _orgTemplates() {
    return ['beginner', 'intermediate', 'advanced'].map(level => ({
      area: '조직이해능력', areaCode: 'org', level,
      generator: () => {
        const pools = {
          beginner: [
            { q: '공공기관의 유형 중 공기업에 해당하는 것은?',
              correct: '자체 수입액이 총수입액의 2분의 1 이상인 공공기관',
              wrongs: ['정부 출연금으로만 운영되는 기관', '직원 수가 300명 이상인 기관', '지방자치단체가 설립한 기관'] },
            { q: '라인(Line) 조직의 특징으로 옳은 것은?',
              correct: '명령 계통이 단순하고 책임 소재가 명확하다.',
              wrongs: ['전문 참모가 의사결정을 주도한다.', '부서 간 수평적 협력이 용이하다.', '환경 변화에 빠르게 대응할 수 있다.'] },
            { q: '조직 문화의 기능으로 적절하지 않은 것은?',
              correct: '구성원의 개인적 이익을 극대화한다.',
              wrongs: ['구성원에게 정체성을 부여한다.', '조직의 안정성을 높인다.', '구성원의 행동 기준을 제시한다.'] }
          ],
          intermediate: [
            { q: '매트릭스 조직의 특징으로 옳은 것은?',
              correct: '기능부서와 프로젝트팀의 이중 보고 체계를 갖는다.',
              wrongs: ['단일 명령 계통만 존재한다.', '프로젝트 종료 후에도 팀이 유지된다.', '최고경영자만이 의사결정권을 갖는다.'] },
            { q: '네트워크 조직에 대한 설명으로 옳은 것은?',
              correct: '핵심 역량에 집중하고 나머지는 외부 전문 기관과 협력한다.',
              wrongs: ['모든 기능을 내부에서 수행한다.', '수직적 계층 구조가 강하다.', '조직 간 정보 공유를 제한한다.'] },
            { q: '공공기관의 경영평가에 대한 설명으로 옳은 것은?',
              correct: '기획재정부가 매년 공공기관의 경영 실적을 평가한다.',
              wrongs: ['감사원이 분기별로 경영 실적을 평가한다.', '국회가 직접 경영평가를 실시한다.', '평가 결과는 비공개로 처리된다.'] }
          ],
          advanced: [
            { q: '준정부기관에 대한 설명으로 옳은 것은?',
              correct: '공기업이 아닌 공공기관 중 기금관리형과 위탁집행형으로 구분된다.',
              wrongs: ['정부 50% 이상 출자 기관만 해당한다.', '시장형과 준시장형으로 구분된다.', '기타공공기관과 동일한 분류이다.'] },
            { q: '애자일(Agile) 조직의 특성으로 옳지 않은 것은?',
              correct: '장기적 계획에 따라 순차적으로 업무를 수행한다.',
              wrongs: ['짧은 주기의 반복적 개선을 추구한다.', '자율적 팀 구성과 빠른 의사결정을 강조한다.', '변화에 유연하게 대응한다.'] },
            { q: '거버넌스(Governance)에 대한 설명으로 옳은 것은?',
              correct: '정부, 시장, 시민사회 등 다양한 주체가 참여하는 협력적 통치 방식이다.',
              wrongs: ['정부가 단독으로 정책을 결정하고 집행하는 방식이다.', '시장 원리에 의해서만 자원 배분이 이루어지는 체제이다.', '시민사회가 정부를 대체하는 통치 형태이다.'] }
          ]
        };
        const pool = pools[level] || pools.intermediate;
        const c = pool[this._rand(0, pool.length - 1)];
        const choices = [c.correct, ...c.wrongs]; this._shuffle(choices);
        return {
          area: '조직이해능력', subArea: '조직구조', level, type: level === 'beginner' ? '피듈형' : 'PSAT형', timeLimit: 80,
          question: c.q, choices, answer: choices.indexOf(c.correct),
          explanation: `정답: ${c.correct}`, keywords: ['조직이해', '조직구조']
        };
      }
    }));
  }

  // ════════════════════════════════════════
  //  직업윤리 (상황판단형 시나리오 풀)
  // ════════════════════════════════════════

  _ethicsTemplates() {
    return ['beginner', 'intermediate', 'advanced'].map(level => ({
      area: '직업윤리', areaCode: 'ethics', level,
      generator: () => {
        const pools = {
          beginner: [
            { q: '김영란법상 직무관련자에게 제공할 수 있는 식사 한도는?',
              correct: '3만원', wrongs: ['5만원', '10만원', '1만원'] },
            { q: '직장 내 성희롱 발생 시 가장 먼저 해야 할 행동은?',
              correct: '피해자 의사를 확인하고 사내 신고 채널에 접수한다.',
              wrongs: ['당사자 간 비공식적으로 해결하도록 유도한다.', '가해자에게 직접 항의한다.', '피해자에게 이직을 권유한다.'] },
            { q: '공무원의 직무상 알게 된 비밀에 대한 설명으로 옳은 것은?',
              correct: '재직 중은 물론 퇴직 후에도 누설해서는 안 된다.',
              wrongs: ['퇴직 후에는 자유롭게 공개할 수 있다.', '언론 보도 목적이면 공개할 수 있다.', '동료에게만 공유하는 것은 허용된다.'] }
          ],
          intermediate: [
            { q: '이해충돌 발생 시 가장 우선적인 조치는?',
              correct: '소속 기관장에게 신고하고 회피를 신청한다.',
              wrongs: ['본인이 공정하게 처리하면 된다.', '동료에게만 알리고 업무를 계속한다.', '비공식적으로 다른 사람에게 업무를 넘긴다.'] },
            { q: '내부 공익신고자 보호에 대한 설명으로 옳은 것은?',
              correct: '공익신고자는 신분상 불이익으로부터 법적으로 보호받는다.',
              wrongs: ['신고 내용이 사실로 확인된 경우에만 보호된다.', '익명 신고는 보호 대상에서 제외된다.', '신고로 조직에 손해 발생 시 연대 배상 책임을 진다.'] },
            { q: '부당한 업무 지시를 받았을 때 가장 적절한 대응은?',
              correct: '부당성을 서면으로 기록하고 상급 관리자나 내부 신고 채널에 보고한다.',
              wrongs: ['조직 질서 유지를 위해 일단 지시에 따른 후 사후에 문제를 제기한다.', '동료들과 연대하여 해당 업무 지시에 대해 집단적으로 거부 의사를 표명한다.', '내부 절차를 거치지 않고 즉시 외부 언론에 제보하여 공론화한다.'] }
          ],
          advanced: [
            { q: '연구원이 가설을 뒷받침하지 못하는 이상치를 발견했다. 마감이 임박한 상황에서 가장 적절한 행동은?',
              correct: '이상치를 포함한 전체 데이터를 보고하고, 원인을 추가 분석하여 투명하게 기술한다.',
              wrongs: ['이상치를 통계적 오류로 판단하여 제거한다.', '가설에 맞는 결과가 나올 때까지 실험을 반복한다.', '"추후 분석 예정"으로 기재하고 넘어간다.'] },
            { q: '내부 감사 중 동료의 횡령 의혹을 발견한 직원의 가장 적절한 행동은?',
              correct: '객관적 증거를 확보한 뒤 내부 신고 채널을 통해 신고한다.',
              wrongs: ['동료에게 직접 확인하고 자진 반환을 권유한다.', '확실한 증거가 없으므로 관망한다.', '즉시 수사기관에 고발한다.'] },
            { q: '의약품 영업사원이 거래처 의사에게 고가 해외 학회 참석비를 지원하겠다고 제안했다. 가장 적절한 판단은?',
              correct: '처방 결정에 영향을 줄 수 있는 경제적 이익 제공으로, 리베이트에 해당한다.',
              wrongs: ['학회 참석은 전문성 향상에 기여하므로 정당한 학술 지원이다.', '업계 관행이므로 적정 수준이면 문제없다.', '자발적 요청이 아니므로 제안 단계에서는 문제되지 않는다.'] },
            { q: '공직자가 퇴직 후 관련 업체에 취업하려 한다. 가장 적절한 설명은?',
              correct: '공직자윤리법에 따라 퇴직 후 일정 기간 취업 제한 대상인지 확인해야 한다.',
              wrongs: ['퇴직 후에는 취업 제한이 없다.', '기관장의 허가만 있으면 바로 취업할 수 있다.', '비영리 기관이면 제한 없이 취업할 수 있다.'] }
          ]
        };
        const pool = pools[level] || pools.intermediate;
        const c = pool[this._rand(0, pool.length - 1)];
        const choices = [c.correct, ...c.wrongs]; this._shuffle(choices);
        return {
          area: '직업윤리', subArea: '공직윤리', level,
          type: level === 'beginner' ? '피듈형' : level === 'advanced' ? 'PSAT형' : '피듈형',
          timeLimit: level === 'advanced' ? 100 : 70,
          question: c.q, choices, answer: choices.indexOf(c.correct),
          explanation: `정답: ${c.correct}`, keywords: ['직업윤리', '공직윤리', '윤리딜레마']
        };
      }
    }));
  }

  // ════════════════════════════════════════
  //  자기개발능력
  // ════════════════════════════════════════

  _selfDevTemplates() {
    return ['beginner', 'intermediate', 'advanced'].map(level => ({
      area: '자기개발능력', areaCode: 'self', level,
      generator: () => {
        const pools = {
          beginner: [
            { q: '경력개발(CDP)에서 자기 분석 도구로 적절하지 않은 것은?',
              correct: '손익계산서', wrongs: ['SWOT 분석', 'MBTI 성격유형검사', 'Holland 직업적성검사'] },
            { q: '자기개발 계획 수립의 첫 번째 단계로 가장 적절한 것은?',
              correct: '자신의 강점과 약점을 파악한다.',
              wrongs: ['학원에 등록한다.', '자격증 시험 일정을 확인한다.', '선배에게 조언을 구한다.'] },
            { q: '직업인으로서 평생학습이 필요한 이유로 가장 적절한 것은?',
              correct: '기술과 환경 변화에 대응하여 전문성을 유지·향상해야 하기 때문이다.',
              wrongs: ['회사에서 강제하는 교육이기 때문이다.', '학력이 높을수록 연봉이 높기 때문이다.', '자격증을 많이 취득해야 하기 때문이다.'] }
          ],
          intermediate: [
            { q: '비형식학습(Non-formal Learning)에 해당하는 것은?',
              correct: '직장 내 OJT(On-the-Job Training)',
              wrongs: ['대학교 정규 학위과정 교과목 수료', '일상에서 우연히 얻게 되는 무형식학습', '국가공인 자격시험 응시를 통한 학습'] },
            { q: 'SMART 목표 설정의 요소에 해당하지 않는 것은?',
              correct: 'Traditional(전통적)',
              wrongs: ['Specific(구체적)', 'Measurable(측정가능)', 'Time-bound(기한설정)'] },
            { q: '경력닻(Career Anchor)이론에서 기술·기능적 역량을 중시하는 유형의 특징은?',
              correct: '특정 분야의 전문가가 되는 것을 가장 중요하게 여긴다.',
              wrongs: ['경영 전반을 관리하는 것을 선호한다.', '안정적인 조직 생활을 최우선시한다.', '독립적으로 일하는 것을 가장 선호한다.'] }
          ],
          advanced: [
            { q: '역량(Competency) 모델링에 대한 설명으로 옳은 것은?',
              correct: '우수 성과자의 행동 특성을 분석하여 직무별 필요 역량을 도출한다.',
              wrongs: ['모든 직무에 동일한 역량 기준을 적용한다.', '학력과 자격증만으로 역량을 측정한다.', '역량 모델은 한번 수립하면 변경할 수 없다.'] },
            { q: '경력 전환(Career Transition)에 대한 설명으로 옳은 것은?',
              correct: '기존 경험과 역량을 새로운 분야에 전이시켜 활용할 수 있다.',
              wrongs: ['경력 전환 시 이전 경력은 인정되지 않는다.', '경력 전환은 실패 시 원래 직무로 복귀가 불가능하다.', '경력 전환은 20대에서만 가능하다.'] }
          ]
        };
        const pool = pools[level] || pools.intermediate;
        const c = pool[this._rand(0, pool.length - 1)];
        const choices = [c.correct, ...c.wrongs]; this._shuffle(choices);
        return {
          area: '자기개발능력', subArea: '경력개발', level, type: '모듈형', timeLimit: 70,
          question: c.q, choices, answer: choices.indexOf(c.correct),
          explanation: `정답: ${c.correct}`, keywords: ['자기개발', '경력개발']
        };
      }
    }));
  }

  // ════════════════════════════════════════
  //  대인관계능력
  // ════════════════════════════════════════

  _interPersonalTemplates() {
    return ['beginner', 'intermediate', 'advanced'].map(level => ({
      area: '대인관계능력', areaCode: 'inter', level,
      generator: () => {
        const pools = {
          beginner: [
            { q: '효과적인 경청의 자세로 적절하지 않은 것은?',
              correct: '상대방의 말이 끝나기 전에 반박할 내용을 준비한다.',
              wrongs: ['상대방의 눈을 적절히 바라본다.', '고개를 끄덕이며 관심을 표현한다.', '상대방의 말을 요약하여 확인한다.'] },
            { q: '직장 내 올바른 인사 예절로 적절한 것은?',
              correct: '상급자에게는 먼저 인사하고, 악수는 상급자가 먼저 청한다.',
              wrongs: ['하급자가 먼저 악수를 청해야 한다.', '인사는 근무시간에만 하면 된다.', '이메일 인사는 생략해도 무방하다.'] }
          ],
          intermediate: [
            { q: '팀 발달 단계(Tuckman 모델)의 올바른 순서는?',
              correct: '형성기 → 갈등기 → 규범기 → 성과기',
              wrongs: ['갈등기 → 형성기 → 성과기 → 규범기', '규범기 → 형성기 → 갈등기 → 성과기', '성과기 → 규범기 → 갈등기 → 형성기'] },
            { q: '갈등 관리 전략 중 "협력(Collaborating)"에 대한 설명으로 옳은 것은?',
              correct: '양측의 관심사를 모두 충족시키는 해결책을 찾는다.',
              wrongs: ['한쪽이 완전히 양보한다.', '양쪽 모두 어느 정도 양보한다.', '갈등을 회피하고 방치한다.'] },
            { q: '직장 내 멘토링에 대한 설명으로 옳은 것은?',
              correct: '경험이 풍부한 선배가 후배의 경력개발을 지도·지원하는 활동이다.',
              wrongs: ['업무 평가를 위한 감독 활동이다.', '동료 간의 업무 분담 체계이다.', '인사팀이 주관하는 교육 프로그램이다.'] }
          ],
          advanced: [
            { q: '비폭력 대화(NVC)의 4단계 순서로 옳은 것은?',
              correct: '관찰 → 느낌 → 욕구 → 부탁',
              wrongs: ['느낌 → 관찰 → 부탁 → 욕구', '부탁 → 욕구 → 관찰 → 느낌', '욕구 → 느낌 → 관찰 → 부탁'] },
            { q: '조직 내 갈등이 긍정적 기능을 할 수 있는 경우는?',
              correct: '적절한 수준의 갈등이 창의적 문제 해결과 혁신을 촉진할 때',
              wrongs: ['갈등이 극대화되어 구성원 간 경쟁이 심화될 때', '갈등을 회피하여 표면적 화합을 유지할 때', '소수의 의견이 다수에 의해 억압될 때'] },
            { q: '감성 지능(EQ)의 구성 요소에 해당하지 않는 것은?',
              correct: '논리적 추론 능력',
              wrongs: ['자기 인식', '자기 조절', '사회적 기술'] }
          ]
        };
        const pool = pools[level] || pools.intermediate;
        const c = pool[this._rand(0, pool.length - 1)];
        const choices = [c.correct, ...c.wrongs]; this._shuffle(choices);
        return {
          area: '대인관계능력', subArea: '팀워크', level, type: '피듈형', timeLimit: 70,
          question: c.q, choices, answer: choices.indexOf(c.correct),
          explanation: `정답: ${c.correct}`, keywords: ['대인관계', '팀워크', '의사소통']
        };
      }
    }));
  }

  // ════════════════════════════════════════
  //  기술능력
  // ════════════════════════════════════════

  _techTemplates() {
    return ['beginner', 'intermediate', 'advanced'].map(level => ({
      area: '기술능력', areaCode: 'tech', level,
      generator: () => {
        const pools = {
          beginner: [
            { q: '기술수명주기의 단계 순서로 옳은 것은?',
              correct: '도입기 → 성장기 → 성숙기 → 쇠퇴기',
              wrongs: ['성장기 → 도입기 → 쇠퇴기 → 성숙기', '성숙기 → 성장기 → 도입기 → 쇠퇴기', '도입기 → 성숙기 → 성장기 → 쇠퇴기'] },
            { q: '4차 산업혁명의 핵심 기술에 해당하지 않는 것은?',
              correct: '수력 발전 기술',
              wrongs: ['인공지능(AI)', '사물인터넷(IoT)', '빅데이터'] },
            { q: '특허권의 존속 기간으로 옳은 것은?',
              correct: '출원일로부터 20년',
              wrongs: ['등록일로부터 10년', '출원일로부터 50년', '등록일로부터 20년'] }
          ],
          intermediate: [
            { q: '클라우드 서비스 모델에 해당하지 않는 것은?',
              correct: 'DaaS(Database as a Service)',
              wrongs: ['IaaS(Infrastructure as a Service)', 'PaaS(Platform as a Service)', 'SaaS(Software as a Service)'] },
            { q: '기술 혁신의 유형 중 파괴적 혁신(Disruptive Innovation)에 대한 설명으로 옳은 것은?',
              correct: '기존 시장의 하위 영역이나 새로운 시장에서 시작하여 점차 주류 시장을 대체한다.',
              wrongs: ['기존 기술을 점진적으로 개선하는 혁신이다.', '대기업이 주도하는 대규모 R&D 투자이다.', '기존 고객의 니즈를 충족시키는 방향으로 진행된다.'] },
            { q: 'IoT(사물인터넷)에 대한 설명으로 옳은 것은?',
              correct: '사물에 센서와 통신 기능을 내장하여 인터넷에 연결하는 기술이다.',
              wrongs: ['인터넷을 통해 사물을 구매하는 기술이다.', '사물의 형상을 3D로 출력하는 기술이다.', '인터넷 접속 속도를 높이는 통신 기술이다.'] }
          ],
          advanced: [
            { q: '디지털 전환(Digital Transformation)에 대한 설명으로 옳은 것은?',
              correct: '디지털 기술을 활용하여 비즈니스 모델과 조직 프로세스를 근본적으로 변혁한다.',
              wrongs: ['단순히 종이 문서를 전자 문서로 변환하는 것이다.', '기존 IT 시스템을 최신 버전으로 업데이트하는 것이다.', '모든 업무를 자동화하여 인력을 감축하는 것이다.'] },
            { q: '기술 표준화의 장점으로 옳지 않은 것은?',
              correct: '기술 혁신 속도가 저하되어 시장 경쟁이 감소한다.',
              wrongs: ['호환성 향상으로 사용자 편의가 증가한다.', '대량 생산이 가능하여 비용이 절감된다.', '기술 이전이 용이해진다.'] },
            { q: 'AI 윤리에서 설명가능성(Explainability)이 중요한 이유는?',
              correct: 'AI의 의사결정 과정을 이해하고 검증할 수 있어야 신뢰성과 책임성을 확보할 수 있기 때문이다.',
              wrongs: ['AI의 연산 속도를 향상시킬 수 있기 때문이다.', 'AI 모델의 학습 데이터를 줄일 수 있기 때문이다.', 'AI 시스템의 개발 비용을 절감할 수 있기 때문이다.'] }
          ]
        };
        const pool = pools[level] || pools.intermediate;
        const c = pool[this._rand(0, pool.length - 1)];
        const choices = [c.correct, ...c.wrongs]; this._shuffle(choices);
        return {
          area: '기술능력', subArea: '기술이해', level, type: level === 'beginner' ? '모듈형' : 'PSAT형', timeLimit: 70,
          question: c.q, choices, answer: choices.indexOf(c.correct),
          explanation: `정답: ${c.correct}`, keywords: ['기술능력', '기술이해']
        };
      }
    }));
  }

  // ════════════════════════════════════════
  //  유틸리티
  // ════════════════════════════════════════

  _rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /** ㄱㄴㄷ 보기 조합 생성 */
  _generateCombos(labels, correctOnes) {
    const results = [correctOnes.join(', ')];
    // 다른 조합 생성
    for (let i = 0; i < labels.length; i++) {
      for (let j = i + 1; j <= labels.length; j++) {
        const combo = labels.slice(i, j).join(', ');
        if (combo !== results[0] && !results.includes(combo)) results.push(combo);
      }
    }
    // 단일 항목도 추가
    labels.forEach(l => { if (!results.includes(l)) results.push(l); });
    return results;
  }
}

module.exports = { QuestionGenerator };
