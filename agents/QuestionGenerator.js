/**
 * ═══════════════════════════════════════════════════
 *  QuestionGenerator (동적 문제 생성 에이전트)
 * ═══════════════════════════════════════════════════
 *
 *  역할: 템플릿 + 변수 치환으로 매번 새로운 문제를 생성
 *  정적 은행이 소진되면 동적으로 무한 문제 공급
 *
 *  생성 방식:
 *  1. 수리형: 숫자 파라미터 랜덤화 → 정답 자동 계산
 *  2. 규정형: 날짜/금액/조건 변환 → 판단 로직 재계산
 *  3. 개념형: 보기 순서 셔플 + 오답 교체
 */

class QuestionGenerator {
  constructor() {
    this.name = 'QuestionGenerator';
    this.counter = 0;
    this.templates = [...this._buildTemplates(), ...this._buildExtraTemplates()];
  }

  /**
   * 요청한 수만큼 동적 문제 생성
   */
  generate(count = 10, options = {}) {
    const { areas, level } = options;
    let pool = [...this.templates];

    if (areas && areas.length) {
      pool = pool.filter(t => areas.includes(t.area));
    }
    if (level && level !== 'mixed') {
      pool = pool.filter(t => t.level === level);
    }

    this._shuffle(pool);
    const results = [];

    for (let i = 0; i < count; i++) {
      const template = pool[i % pool.length];
      const q = this._instantiate(template);
      results.push(q);
    }

    return results;
  }

  /**
   * 템플릿을 인스턴스화 — 변수 치환 + 정답 계산
   */
  _instantiate(template) {
    this.counter++;
    const id = `gen-${template.areaCode}-${Date.now().toString(36)}${this.counter.toString(36)}`;

    if (template.generator) {
      return { id, ...template.generator() };
    }

    // 기본: 보기 셔플
    const q = { ...template.base };
    q.id = id;
    return q;
  }

  _buildTemplates() {
    return [
      // ════════════════════════════════════════
      // 수리능력 — 예산 집행률 계산 (파라미터 랜덤)
      // ════════════════════════════════════════
      ...this._mathBudgetTemplates(),
      ...this._mathGrowthTemplates(),
      ...this._mathProportionTemplates(),

      // ════════════════════════════════════════
      // 의사소통 — 규정 해석 (조건 변환)
      // ════════════════════════════════════════
      ...this._commRegulationTemplates(),
      ...this._commDocumentTemplates(),

      // ════════════════════════════════════════
      // 문제해결 — 의사결정/우선순위 (시나리오 변환)
      // ════════════════════════════════════════
      ...this._probSolvingTemplates(),

      // ════════════════════════════════════════
      // 자원관리 — 예산/시간/인력 배분
      // ════════════════════════════════════════
      ...this._resourceTemplates(),

      // ════════════════════════════════════════
      // 정보능력 — IT/보안/데이터
      // ════════════════════════════════════════
      ...this._infoTemplates(),

      // ════════════════════════════════════════
      // 직무수행 — 경영/경제/행정/회계
      // ════════════════════════════════════════
      ...this._jobMgmtTemplates(),
      ...this._jobEconTemplates(),
      ...this._jobAdminTemplates(),
      ...this._jobAcctTemplates(),

      // ════════════════════════════════════════
      // 기타 영역
      // ════════════════════════════════════════
      ...this._orgTemplates(),
      ...this._ethicsTemplates(),
      ...this._selfDevTemplates(),
      ...this._interPersonalTemplates(),
      ...this._techTemplates(),
    ];
  }

  // ─── 수리: 예산 집행률 ───
  _mathBudgetTemplates() {
    return ['beginner', 'intermediate', 'advanced'].map(level => ({
      area: '수리능력', areaCode: 'math', level,
      generator: () => {
        const depts = ['총무팀', '기획팀', '사업팀', '홍보팀', '인사팀', '재무팀', 'IT팀', '법무팀'];
        this._shuffle(depts);
        const selected = depts.slice(0, 4);
        const data = selected.map(d => {
          const budget = this._rand(200, 800) * 10;
          const exec = Math.floor(budget * (this._rand(60, 98) / 100));
          return { dept: d, budget, exec, remain: budget - exec };
        });

        const totalBudget = data.reduce((s, d) => s + d.budget, 0);
        const totalExec = data.reduce((s, d) => s + d.exec, 0);

        // 집행률이 가장 낮은 부서
        let lowestRate = 100, lowestDept = '';
        data.forEach(d => {
          const rate = d.exec / d.budget * 100;
          if (rate < lowestRate) { lowestRate = rate; lowestDept = d.dept; }
        });

        const table = data.map(d =>
          `│ ${d.dept.padEnd(6)}│${String(d.budget).padStart(7)}│${String(d.exec).padStart(7)}│${String(d.remain).padStart(7)}│`
        ).join('\n');

        const choices = this._shuffle([...selected]);
        const answer = choices.indexOf(lowestDept);

        return {
          area: '수리능력', subArea: '예산분석', level, type: 'PSAT형', timeLimit: level === 'advanced' ? 150 : 100,
          question: `다음은 기관의 부서별 예산 현황이다. (단위: 만원)\n\n┌────────┬───────┬───────┬───────┐\n│  부서  │배정액 │집행액 │ 잔액  │\n├────────┼───────┼───────┼───────┤\n${table}\n├────────┼───────┼───────┼───────┤\n│  합계  │${String(totalBudget).padStart(7)}│${String(totalExec).padStart(7)}│${String(totalBudget - totalExec).padStart(7)}│\n└────────┴───────┴───────┴───────┘\n\n예산 집행률(집행액/배정액)이 가장 낮은 부서는?`,
          choices, answer,
          explanation: data.map(d => `${d.dept}: ${(d.exec/d.budget*100).toFixed(1)}%`).join(', ') + `. 가장 낮은 부서는 ${lowestDept}.`,
          keywords: ['예산집행률', '자료해석', '대형표']
        };
      }
    }));
  }

  // ─── 수리: 증감률 계산 ───
  _mathGrowthTemplates() {
    return ['intermediate', 'advanced'].map(level => ({
      area: '수리능력', areaCode: 'math', level,
      generator: () => {
        const items = ['매출액', '영업이익', '인건비', '운영비', '사업비'];
        const years = [2023, 2024, 2025];
        const vals = years.map(() => this._rand(100, 500) * 10);
        // Ensure some growth pattern
        if (vals[1] < vals[0]) vals[1] = vals[0] + this._rand(50, 200);
        const growth1 = ((vals[1] - vals[0]) / vals[0] * 100).toFixed(1);
        const growth2 = ((vals[2] - vals[1]) / vals[1] * 100).toFixed(1);

        const item = items[this._rand(0, items.length - 1)];
        const bigger = parseFloat(growth1) > parseFloat(growth2);
        const correctStatement = bigger
          ? `${years[1]}년의 전년대비 ${item} 증가율이 ${years[2]}년보다 높다.`
          : `${years[2]}년의 전년대비 ${item} 증가율이 ${years[1]}년보다 높다.`;

        const wrongStatements = [
          `${years[0]}년부터 ${years[2]}년까지 ${item}은 매년 감소하였다.`,
          `${years[2]}년 ${item}은 ${years[0]}년의 3배 이상이다.`,
          `${item}의 연평균 증가율은 50%를 초과한다.`
        ];
        this._shuffle(wrongStatements);
        const choices = [correctStatement, ...wrongStatements.slice(0, 3)];
        this._shuffle(choices);
        const answer = choices.indexOf(correctStatement);

        return {
          area: '수리능력', subArea: '증감률분석', level, type: 'PSAT형', timeLimit: 120,
          question: `다음은 기관의 연도별 ${item} 현황이다. (단위: 억원)\n\n${years[0]}년: ${vals[0]}억 → ${years[1]}년: ${vals[1]}억 → ${years[2]}년: ${vals[2]}억\n\n다음 중 옳은 것은?`,
          choices, answer,
          explanation: `${years[1]}년 증가율: ${growth1}%, ${years[2]}년 증가율: ${growth2}%.`,
          keywords: ['증감률', '전년대비', '자료해석']
        };
      }
    }));
  }

  // ─── 수리: 비중 계산 ───
  _mathProportionTemplates() {
    return ['beginner', 'intermediate'].map(level => ({
      area: '수리능력', areaCode: 'math', level,
      generator: () => {
        const categories = ['인건비', '운영비', '사업비', '출장비', '교육비'];
        const values = categories.map(() => this._rand(50, 400) * 10);
        const total = values.reduce((s, v) => s + v, 0);
        const proportions = values.map(v => (v / total * 100).toFixed(1));
        const maxIdx = proportions.indexOf(proportions.reduce((a, b) => parseFloat(a) > parseFloat(b) ? a : b));
        const thresholds = [30, 40, 50];
        const threshold = thresholds[this._rand(0, 2)];
        const exceeds = proportions.filter(p => parseFloat(p) >= threshold).length;

        const correctChoice = `${categories[maxIdx]}의 비중이 가장 크다.`;
        const wrongs = [
          `${categories[(maxIdx+1)%5]}의 비중이 ${threshold}%를 초과한다.`,
          `전체 합계는 ${total + this._rand(100, 500)}만원이다.`,
          `가장 작은 항목의 비중은 ${(Math.min(...proportions.map(Number)) + 10).toFixed(1)}%이다.`
        ];
        const choices = [correctChoice, ...wrongs];
        this._shuffle(choices);

        return {
          area: '수리능력', subArea: '비중계산', level, type: 'PSAT형', timeLimit: 90,
          question: `다음 예산 항목별 금액(만원)이다.\n\n${categories.map((c, i) => `${c}: ${values[i]}`).join(', ')}\n합계: ${total}\n\n다음 중 옳은 것은?`,
          choices, answer: choices.indexOf(correctChoice),
          explanation: categories.map((c, i) => `${c}: ${proportions[i]}%`).join(', '),
          keywords: ['비중', '백분율', '자료해석']
        };
      }
    }));
  }

  // ─── 의사소통: 규정 해석 ───
  _commRegulationTemplates() {
    return ['beginner', 'intermediate', 'advanced'].map(level => ({
      area: '의사소통능력', areaCode: 'comm', level,
      generator: () => {
        const deadlineDays = this._rand(3, 14);
        const amount = this._rand(50, 500) * 10000;
        const amountStr = (amount / 10000) + '만원';
        const approverLevel = amount >= 5000000 ? '기관장' : amount >= 1000000 ? '부서장' : '팀장';
        const reportDays = this._rand(3, 10);
        const penaltyPercent = this._rand(10, 50);
        const deptNames = ['총무과', '기획과', '사업과', '인사과'];
        const dept = deptNames[this._rand(0, 3)];

        const reg = `제○조(출장) ① 출장신청서는 출장 ${deadlineDays}일 전까지 제출한다.\n② ${amountStr} 이상 출장비는 ${approverLevel} 사전 승인이 필요하다.\n③ 출장보고서는 출장 종료 후 ${reportDays}일 이내에 제출한다.\n④ 미제출 시 출장비의 ${penaltyPercent}%를 환수한다.`;

        const correctDays = deadlineDays - 1;
        const wrongDays = deadlineDays + 2;

        const correctChoice = `출장 ${deadlineDays}일 전에 신청서를 제출하면 적법하다.`;
        const wrongs = [
          `출장 ${correctDays}일 전에 신청서를 제출해도 유효하다.`,
          `출장보고서는 출장 종료 후 ${reportDays + 5}일까지 제출하면 된다.`,
          `${(amount / 2)}원의 출장비는 ${approverLevel} 승인이 필요하다.`
        ];

        const choices = [correctChoice, ...wrongs];
        this._shuffle(choices);

        return {
          area: '의사소통능력', subArea: '규정해석', level, type: level === 'beginner' ? '피듈형' : 'PSAT형',
          timeLimit: level === 'advanced' ? 120 : 90,
          question: `다음은 ${dept}의 출장 관리 규정이다.\n\n${reg}\n\n위 규정에 부합하는 것은?`,
          choices, answer: choices.indexOf(correctChoice),
          explanation: `규정에 따라 ${deadlineDays}일 전까지 제출 필요. ${amountStr} 이상 시 ${approverLevel} 승인. 보고서는 ${reportDays}일 이내.`,
          keywords: ['규정해석', '출장관리', '기한판단']
        };
      }
    }));
  }

  // ─── 의사소통: 공지/문서 이해 ───
  _commDocumentTemplates() {
    return ['beginner', 'intermediate'].map(level => ({
      area: '의사소통능력', areaCode: 'comm', level,
      generator: () => {
        const events = ['건강검진', '정보보안교육', '소방훈련', '성희롱예방교육', '직장내괴롭힘교육'];
        const event = events[this._rand(0, events.length - 1)];
        const month = this._rand(3, 11);
        const day = this._rand(1, 28);
        const endDay = Math.min(day + this._rand(7, 20), 28);
        const exception = ['수습직원', '휴직자', '파견직원'][this._rand(0, 2)];
        const penalty = ['인사고과 반영', '복리후생 차감', '시말서 제출'][this._rand(0, 2)];

        const notice = `[공지] ${month}월 ${event} 안내\n1. 대상: 전 직원 (단, ${exception}은 제외)\n2. 기간: ${month}월 ${day}일 ~ ${month}월 ${endDay}일\n3. 미이수 시: ${penalty}`;

        const correctChoice = `${exception}은 이번 ${event} 대상에서 제외된다.`;
        const wrongs = [
          `${event}은 ${month}월 ${endDay + 5}일까지 이수할 수 있다.`,
          `미이수 시 별도의 불이익이 없다.`,
          `계약직 직원은 ${event} 대상에서 제외된다.`
        ];

        const choices = [correctChoice, ...wrongs];
        this._shuffle(choices);

        return {
          area: '의사소통능력', subArea: '문서이해', level, type: '피듈형', timeLimit: 80,
          question: `다음 공지를 읽고 옳은 것을 고르시오.\n\n${notice}`,
          choices, answer: choices.indexOf(correctChoice),
          explanation: `공지에 따르면 ${exception}은 제외, 기간은 ${month}월 ${endDay}일까지, 미이수 시 ${penalty}.`,
          keywords: ['공지사항', '문서이해', '단서조건']
        };
      }
    }));
  }

  // ─── 문제해결 ───
  _probSolvingTemplates() {
    return ['intermediate', 'advanced'].map(level => ({
      area: '문제해결능력', areaCode: 'prob', level,
      generator: () => {
        const scenarios = [
          { situation: '민원처리 지연', criteria: ['긴급도', '영향범위', '해결가능성', '비용'],
            correct: '긴급도와 영향범위를 우선 고려하여 다수에게 영향을 미치는 민원을 먼저 처리한다.',
            wrongs: ['접수 순서대로 무조건 처리한다.', '비용이 가장 적게 드는 민원부터 처리한다.', '해결이 가장 쉬운 민원부터 처리하여 건수를 늘린다.'] },
          { situation: '시스템 장애 발생', criteria: ['복구시간', '사용자수', '대체수단', '데이터손실위험'],
            correct: '사용자수와 데이터손실위험이 높은 시스템을 최우선 복구한다.',
            wrongs: ['모든 시스템을 동시에 복구 시도한다.', '복구시간이 짧은 것부터 처리하여 빨리 성과를 낸다.', '대체수단이 있는 시스템은 무기한 방치한다.'] },
          { situation: '예산 삭감 대응', criteria: ['필수도', '법적의무', '성과기여도', '이해관계자영향'],
            correct: '법적 의무 사업은 유지하고, 성과기여도가 낮은 사업부터 조정한다.',
            wrongs: ['모든 사업 예산을 균등하게 삭감한다.', '인건비를 최우선으로 삭감한다.', '성과가 높은 사업부터 삭감하여 형평성을 맞춘다.'] }
        ];

        const s = scenarios[this._rand(0, scenarios.length - 1)];
        const choices = [s.correct, ...s.wrongs];
        this._shuffle(choices);

        return {
          area: '문제해결능력', subArea: '우선순위결정', level, type: 'PSAT형', timeLimit: 100,
          question: `기관에서 '${s.situation}' 상황이 발생하였다. 의사결정 시 고려해야 할 기준은 ${s.criteria.join(', ')} 등이다.\n\n가장 적절한 대응 방안은?`,
          choices, answer: choices.indexOf(s.correct),
          explanation: `${s.criteria[0]}와 ${s.criteria[1]}을 우선 고려하는 것이 합리적.`,
          keywords: ['우선순위', '의사결정', '상황판단']
        };
      }
    }));
  }

  // ─── 자원관리 ───
  _resourceTemplates() {
    return ['beginner', 'intermediate', 'advanced'].map(level => ({
      area: '자원관리능력', areaCode: 'res', level,
      generator: () => {
        const totalBudget = this._rand(5, 20) * 1000;
        const items = ['인건비', '시설비', '운영비', '사업비'];
        const ratios = [this._rand(30, 50), this._rand(15, 25)];
        ratios.push(this._rand(10, 20));
        ratios.push(100 - ratios[0] - ratios[1] - ratios[2]);

        const amounts = ratios.map(r => Math.round(totalBudget * r / 100));
        const largest = items[ratios.indexOf(Math.max(...ratios))];

        const correctChoice = `${largest}이(가) 전체 예산의 가장 큰 비중을 차지한다.`;
        const wrongs = [
          `운영비는 전체 예산의 ${ratios[2] + 15}%를 차지한다.`,
          `${items[3]}은 ${amounts[3] + 500}만원이다.`,
          `인건비와 시설비의 합은 전체의 ${ratios[0] + ratios[1] + 10}%이다.`
        ];

        const choices = [correctChoice, ...wrongs];
        this._shuffle(choices);

        return {
          area: '자원관리능력', subArea: '예산배분', level, type: 'PSAT형', timeLimit: 90,
          question: `기관 총 예산 ${totalBudget}만원을 다음과 같이 배분하였다.\n\n${items.map((it, i) => `${it}: ${ratios[i]}% (${amounts[i]}만원)`).join('\n')}\n\n옳은 것은?`,
          choices, answer: choices.indexOf(correctChoice),
          explanation: items.map((it, i) => `${it}: ${ratios[i]}%`).join(', '),
          keywords: ['예산배분', '비중분석', '자원관리']
        };
      }
    }));
  }

  // ─── 정보능력 ───
  _infoTemplates() {
    const concepts = [
      { q: '다음 중 SQL 인젝션 공격을 방지하는 방법으로 가장 적절한 것은?',
        correct: '매개변수화된 쿼리(Prepared Statement)를 사용한다.',
        wrongs: ['비밀번호를 주기적으로 변경한다.', '방화벽을 설치한다.', 'HTTP 대신 FTP를 사용한다.'] },
      { q: '다음 중 개인정보의 기술적 보호 조치로 적절하지 않은 것은?',
        correct: '개인정보를 평문(Plain Text)으로 데이터베이스에 저장한다.',
        wrongs: ['개인정보 전송 시 SSL/TLS 암호화를 적용한다.', '접근 권한을 최소한으로 부여한다.', '접속 기록을 6개월 이상 보관한다.'],
        isNegative: true },
      { q: '다음 중 랜섬웨어 감염 시 대응 절차로 가장 우선해야 할 것은?',
        correct: '감염된 시스템을 네트워크에서 즉시 분리한다.',
        wrongs: ['해커에게 몸값을 지불한다.', '감염 파일을 직접 삭제한다.', '백신 소프트웨어를 설치한 후 전체 스캔을 실행한다.'] },
      { q: '스프레드시트에서 VLOOKUP 함수의 설명으로 옳은 것은?',
        correct: '지정한 범위의 첫 번째 열에서 값을 찾아 같은 행의 다른 열 값을 반환한다.',
        wrongs: ['셀 범위의 합계를 계산한다.', '조건에 맞는 셀의 개수를 센다.', '텍스트를 숫자로 변환한다.'] }
    ];

    return concepts.map((c, i) => ({
      area: '정보능력', areaCode: 'info', level: i < 2 ? 'intermediate' : (i === 2 ? 'advanced' : 'beginner'),
      generator: () => {
        const choices = c.isNegative ? [c.correct, ...c.wrongs] : [c.correct, ...c.wrongs];
        this._shuffle(choices);
        return {
          area: '정보능력', subArea: i < 3 ? '정보보안' : '컴퓨터활용',
          level: i < 2 ? 'intermediate' : (i === 2 ? 'advanced' : 'beginner'),
          type: i === 3 ? '피듈형' : 'PSAT형', timeLimit: 80,
          question: c.q, choices, answer: choices.indexOf(c.correct),
          explanation: `정답: ${c.correct}`,
          keywords: ['정보보안', '정보능력', '컴퓨터활용']
        };
      }
    }));
  }

  // ─── 직무수행: 경영학 ───
  _jobMgmtTemplates() {
    const concepts = [
      { q: '매슬로(Maslow)의 욕구단계이론에서 가장 상위 욕구는?', correct: '자아실현 욕구',
        wrongs: ['안전 욕구', '소속 욕구', '존경 욕구'], sub: '조직행동론', level: 'beginner' },
      { q: 'BCG 매트릭스에서 시장성장률은 높으나 상대적 시장점유율이 낮은 사업을 무엇이라 하는가?',
        correct: '물음표(Question Mark)', wrongs: ['스타(Star)', '캐시카우(Cash Cow)', '개(Dog)'], sub: '경영전략', level: 'intermediate' },
      { q: '다음 중 맥그리거(McGregor)의 Y이론에 대한 설명으로 옳은 것은?',
        correct: '사람은 본질적으로 일에 대한 동기가 있으며, 자기지시와 자기통제가 가능하다.',
        wrongs: ['사람은 본질적으로 일을 싫어하고 가능하면 회피한다.', '외부 통제와 처벌 위협이 있어야만 일한다.', '대부분의 사람은 책임 회피를 선호한다.'], sub: '조직행동론', level: 'intermediate' },
      { q: 'PEST 분석의 4가지 환경 요인으로 옳은 것은?',
        correct: '정치적(Political), 경제적(Economic), 사회적(Social), 기술적(Technological)',
        wrongs: ['가격(Price), 환율(Exchange), 공급(Supply), 무역(Trade)',
          '인구(Population), 교육(Education), 안보(Security), 기술(Tech)',
          '정부(Public), 윤리(Ethics), 전략(Strategy), 세금(Tax)'], sub: '경영전략', level: 'beginner' }
    ];

    return concepts.map(c => ({
      area: '직무수행능력', areaCode: 'job', level: c.level,
      generator: () => {
        const choices = [c.correct, ...c.wrongs];
        this._shuffle(choices);
        return {
          area: '직무수행능력', subArea: c.sub, level: c.level,
          type: c.level === 'beginner' ? '피듈형' : 'PSAT형', timeLimit: 70,
          question: c.q, choices, answer: choices.indexOf(c.correct),
          explanation: `정답: ${c.correct}`,
          keywords: [c.sub, '경영학']
        };
      }
    }));
  }

  // ─── 직무수행: 경제학 ───
  _jobEconTemplates() {
    const concepts = [
      { q: '수요곡선이 우하향하는 이유를 설명하는 법칙은?', correct: '한계효용체감의 법칙',
        wrongs: ['수확체감의 법칙', '세이의 법칙', '그레셤의 법칙'], sub: '미시경제학', level: 'beginner' },
      { q: '경기침체 시 중앙은행이 취할 수 있는 확장적 통화정책으로 옳은 것은?',
        correct: '기준금리 인하', wrongs: ['기준금리 인상', '지급준비율 인상', '국채 매각'], sub: '거시경제학', level: 'intermediate' },
      { q: 'GDP 디플레이터에 대한 설명으로 옳은 것은?',
        correct: '명목GDP를 실질GDP로 나눈 후 100을 곱한 값이다.',
        wrongs: ['실질GDP를 명목GDP로 나눈 값이다.', '소비자물가지수(CPI)와 동일한 개념이다.', '수입품 가격만을 반영한다.'], sub: '거시경제학', level: 'advanced' },
      { q: '완전경쟁시장의 특성으로 옳지 않은 것은?',
        correct: '개별 기업이 시장 가격에 영향력을 행사할 수 있다.',
        wrongs: ['다수의 공급자와 수요자가 존재한다.', '제품의 동질성이 있다.', '시장 진입과 퇴출이 자유롭다.'], sub: '미시경제학', level: 'intermediate' }
    ];

    return concepts.map(c => ({
      area: '직무수행능력', areaCode: 'job', level: c.level,
      generator: () => {
        const choices = [c.correct, ...c.wrongs];
        this._shuffle(choices);
        return {
          area: '직무수행능력', subArea: c.sub, level: c.level, type: 'PSAT형', timeLimit: 80,
          question: c.q, choices, answer: choices.indexOf(c.correct),
          explanation: `정답: ${c.correct}`, keywords: [c.sub, '경제학']
        };
      }
    }));
  }

  // ─── 직무수행: 행정학 ───
  _jobAdminTemplates() {
    const concepts = [
      { q: '다음 중 행정의 원리로서 통솔범위(Span of Control)에 대한 설명으로 옳은 것은?',
        correct: '한 관리자가 효과적으로 감독할 수 있는 부하의 수에는 한계가 있다.',
        wrongs: ['조직의 모든 권한은 최고관리자에게 집중되어야 한다.', '같은 업무를 하는 직원은 반드시 한 부서에 소속되어야 한다.', '모든 조직 구성원은 동일한 보상을 받아야 한다.'], sub: '조직론', level: 'intermediate' },
      { q: '신공공관리론(NPM)의 핵심 원리와 거리가 먼 것은?',
        correct: '규칙과 절차에 의한 투입 통제 강화',
        wrongs: ['성과 중심의 관리', '시장 메커니즘 활용', '고객 지향적 서비스'], sub: '행정이론', level: 'advanced' },
      { q: '주민참여예산제도에 대한 설명으로 옳은 것은?',
        correct: '주민이 예산 편성 과정에 직접 참여하여 의견을 제시할 수 있는 제도이다.',
        wrongs: ['주민이 예산 집행을 직접 감사하는 제도이다.', '주민이 세율을 직접 결정하는 제도이다.', '주민이 공무원의 인사에 개입하는 제도이다.'], sub: '재무행정', level: 'beginner' }
    ];

    return concepts.map(c => ({
      area: '직무수행능력', areaCode: 'job', level: c.level,
      generator: () => {
        const choices = [c.correct, ...c.wrongs];
        this._shuffle(choices);
        return {
          area: '직무수행능력', subArea: c.sub, level: c.level, type: 'PSAT형', timeLimit: 90,
          question: c.q, choices, answer: choices.indexOf(c.correct),
          explanation: `정답: ${c.correct}`, keywords: [c.sub, '행정학']
        };
      }
    }));
  }

  // ─── 직무수행: 회계학 ───
  _jobAcctTemplates() {
    return ['beginner', 'intermediate', 'advanced'].map(level => ({
      area: '직무수행능력', areaCode: 'job', level,
      generator: () => {
        if (level === 'beginner') {
          const concepts = [
            { q: '복식부기의 원리에 대한 설명으로 옳은 것은?', correct: '모든 거래는 차변과 대변에 동시에 같은 금액으로 기록한다.',
              wrongs: ['수입만 기록하고 지출은 기록하지 않는다.', '현금 거래만 기록한다.', '매월 1회만 기록한다.'] },
            { q: '다음 중 자산에 해당하는 것은?', correct: '매출채권',
              wrongs: ['미지급금', '자본금', '매출액'] }
          ];
          const c = concepts[this._rand(0, concepts.length - 1)];
          const choices = [c.correct, ...c.wrongs]; this._shuffle(choices);
          return { area: '직무수행능력', subArea: '회계원리', level, type: '피듈형', timeLimit: 60,
            question: c.q, choices, answer: choices.indexOf(c.correct),
            explanation: `정답: ${c.correct}`, keywords: ['회계원리', '회계학'] };
        }

        // 중급/고급: 분개 문제
        const amount = this._rand(100, 900) * 10000;
        const amountStr = (amount / 10000).toLocaleString() + '만원';
        const transactions = [
          { desc: `사무용품 ${amountStr}을 현금으로 구매`, correct: '(차) 소모품비 / (대) 현금',
            wrongs: ['(차) 현금 / (대) 소모품비', '(차) 매입채무 / (대) 현금', '(차) 소모품비 / (대) 매출채권'] },
          { desc: `급여 ${amountStr}을 보통예금에서 이체 지급`, correct: '(차) 급여 / (대) 보통예금',
            wrongs: ['(차) 보통예금 / (대) 급여', '(차) 급여 / (대) 미지급금', '(차) 인건비 / (대) 현금'] }
        ];
        const t = transactions[this._rand(0, transactions.length - 1)];
        const choices = [t.correct, ...t.wrongs]; this._shuffle(choices);
        return { area: '직무수행능력', subArea: '분개처리', level, type: 'PSAT형', timeLimit: 90,
          question: `다음 거래의 분개로 옳은 것은?\n\n"${t.desc}"`, choices, answer: choices.indexOf(t.correct),
          explanation: `${t.desc} → ${t.correct}`, keywords: ['분개', '회계처리', '회계학'] };
      }
    }));
  }

  // ─── 조직이해 ───
  _orgTemplates() {
    const concepts = [
      { q: '매트릭스 조직의 특징으로 옳은 것은?', correct: '기능부서와 프로젝트팀의 이중 보고 체계를 갖는다.',
        wrongs: ['하나의 명령 계통만 존재한다.', '프로젝트 종료 후에도 팀이 유지된다.', '최고경영자만이 의사결정권을 갖는다.'], level: 'intermediate' },
      { q: '공공기관의 유형 중 준정부기관에 대한 설명으로 옳은 것은?',
        correct: '공기업이 아닌 공공기관 중 기금관리형과 위탁집행형으로 구분된다.',
        wrongs: ['정부가 50% 이상 출자한 기관만 해당한다.', '시장형과 준시장형으로 구분된다.', '기타공공기관과 동일한 분류이다.'], level: 'advanced' }
    ];
    return concepts.map(c => ({
      area: '조직이해능력', areaCode: 'org', level: c.level,
      generator: () => {
        const choices = [c.correct, ...c.wrongs]; this._shuffle(choices);
        return { area: '조직이해능력', subArea: '조직구조', level: c.level, type: 'PSAT형', timeLimit: 80,
          question: c.q, choices, answer: choices.indexOf(c.correct),
          explanation: `정답: ${c.correct}`, keywords: ['조직이해', '조직구조'] };
      }
    }));
  }

  // ─── 직업윤리 ───
  _ethicsTemplates() {
    const concepts = [
      { q: '공직자가 직무 관련 이해충돌이 발생했을 때 취해야 할 가장 우선적인 조치는?',
        correct: '소속 기관장에게 해당 사실을 신고하고 회피를 신청한다.',
        wrongs: ['본인이 공정하게 처리하면 문제없으므로 그대로 진행한다.', '동료에게만 알리고 업무를 계속한다.', '해당 업무를 비공식적으로 다른 사람에게 넘긴다.'], level: 'intermediate' },
      { q: '김영란법(부정청탁 및 금품수수의 금지에 관한 법률)상 직무관련자에게 제공할 수 있는 식사 한도는?',
        correct: '3만원', wrongs: ['5만원', '10만원', '1만원'], level: 'beginner' }
    ];
    return concepts.map(c => ({
      area: '직업윤리', areaCode: 'ethics', level: c.level,
      generator: () => {
        const choices = [c.correct, ...c.wrongs]; this._shuffle(choices);
        return { area: '직업윤리', subArea: '공직윤리', level: c.level, type: '피듈형', timeLimit: 60,
          question: c.q, choices, answer: choices.indexOf(c.correct),
          explanation: `정답: ${c.correct}`, keywords: ['직업윤리', '공직윤리'] };
      }
    }));
  }

  // ─── 자기개발 ───
  _selfDevTemplates() {
    const concepts = [
      { q: '경력개발(CDP)에서 개인이 자기 분석을 할 때 활용할 수 있는 도구로 적절하지 않은 것은?',
        correct: '손익계산서', wrongs: ['SWOT 분석', 'MBTI 성격유형검사', 'Holland 직업적성검사'], level: 'beginner' },
      { q: '평생학습체제에서 비형식학습(Non-formal Learning)에 해당하는 것은?',
        correct: '직장 내 OJT(On-the-Job Training)',
        wrongs: ['대학교 정규 교과과정 수료', '우연한 경험을 통한 학습', '국가자격시험 응시'], level: 'intermediate' }
    ];
    return concepts.map(c => ({
      area: '자기개발능력', areaCode: 'self', level: c.level,
      generator: () => {
        const choices = [c.correct, ...c.wrongs]; this._shuffle(choices);
        return { area: '자기개발능력', subArea: '경력개발', level: c.level, type: '모듈형', timeLimit: 60,
          question: c.q, choices, answer: choices.indexOf(c.correct),
          explanation: `정답: ${c.correct}`, keywords: ['자기개발', '경력개발'] };
      }
    }));
  }

  // ─── 대인관계 ───
  _interPersonalTemplates() {
    const concepts = [
      { q: '팀 발달 단계(Tuckman 모델)의 올바른 순서는?',
        correct: '형성기 → 갈등기 → 규범기 → 성과기',
        wrongs: ['갈등기 → 형성기 → 성과기 → 규범기', '규범기 → 형성기 → 갈등기 → 성과기', '성과기 → 규범기 → 갈등기 → 형성기'], level: 'intermediate' },
      { q: '비폭력 대화(NVC)의 4단계 순서로 옳은 것은?',
        correct: '관찰 → 느낌 → 욕구 → 부탁',
        wrongs: ['느낌 → 관찰 → 부탁 → 욕구', '부탁 → 욕구 → 관찰 → 느낌', '욕구 → 느낌 → 관찰 → 부탁'], level: 'advanced' }
    ];
    return concepts.map(c => ({
      area: '대인관계능력', areaCode: 'inter', level: c.level,
      generator: () => {
        const choices = [c.correct, ...c.wrongs]; this._shuffle(choices);
        return { area: '대인관계능력', subArea: '팀워크', level: c.level, type: '피듈형', timeLimit: 70,
          question: c.q, choices, answer: choices.indexOf(c.correct),
          explanation: `정답: ${c.correct}`, keywords: ['대인관계', '팀워크'] };
      }
    }));
  }

  // ─── 기술능력 ───
  _techTemplates() {
    const concepts = [
      { q: '기술경영에서 기술수명주기(Technology Life Cycle)의 단계 순서로 옳은 것은?',
        correct: '도입기 → 성장기 → 성숙기 → 쇠퇴기',
        wrongs: ['성장기 → 도입기 → 쇠퇴기 → 성숙기', '성숙기 → 성장기 → 도입기 → 쇠퇴기', '도입기 → 성숙기 → 성장기 → 쇠퇴기'], level: 'beginner' },
      { q: '다음 중 클라우드 컴퓨팅 서비스 모델에 해당하지 않는 것은?',
        correct: 'DaaS(Database as a Service)',
        wrongs: ['IaaS(Infrastructure as a Service)', 'PaaS(Platform as a Service)', 'SaaS(Software as a Service)'], level: 'intermediate' }
    ];
    return concepts.map(c => ({
      area: '기술능력', areaCode: 'tech', level: c.level,
      generator: () => {
        const choices = [c.correct, ...c.wrongs]; this._shuffle(choices);
        return { area: '기술능력', subArea: '기술이해', level: c.level, type: '모듈형', timeLimit: 60,
          question: c.q, choices, answer: choices.indexOf(c.correct),
          explanation: `정답: ${c.correct}`, keywords: ['기술능력', '기술이해'] };
      }
    }));
  }

  // ════════════════════════════════════════
  // 추가 템플릿 — 영역별 심화 (무한 변형 강화)
  // ════════════════════════════════════════

  _buildExtraTemplates() {
    return [
      // ── 수리: 증감률 비교 ──
      { area: '수리능력', areaCode: 'math', level: 'intermediate', generator: () => {
        const y1 = this._rand(200, 500); const y2 = y1 + this._rand(20, 100); const y3 = y2 + this._rand(10, 80);
        const r1 = ((y2 - y1) / y1 * 100).toFixed(1); const r2 = ((y3 - y2) / y2 * 100).toFixed(1);
        const bigger = parseFloat(r1) > parseFloat(r2) ? '전년 대비 증가율' : '전년 대비 증가율';
        return { area: '수리능력', subArea: '증감률', level: 'intermediate', type: 'PSAT형', timeLimit: 90,
          question: `A기관의 연도별 민원 처리 건수가 다음과 같다.\n2023년: ${y1}건, 2024년: ${y2}건, 2025년: ${y3}건\n\n2024년의 전년 대비 증가율과 2025년의 전년 대비 증가율을 각각 구하면?`,
          choices: [`${r1}%, ${r2}%`, `${r2}%, ${r1}%`, `${((y2-y1)/y1*100+2).toFixed(1)}%, ${r2}%`, `${r1}%, ${((y3-y2)/y2*100+3).toFixed(1)}%`],
          answer: 0, explanation: `2024년 증가율: (${y2}-${y1})/${y1}×100 = ${r1}%. 2025년 증가율: (${y3}-${y2})/${y2}×100 = ${r2}%.`,
          keywords: ['증감률', '전년대비', '민원처리'] };
      }},
      // ── 수리: 비율/비중 계산 ──
      { area: '수리능력', areaCode: 'math', level: 'beginner', generator: () => {
        const total = this._rand(300, 800); const partA = this._rand(80, total-100); const partB = total - partA;
        const pctA = (partA / total * 100).toFixed(1); const pctB = (partB / total * 100).toFixed(1);
        return { area: '수리능력', subArea: '비율계산', level: 'beginner', type: 'PSAT형', timeLimit: 90,
          question: `한 기관의 전체 직원 수가 ${total}명이고, 이 중 남성이 ${partA}명이다. 남성과 여성의 비율은 각각 전체의 몇 %인가?`,
          choices: [`남성 ${pctA}%, 여성 ${pctB}%`, `남성 ${pctB}%, 여성 ${pctA}%`, `남성 ${(parseFloat(pctA)+1.5).toFixed(1)}%, 여성 ${(parseFloat(pctB)-1.5).toFixed(1)}%`, `남성 50.0%, 여성 50.0%`],
          answer: 0, explanation: `남성 비율: ${partA}/${total}×100 = ${pctA}%. 여성 비율: ${partB}/${total}×100 = ${pctB}%.`,
          keywords: ['비율', '비중', '직원현황'] };
      }},
      // ── 수리: 할인/단가 계산 ──
      { area: '수리능력', areaCode: 'math', level: 'intermediate', generator: () => {
        const price = this._rand(10, 50) * 1000; const qty = this._rand(20, 100);
        const disc = this._rand(5, 20); const total = price * qty; const discAmt = total * disc / 100;
        const final = total - discAmt;
        return { area: '수리능력', subArea: '손익분석', level: 'intermediate', type: 'PSAT형', timeLimit: 90,
          question: `사무용품 A의 단가는 ${price.toLocaleString()}원이고 ${qty}개를 구매한다. ${disc}% 할인이 적용될 때 최종 결제 금액은?`,
          choices: [`${final.toLocaleString()}원`, `${(final + 10000).toLocaleString()}원`, `${(final - 5000).toLocaleString()}원`, `${total.toLocaleString()}원`],
          answer: 0, explanation: `총액: ${price.toLocaleString()}×${qty} = ${total.toLocaleString()}원. ${disc}% 할인: ${discAmt.toLocaleString()}원. 최종: ${final.toLocaleString()}원.`,
          keywords: ['할인계산', '구매', '단가'] };
      }},
      // ── 의사소통: 공문서 규정 세부 조건 혼동 ──
      { area: '의사소통능력', areaCode: 'comm', level: 'intermediate', generator: () => {
        const deadlineDays = this._rand(3, 7);
        const quorum = this._rand(5, 9);
        const approvalRatio = ['과반수', '출석위원 2/3 이상', '재적위원 과반수'][this._rand(0,2)];
        const noticeDays = this._rand(3, 7);
        const minutesDays = this._rand(3, 7);
        const wrongNotice = noticeDays - this._rand(1, 2);
        const wrongMinutes = minutesDays + this._rand(2, 4);
        const scenarios = [
          { q: `위원회 회의 안건은 회의일 ${noticeDays}일 전까지 통보해야 한다. 다음 중 규정을 위반한 것은?`,
            correct: `회의 안건을 회의일 ${wrongNotice}일 전에 통보하였다.`,
            wrongs: [
              `회의 안건을 회의일 ${noticeDays}일 전에 이메일로 통보하였다.`,
              `위원장이 긴급 안건에 대해 임시회의를 소집하였다.`,
              `회의록을 회의 종료 후 ${minutesDays}일 이내에 작성·배포하였다.`
            ]
          },
          { q: `공문서 기안 규정에 따르면, ${deadlineDays}일 이상 소요되는 업무는 중간보고를 해야 한다. 다음 중 옳은 것은?`,
            correct: `${deadlineDays+1}일 소요 업무에 대해 중간보고서를 작성하였다.`,
            wrongs: [
              `${deadlineDays-1}일 소요 업무에 대해 중간보고서를 작성하였다.`,
              `${deadlineDays}일 소요 업무이나 중간보고 없이 완결 처리하였다.`,
              `중간보고는 구두보고로 갈음할 수 있어 별도 문서를 작성하지 않았다.`
            ]
          }
        ];
        const s = scenarios[this._rand(0, scenarios.length-1)];
        const choices = [s.correct, ...s.wrongs]; this._shuffle(choices);
        return { area: '의사소통능력', subArea: '규정해석', level: 'intermediate', type: 'PSAT형', timeLimit: 90,
          question: s.q, choices, answer: choices.indexOf(s.correct),
          explanation: `규정의 기한과 조건을 정확히 적용해야 합니다. ${s.correct}`,
          keywords: ['규정해석', '기한계산', '세부조건'] };
      }},
      // ── 의사소통: 유사 공문서 표현 구별 (함정 강화) ──
      { area: '의사소통능력', areaCode: 'comm', level: 'intermediate', generator: () => {
        const cases = [
          { q: '공문서의 "끝" 표기 규정에 대한 설명으로 옳은 것은?',
            correct: '본문의 내용이 끝나면 한 칸을 띄우고 "끝"을 쓰되, 첨부물이 있으면 첨부 표시 다음 줄에 "끝"을 쓴다.',
            wrongs: [
              '본문의 내용이 끝나면 줄을 바꾸고 가운데 정렬로 "끝"을 쓴다.',
              '첨부물이 있는 경우에는 "끝" 표기를 생략할 수 있다.',
              '"끝"은 본문 마지막 글자 바로 뒤에 마침표 대신 붙여 쓴다.'
            ]
          },
          { q: '공문서 작성 시 날짜 표기 방법으로 올바른 것은?',
            correct: '2026. 4. 8. (마침표로 구분, 마지막에도 마침표)',
            wrongs: [
              '2026.4.8 (마침표로 구분, 마지막 마침표 없음)',
              '2026년 04월 08일 (한글 표기, 0 채움)',
              '2026/4/8 (슬래시로 구분)'
            ]
          },
          { q: '다음 중 공문서 두문(머리말)의 구성 요소로 옳지 않은 것은?',
            correct: '발신자의 개인 연락처(휴대폰 번호)',
            wrongs: [
              '발신 기관명',
              '수신자(수신 기관 또는 직위)',
              '문서 번호 및 시행일자'
            ]
          }
        ];
        const c = cases[this._rand(0, cases.length-1)];
        const choices = [c.correct, ...c.wrongs]; this._shuffle(choices);
        return { area: '의사소통능력', subArea: '문서작성', level: 'intermediate', type: 'PSAT형', timeLimit: 90,
          question: c.q, choices, answer: choices.indexOf(c.correct),
          explanation: `정답: ${c.correct}. 공문서 작성 규정의 세부 사항을 정확히 알아야 구별 가능합니다.`,
          keywords: ['공문서작성', '문서규정', '세부규칙'] };
      }},
      // ── 문제해결: 논리 조건 추론 ──
      { area: '문제해결능력', areaCode: 'prob', level: 'intermediate', generator: () => {
        const names = ['김과장', '이대리', '박주임', '최사원', '정대리', '한과장'];
        this._shuffle(names);
        const [a,b,c] = [names[0], names[1], names[2]];
        return { area: '문제해결능력', subArea: '논리추론', level: 'intermediate', type: 'PSAT형', timeLimit: 90,
          question: `다음 조건이 모두 참일 때, 반드시 참인 것은?\n\n• ${a}가 출장을 가면 ${b}도 출장을 간다.\n• ${b}가 출장을 가면 ${c}는 사무실에 남는다.\n• ${a}가 출장을 갔다.`,
          choices: [`${c}는 출장을 갔다.`, `${b}는 사무실에 남았다.`, `${c}는 사무실에 남았다.`, `${a}는 사무실에 남았다.`],
          answer: 2, explanation: `${a} 출장 → ${b} 출장(조건1) → ${c} 사무실(조건2). 따라서 ${c}는 사무실에 남았다.`,
          keywords: ['조건추론', '삼단논법', '논리'] };
      }},
      // ── 문제해결: 우선순위 매트릭스 (함정 강화) ──
      { area: '문제해결능력', areaCode: 'prob', level: 'intermediate', generator: () => {
        const scenarios = [
          { q: '아이젠하워 매트릭스(긴급-중요도)에 따라 업무를 분류할 때, 다음 중 "중요하지만 긴급하지 않은"(제2사분면) 업무로 가장 적절한 것은?',
            correct: '직원 역량 강화를 위한 교육 프로그램 기획(마감 미정)',
            wrongs: [
              '내일 오전 납품 예정인 거래처 납품서류 최종 검토',
              '오늘 퇴근 전까지 제출해야 하는 부서 월간보고서 작성',
              '방금 들어온 민원 전화 회신(상급자 지시)'
            ]
          },
          { q: '긴급-중요도 매트릭스 적용 시, 다음 업무 중 "위임(Delegate)" 처리가 적절한 것은?',
            correct: '오늘까지 발송해야 하는 정기 안내문 인쇄 및 봉투 작업',
            wrongs: [
              '핵심 고객사와의 계약 조건 최종 협의(내일 회의)',
              '신규 프로젝트 전략 방향 수립을 위한 자료 조사(다음 주 보고)',
              '사내 메신저로 온 일상적 질문에 답변하기'
            ]
          },
          { q: '다음 중 긴급-중요도 매트릭스에서 "제거/축소(Eliminate)" 대상으로 가장 적절한 것은?',
            correct: '습관적으로 확인하는 업무 외 SNS 및 뉴스 피드 탐색',
            wrongs: [
              '반복적이지만 기한이 있는 경비 정산서 작성',
              '급하지는 않지만 전문성 향상에 도움되는 온라인 강좌 수강',
              '동료가 긴급 요청한 회의 자료 복사'
            ]
          }
        ];
        const s = scenarios[this._rand(0, scenarios.length-1)];
        const choices = [s.correct, ...s.wrongs]; this._shuffle(choices);
        return { area: '문제해결능력', subArea: '의사결정', level: 'intermediate', type: 'PSAT형', timeLimit: 90,
          question: s.q, choices, answer: choices.indexOf(s.correct),
          explanation: `정답: ${s.correct}\n매트릭스 분류 핵심은 '긴급성(기한 임박 여부)'과 '중요성(본질적 가치)'을 구분하는 것입니다. 유사한 업무도 기한·성격에 따라 사분면이 달라집니다.`,
          keywords: ['아이젠하워', '우선순위', '사분면분류'] };
      }},
      // ── 자원관리: 인원/예산 배분 ──
      { area: '자원관리능력', areaCode: 'res', level: 'intermediate', generator: () => {
        const budget = this._rand(5, 20) * 100; // 만원 단위
        const pctA = this._rand(30, 50); const pctB = this._rand(20, 40); const pctC = 100 - pctA - pctB;
        const amtA = budget * pctA / 100; const amtB = budget * pctB / 100; const amtC = budget * pctC / 100;
        return { area: '자원관리능력', subArea: '예산관리', level: 'intermediate', type: 'PSAT형', timeLimit: 90,
          question: `총 예산 ${budget}만원을 A사업(${pctA}%), B사업(${pctB}%), C사업(${pctC}%)으로 배분할 때, 각 사업의 예산액은?`,
          choices: [`A ${amtA}만원, B ${amtB}만원, C ${amtC}만원`, `A ${amtB}만원, B ${amtA}만원, C ${amtC}만원`, `A ${amtA}만원, B ${amtC}만원, C ${amtB}만원`, `A ${amtC}만원, B ${amtB}만원, C ${amtA}만원`],
          answer: 0, explanation: `A: ${budget}×${pctA}% = ${amtA}만원, B: ${budget}×${pctB}% = ${amtB}만원, C: ${budget}×${pctC}% = ${amtC}만원.`,
          keywords: ['예산배분', '비율', '사업예산'] };
      }},
      // ── 정보: SQL/데이터베이스 (함정 강화) ──
      { area: '정보능력', areaCode: 'info', level: 'advanced', generator: () => {
        const scenarios = [
          { q: '직원 테이블에서 부서별 평균 급여가 300만원 이상인 부서만 조회하려 한다. 올바른 SQL문은?',
            correct: "SELECT 부서, AVG(급여) FROM 직원 GROUP BY 부서 HAVING AVG(급여) >= 3000000",
            wrongs: [
              "SELECT 부서, AVG(급여) FROM 직원 WHERE AVG(급여) >= 3000000 GROUP BY 부서",
              "SELECT 부서, AVG(급여) FROM 직원 GROUP BY 부서 WHERE AVG(급여) >= 3000000",
              "SELECT 부서, AVG(급여) FROM 직원 HAVING AVG(급여) >= 3000000"
            ]
          },
          { q: '주문 테이블에서 고객별 주문 건수를 구하되, 주문 건수가 5건 이상인 고객만 주문 건수 내림차순으로 조회하려 한다. SQL문의 올바른 절 순서는?',
            correct: "SELECT → FROM → GROUP BY → HAVING → ORDER BY",
            wrongs: [
              "SELECT → FROM → WHERE → GROUP BY → ORDER BY",
              "SELECT → FROM → GROUP BY → WHERE → ORDER BY",
              "SELECT → FROM → HAVING → GROUP BY → ORDER BY"
            ]
          },
          { q: '다음 SQL문의 실행 결과에 대한 설명으로 옳은 것은?\n\nSELECT 부서, COUNT(*) AS 인원\nFROM 직원\nWHERE 입사일 >= \'2020-01-01\'\nGROUP BY 부서\nHAVING COUNT(*) >= 3',
            correct: '2020년 이후 입사자가 3명 이상인 부서의 부서명과 해당 인원수를 조회한다.',
            wrongs: [
              '전체 직원 중 3명 이상인 부서에서 2020년 이후 입사자를 조회한다.',
              '2020년 이후 입사자를 먼저 3명씩 그룹으로 나눈 후 부서별로 집계한다.',
              '부서별 전체 인원이 3명 이상이면서 2020년 이후 입사한 직원 목록을 조회한다.'
            ]
          }
        ];
        const s = scenarios[this._rand(0, scenarios.length-1)];
        const choices = [s.correct, ...s.wrongs]; this._shuffle(choices);
        return { area: '정보능력', subArea: '정보처리', level: 'advanced', type: 'PSAT형', timeLimit: 120,
          question: s.q, choices, answer: choices.indexOf(s.correct),
          explanation: `정답: ${s.correct}\nSQL 실행 순서(FROM→WHERE→GROUP BY→HAVING→SELECT→ORDER BY)와 WHERE/HAVING의 차이를 정확히 이해해야 합니다.`,
          keywords: ['SQL', 'GROUP BY', 'HAVING', '데이터베이스'] };
      }},
      // ── 정보: 정보보안 사례 (함정 강화) ──
      { area: '정보능력', areaCode: 'info', level: 'intermediate', generator: () => {
        const scenarios = [
          { q: '다음 사례에서 발생한 보안 위협 유형으로 가장 적절한 것은?\n\n"A기관 직원에게 내부 시스템 관리자를 사칭한 이메일이 도착했다. 이메일에는 \'보안 패치 적용을 위해 아래 링크에서 로그인하세요\'라는 문구와 함께 실제 사내 포털과 거의 동일하게 만든 가짜 로그인 페이지 링크가 포함되어 있었다."',
            correct: '스피어피싱(Spear Phishing) — 특정 조직·개인을 타겟팅한 맞춤형 피싱',
            wrongs: [
              '피싱(Phishing) — 불특정 다수를 대상으로 한 일반적 사칭 이메일',
              '파밍(Pharming) — DNS를 변조하여 정상 사이트 접속 시 가짜 사이트로 유도',
              '워터링홀(Watering Hole) — 대상이 자주 방문하는 웹사이트를 감염시키는 공격'
            ]
          },
          { q: '다음 보안 사고의 원인으로 가장 적절한 공격 유형은?\n\n"B사 전 직원 수천 명에게 \'택배 배송 확인\'이라는 동일한 문자메시지가 발송되었고, 링크를 클릭한 직원의 휴대폰에 악성 앱이 설치되어 개인정보가 유출되었다."',
            correct: '스미싱(Smishing) — SMS를 이용한 악성 링크 유포',
            wrongs: [
              '스피어피싱(Spear Phishing) — 특정 대상 맞춤형 피싱 공격',
              '보이스피싱(Voice Phishing) — 전화를 통한 사기·개인정보 탈취',
              '큐싱(Qshing) — QR코드를 이용한 악성 사이트 유도'
            ]
          },
          { q: '다음 상황에서 사용된 공격 기법으로 가장 적절한 것은?\n\n"C사의 웹서버에 수만 대의 좀비PC로부터 동시에 대량의 트래픽이 유입되어 서비스가 3시간 동안 마비되었다. 공격자는 서비스 복구 대가로 금전을 요구하였다."',
            correct: 'DDoS(분산서비스거부) — 다수 시스템을 이용한 동시 트래픽 과부하 공격',
            wrongs: [
              'DoS(서비스거부) — 단일 시스템에서의 트래픽 과부하 공격',
              '랜섬웨어(Ransomware) — 시스템을 암호화하고 금전을 요구하는 악성코드',
              'APT(지능형지속위협) — 장기간 잠복하며 정보를 탈취하는 지능형 공격'
            ]
          }
        ];
        const s = scenarios[this._rand(0, scenarios.length-1)];
        const choices = [s.correct, ...s.wrongs]; this._shuffle(choices);
        return { area: '정보능력', subArea: '정보보안', level: 'intermediate', type: '피듈형', timeLimit: 90,
          question: s.q, choices, answer: choices.indexOf(s.correct),
          explanation: `정답: ${s.correct}\n유사 공격 유형 간 차이(대상 범위, 공격 경로, 방식)를 정확히 구분해야 합니다.`,
          keywords: ['사이버공격', '정보보안', '공격유형구분'] };
      }},
      // ── 직업윤리: 김영란법 금액 판단 ──
      { area: '직업윤리', areaCode: 'ethics', level: 'intermediate', generator: () => {
        const amt = this._rand(1, 8) * 10000; // 1~8만원
        const isMeal = amt <= 30000;
        return { area: '직업윤리', subArea: '청렴', level: 'intermediate', type: '피듈형', timeLimit: 90,
          question: `청탁금지법(김영란법)상 공직자가 직무 관련자로부터 받을 수 있는 음식물 제공 한도는 3만원이다. 직무 관련자가 ${amt.toLocaleString()}원 상당의 식사를 제공한 경우, 이를 수수할 수 있는가?`,
          choices: [isMeal ? '수수 가능 (한도 이내)' : '수수 불가 (한도 초과)', !isMeal ? '수수 가능 (한도 이내)' : '수수 불가 (한도 초과)', '금액과 관계없이 항상 수수 가능', '금액과 관계없이 항상 수수 불가'],
          answer: 0, explanation: `청탁금지법상 음식물 한도는 3만원입니다. ${amt.toLocaleString()}원은 ${isMeal ? '한도 이내로 수수 가능' : '한도 초과로 수수 불가'}합니다.`,
          keywords: ['김영란법', '청탁금지법', '음식물한도'] };
      }},
      // ── 조직이해: 조직구조 사례 판단 (함정 강화) ──
      { area: '조직이해능력', areaCode: 'org', level: 'intermediate', generator: () => {
        const scenarios = [
          { q: 'K공기업은 기획조정실·인사부·재무부·사업부가 있으며, 최근 대형 프로젝트를 위해 각 부서에서 인원을 차출하여 TF팀을 구성했다. TF팀원은 원 소속 부서장에게도 보고하고, TF 팀장에게도 보고한다. 이 조직 형태에 대한 설명으로 옳은 것은?',
            correct: '매트릭스 조직 — 기능부서와 프로젝트 조직의 이중 보고체계로, 자원의 효율적 활용이 가능하나 명령 통일성이 약화될 수 있다.',
            wrongs: [
              '사업부제 조직 — 프로젝트별로 독립적 사업부를 운영하므로, TF팀원은 원 소속 부서와의 관계가 완전히 단절된다.',
              '팀제 조직 — 수평적 팀 구조로 전환된 것이므로, 기존 부서 체계는 공식적으로 폐지된 것이다.',
              '네트워크 조직 — 외부 전문가를 포함한 유연한 협업체이므로, 사내 인원만으로 구성될 수 없다.'
            ]
          },
          { q: 'M그룹은 전자사업부·화학사업부·건설사업부로 구성되어 있으며, 각 사업부에 생산·마케팅·재무 기능이 포함되어 독립 채산제로 운영된다. 이 조직의 단점으로 가장 적절한 것은?',
            correct: '각 사업부에 유사 기능이 중복 배치되어 인력·자원의 비효율이 발생할 수 있다.',
            wrongs: [
              '명령 계통이 이원화되어 보고 혼선이 빈번하게 발생한다.',
              '부서 간 칸막이(silo)로 인해 전문성 축적이 어렵다.',
              '사업부 간 인력 이동이 자유로워 핵심 인재 유출 위험이 크다.'
            ]
          },
          { q: 'S시청은 부시장 아래 국장-과장-팀장 순으로 편제되어 있으며, 상위 직급이 하위 직급을 직접 지휘·감독한다. 이 조직 형태의 장점으로 가장 적절한 것은?',
            correct: '명령 통일의 원칙이 확보되어 책임 소재가 명확하다.',
            wrongs: [
              '환경 변화에 대한 신속한 대응이 가능하고 유연성이 높다.',
              '부서 간 수평적 협업이 활발하여 혁신이 촉진된다.',
              '전문 스태프의 조언을 통해 의사결정의 질이 높아진다.'
            ]
          }
        ];
        const s = scenarios[this._rand(0, scenarios.length-1)];
        const choices = [s.correct, ...s.wrongs]; this._shuffle(choices);
        return { area: '조직이해능력', subArea: '조직체계', level: 'intermediate', type: 'PSAT형', timeLimit: 90,
          question: s.q, choices, answer: choices.indexOf(s.correct),
          explanation: `정답: ${s.correct}\n조직 구조별 특성(장·단점, 보고체계, 적용 상황)을 정확히 구분해야 합니다.`,
          keywords: ['조직구조', '조직유형', '장단점'] };
      }},
      // ── 자기개발: 학습·경력개발 이론 (함정 강화) ──
      { area: '자기개발능력', areaCode: 'self', level: 'intermediate', generator: () => {
        const scenarios = [
          { q: '신입사원 A는 어려운 업무를 맡게 되었다. 동기인 B가 비슷한 난이도의 업무를 성공적으로 수행하는 것을 보고, "나도 할 수 있겠다"는 자신감이 생겼다. 이 현상을 설명하는 Bandura의 개념과 그 향상 요인으로 가장 적절한 것은?',
            correct: '자기효능감(Self-Efficacy) — 대리 경험(vicarious experience)을 통해 향상됨',
            wrongs: [
              '자기효능감(Self-Efficacy) — 성취 경험(mastery experience)을 통해 향상됨',
              '자아존중감(Self-Esteem) — 타인의 성공을 관찰하여 자기 가치감이 향상됨',
              '성장 마인드셋(Growth Mindset) — 동료의 노력을 보며 능력의 가변성을 인식함'
            ]
          },
          { q: '직장인 C는 시험에서 좋은 성적을 받은 후 "내가 열심히 공부한 덕분이야"라고 생각했지만, 나쁜 성적을 받았을 때는 "시험 문제가 너무 어려웠어"라고 생각했다. 이러한 심리적 편향을 설명하는 이론은?',
            correct: '귀인이론(Attribution Theory) — 성공은 내부 귀인, 실패는 외부 귀인하는 자기보호적 편향',
            wrongs: [
              '인지부조화(Cognitive Dissonance) — 실패 경험과 자아상 간 불일치를 해소하려는 심리',
              '자기효능감(Self-Efficacy) — 성공 경험이 자기 능력에 대한 믿음을 강화한 결과',
              '메타인지(Metacognition) — 자신의 학습 과정을 모니터링하고 평가하는 능력'
            ]
          },
          { q: 'D대리는 학습 시 "이 내용을 정말 이해하고 있는가?"를 스스로 점검하고, 이해가 부족한 부분을 파악하여 전략을 수정한다. 이러한 학습 능력에 대한 설명으로 옳은 것은?',
            correct: '메타인지(Metacognition) — 인지에 대한 인지로, 계획·모니터링·평가 과정을 포함한다.',
            wrongs: [
              '자기조절학습(Self-Regulated Learning) — 학습 동기, 감정, 환경까지 포괄적으로 조절하는 능력이다.',
              '비판적 사고(Critical Thinking) — 정보의 타당성과 논리적 오류를 분석하는 능력이다.',
              '성찰적 실천(Reflective Practice) — 실무 경험을 되돌아보며 암묵지를 형식지로 전환하는 과정이다.'
            ]
          }
        ];
        const s = scenarios[this._rand(0, scenarios.length-1)];
        const choices = [s.correct, ...s.wrongs]; this._shuffle(choices);
        return { area: '자기개발능력', subArea: '학습전략', level: 'intermediate', type: 'PSAT형', timeLimit: 90,
          question: s.q, choices, answer: choices.indexOf(s.correct),
          explanation: `정답: ${s.correct}\n유사 개념 간 미세한 차이(자기효능감 vs 자아존중감, 메타인지 vs 자기조절학습 등)를 정확히 구분해야 합니다.`,
          keywords: ['자기개발', '학습이론', '유사개념구분'] };
      }},
      // ── 대인관계: 갈등·협상·리더십 (함정 강화) ──
      { area: '대인관계능력', areaCode: 'inter', level: 'intermediate', generator: () => {
        const scenarios = [
          { q: '팀장 E는 부서 간 업무 분담 갈등 상황에서, 양측 담당자와 별도로 면담하여 각자의 핵심 이해관계를 파악한 후, 양측 모두 수용할 수 있는 새로운 업무 프로세스를 설계하였다. Thomas-Kilmann 모형에서 이 전략은?',
            correct: '협력(Collaborating) — 양측의 관심사를 모두 충족시키는 win-win 해결책을 창출',
            wrongs: [
              '타협(Compromising) — 양측이 각각 일부를 양보하여 중간점에서 합의',
              '수용(Accommodating) — 상대방의 요구를 수용하여 관계를 유지하는 전략',
              '경쟁(Competing) — 한 쪽의 입장을 관철시키되, 합리적 근거에 기반'
            ]
          },
          { q: '프로젝트 일정 문제로 개발팀과 기획팀이 갈등 중이다. 팀장 F는 "개발팀은 일정을 2주 연장하되, 기획팀은 요구 기능 3개를 축소한다"는 안을 제시하여 양측이 동의했다. 이 전략의 한계로 가장 적절한 것은?',
            correct: '타협(Compromising) — 양측 모두 부분적으로 불만족하며, 근본적 문제 해결이 안 될 수 있다.',
            wrongs: [
              '협력(Collaborating) — 양측의 이해를 모두 반영했으나, 시간이 과도하게 소요된다.',
              '회피(Avoiding) — 문제 해결을 미루었으므로, 추후 동일 갈등이 재발한다.',
              '수용(Accommodating) — 기획팀이 일방적으로 양보하여 불공정한 결과를 초래한다.'
            ]
          },
          { q: '신입사원 G가 업무 방식에 대해 이의를 제기하자, 과장 H는 "그 문제는 나중에 다시 논의하자"며 대화를 종료했다. 이 갈등 대응이 적절할 수 있는 상황으로 가장 적절한 것은?',
            correct: '현재 더 긴급한 안건이 있어 해당 이슈에 대한 충분한 논의 시간을 확보할 수 없는 경우',
            wrongs: [
              '이슈가 조직의 핵심 가치나 원칙과 관련되어 반드시 즉시 해결해야 하는 경우',
              '신입사원의 의견이 다수 팀원의 지지를 받고 있어 확산될 우려가 있는 경우',
              '동일한 이슈에 대해 이미 여러 차례 회피한 전력이 있는 경우'
            ]
          }
        ];
        const s = scenarios[this._rand(0, scenarios.length-1)];
        const choices = [s.correct, ...s.wrongs]; this._shuffle(choices);
        return { area: '대인관계능력', subArea: '갈등관리', level: 'intermediate', type: 'PSAT형', timeLimit: 90,
          question: s.q, choices, answer: choices.indexOf(s.correct),
          explanation: `정답: ${s.correct}\n갈등관리 전략은 상황(시급성, 중요도, 관계)에 따라 적절한 전략이 달라집니다. 유사 전략 간 미세한 차이를 구분하세요.`,
          keywords: ['Thomas-Kilmann', '갈등관리', '상황판단'] };
      }},
      // ── 직무수행: 경제학 (함정 강화) ──
      { area: '직무수행능력', areaCode: 'job', level: 'intermediate', generator: () => {
        const scenarios = [
          { q: '정부가 쌀에 대해 시장 균형가격보다 높은 수준에서 가격하한(최저가격)을 설정했다. 이로 인해 나타나는 현상으로 가장 적절한 것은?',
            correct: '공급량이 수요량을 초과하여 초과공급(잉여)이 발생한다.',
            wrongs: [
              '수요량이 공급량을 초과하여 초과수요(부족)가 발생한다.',
              '시장가격이 균형가격으로 수렴하므로 실질적 효과가 없다.',
              '공급곡선이 좌측 이동하여 공급량 자체가 감소한다.'
            ]
          },
          { q: 'A재의 가격이 10% 상승했을 때 B재의 수요량이 8% 증가했다. A재와 B재의 관계 및 교차탄력성에 대한 설명으로 옳은 것은?',
            correct: '대체재 관계이며, 교차탄력성은 양(+)의 값(0.8)이다.',
            wrongs: [
              '보완재 관계이며, 교차탄력성은 음(-)의 값(-0.8)이다.',
              '대체재 관계이며, 교차탄력성은 음(-)의 값(-0.8)이다.',
              '독립재 관계이며, 교차탄력성은 0에 가깝다.'
            ]
          },
          { q: '갑은 변호사로 시급 50만원을 받을 수 있고, 타이핑 속도도 빠르다. 을은 타이핑만 가능하며 시급 2만원이다. 비교우위론에 따른 효율적 분업은?',
            correct: '갑은 변호 업무에 집중하고, 을에게 타이핑을 맡기는 것이 효율적이다.',
            wrongs: [
              '갑이 두 업무 모두 잘하므로, 갑이 변호와 타이핑을 모두 담당하는 것이 효율적이다.',
              '갑의 타이핑이 더 빠르므로, 타이핑은 갑이, 을은 대기하는 것이 효율적이다.',
              '절대우위가 있는 사람이 모든 업무를 맡아야 총생산량이 극대화된다.'
            ]
          }
        ];
        const s = scenarios[this._rand(0, scenarios.length-1)];
        const choices = [s.correct, ...s.wrongs]; this._shuffle(choices);
        return { area: '직무수행능력', subArea: '경제학', level: 'intermediate', type: 'PSAT형', timeLimit: 90,
          question: s.q, choices, answer: choices.indexOf(s.correct),
          explanation: `정답: ${s.correct}`,
          keywords: ['경제학', '시장이론', '직무수행'] };
      }},
      // ── 직무수행: 행정학 (함정 강화) ──
      { area: '직무수행능력', areaCode: 'job', level: 'intermediate', generator: () => {
        const scenarios = [
          { q: '다음 중 예산의 원칙과 그 예외의 연결이 옳지 않은 것은?',
            correct: '한정성의 원칙 — 예외: 추가경정예산을 통해 회계연도를 넘겨 집행할 수 있다.',
            wrongs: [
              '완전성의 원칙 — 예외: 순계예산 방식으로 세입·세출의 중복 계상을 줄일 수 있다.',
              '단일성의 원칙 — 예외: 특별회계를 설치하여 일반회계와 별도로 운영할 수 있다.',
              '사전의결의 원칙 — 예외: 긴급한 경우 준예산으로 전년도 수준의 경비를 집행할 수 있다.'
            ]
          },
          { q: '다음 중 공무원 인사제도에 대한 설명으로 옳은 것은?',
            correct: '직위분류제는 직무의 종류·난이도·책임도에 따라 분류하며, 전문가 양성에 유리하다.',
            wrongs: [
              '계급제는 직무 중심으로 분류하여 보수의 형평성 확보에 유리하다.',
              '직위분류제는 인사 이동과 전보가 용이하여 행정의 융통성이 높다.',
              '계급제 하에서는 동일 직무에 동일 보수(equal pay for equal work)가 실현된다.'
            ]
          },
          { q: '정부 예산 과정의 순서로 옳은 것은?',
            correct: '예산편성(행정부) → 예산심의·확정(국회) → 예산집행(행정부) → 결산·감사(감사원/국회)',
            wrongs: [
              '예산심의(국회) → 예산편성(행정부) → 예산집행(행정부) → 결산·감사(감사원)',
              '예산편성(행정부) → 예산집행(행정부) → 예산심의·확정(국회) → 결산·감사(감사원)',
              '예산편성(국회) → 예산심의·확정(행정부) → 예산집행(행정부) → 결산·감사(감사원)'
            ]
          }
        ];
        const s = scenarios[this._rand(0, scenarios.length-1)];
        const choices = [s.correct, ...s.wrongs]; this._shuffle(choices);
        return { area: '직무수행능력', subArea: '행정학', level: 'intermediate', type: 'PSAT형', timeLimit: 90,
          question: s.q, choices, answer: choices.indexOf(s.correct),
          explanation: `정답: ${s.correct}`,
          keywords: ['행정학', '예산', '인사제도', '직무수행'] };
      }},
      // ── 직무수행: 회계 기초 ──
      { area: '직무수행능력', areaCode: 'job', level: 'intermediate', generator: () => {
        const assets = this._rand(5, 20) * 1000; const liab = this._rand(2, assets/1000-1) * 1000;
        const equity = assets - liab;
        return { area: '직무수행능력', subArea: '재무회계', level: 'intermediate', type: 'PSAT형', timeLimit: 90,
          question: `자산 = 부채 + 자본 이라는 회계항등식에서, 자산이 ${assets.toLocaleString()}만원이고 부채가 ${liab.toLocaleString()}만원일 때 자본은?`,
          choices: [`${equity.toLocaleString()}만원`, `${(equity + 1000).toLocaleString()}만원`, `${(equity - 500).toLocaleString()}만원`, `${assets.toLocaleString()}만원`],
          answer: 0, explanation: `자본 = 자산 - 부채 = ${assets.toLocaleString()} - ${liab.toLocaleString()} = ${equity.toLocaleString()}만원`,
          keywords: ['회계항등식', '자산부채자본', '재무회계'] };
      }},
      // ── 기술능력: 기술 적용·비교 (함정 강화) ──
      { area: '기술능력', areaCode: 'tech', level: 'intermediate', generator: () => {
        const scenarios = [
          { q: 'K공장에서는 생산라인의 센서가 실시간으로 온도·진동 데이터를 수집하고, 이를 분석하여 설비 고장을 사전에 예측한다. 이 시스템에 활용된 핵심 기술의 조합으로 가장 적절한 것은?',
            correct: 'IoT(센서 데이터 수집) + AI/빅데이터(예측 분석)',
            wrongs: [
              'AI(센서 데이터 수집) + 클라우드(예측 분석)',
              'RPA(자동 센서 작동) + 블록체인(데이터 무결성 보장)',
              '디지털트윈(가상 시뮬레이션) + 5G(초고속 데이터 전송)'
            ]
          },
          { q: '다음 기술에 대한 설명으로 옳지 않은 것은?',
            correct: 'RPA(로봇프로세스자동화)는 물리적 로봇이 사무실에서 서류를 처리하는 기술이다.',
            wrongs: [
              '디지털 트윈(Digital Twin)은 물리적 객체를 가상 공간에 복제하여 시뮬레이션하는 기술이다.',
              '엣지 컴퓨팅(Edge Computing)은 데이터를 중앙 서버가 아닌 발생 지점 근처에서 처리하는 기술이다.',
              '제로 트러스트(Zero Trust)는 네트워크 내부·외부를 구분하지 않고 모든 접근을 검증하는 보안 모델이다.'
            ]
          },
          { q: 'L기업이 블록체인 기술을 공급망 관리에 도입하려 한다. 블록체인 도입의 기대 효과로 가장 적절한 것은?',
            correct: '거래 이력이 분산 원장에 기록되어 공급망 참여자 간 데이터 위변조를 방지할 수 있다.',
            wrongs: [
              '중앙 서버의 처리 속도가 향상되어 실시간 재고 관리가 가능해진다.',
              '모든 공급망 데이터가 암호화폐로 변환되어 결제가 자동화된다.',
              '블록체인의 스마트 컨트랙트가 물류 로봇을 직접 제어하여 배송을 자동화한다.'
            ]
          }
        ];
        const s = scenarios[this._rand(0, scenarios.length-1)];
        const choices = [s.correct, ...s.wrongs]; this._shuffle(choices);
        return { area: '기술능력', subArea: '기술이해', level: 'intermediate', type: 'PSAT형', timeLimit: 90,
          question: s.q, choices, answer: choices.indexOf(s.correct),
          explanation: `정답: ${s.correct}\n신기술 용어의 정의를 아는 것을 넘어, 실제 적용 맥락과 한계를 정확히 이해해야 합니다.`,
          keywords: ['기술이해', '신기술적용', '기술비교'] };
      }},

      // ════════════════════════════════════════════════════════════════
      //  추가 보강 템플릿 (취약 영역 5개 × 3개씩 = 15개)
      // ════════════════════════════════════════════════════════════════

      // ── 조직이해능력 ① (beginner) 조직 유형별 특성 비교 ──
      { area: '조직이해능력', areaCode: 'org', level: 'beginner', generator: () => {
        const scenarios = [
          { q: '기능식 조직(Functional Organization)의 특징으로 가장 적절한 것은?',
            correct: '유사한 업무를 수행하는 인력을 하나의 부서로 편성하여 전문성 축적에 유리하다.',
            wrongs: [
              '제품·서비스 단위로 독립 사업부를 구성하여 시장 대응력이 높다.',
              '기능부서와 프로젝트팀에 동시 소속되어 이중 보고체계를 갖는다.',
              '외부 전문기관과의 계약 기반 협업 네트워크로 운영된다.'
            ]
          },
          { q: '사업부제 조직(Divisional Organization)의 가장 큰 단점은?',
            correct: '각 사업부에 유사 기능(인사·재무 등)이 중복 배치되어 자원 낭비가 발생할 수 있다.',
            wrongs: [
              '부서 간 이동이 잦아 전문성 축적이 어렵고 업무 연속성이 떨어진다.',
              '이중 보고체계로 인해 명령 통일성이 약화되어 혼선이 발생한다.',
              '최고경영자 1인에게 의사결정이 집중되어 의사결정 속도가 느려진다.'
            ]
          },
          { q: '매트릭스 조직(Matrix Organization)에서 발생할 수 있는 문제로 가장 적절한 것은?',
            correct: '기능부서 관리자와 프로젝트 관리자 간 권한 충돌로 구성원의 역할 모호성이 발생한다.',
            wrongs: [
              '부서 간 칸막이가 강화되어 수평적 협업이 원천적으로 불가능하다.',
              '프로젝트 종료 후 구성원이 원 부서로 복귀할 수 없어 고용 불안이 심화된다.',
              '기능식 조직보다 전문 인력 양성이 용이하여 과잉 전문화가 발생한다.'
            ]
          },
          { q: '다음 중 기능식 조직과 사업부제 조직을 올바르게 비교한 것은?',
            correct: '기능식 조직은 규모의 경제에 유리하고, 사업부제 조직은 시장 변화 대응에 유리하다.',
            wrongs: [
              '기능식 조직은 성과 측정이 용이하고, 사업부제 조직은 전문성 축적에 유리하다.',
              '기능식 조직은 분권적 의사결정 구조이고, 사업부제 조직은 집권적 구조이다.',
              '기능식 조직은 제품 다각화에 적합하고, 사업부제 조직은 단일 제품에 적합하다.'
            ]
          },
          { q: '소규모 스타트업이 급성장하면서 조직 구조를 개편하려 한다. 현재 10명의 직원이 개발·마케팅·운영을 겸하고 있다. 다음 중 가장 먼저 도입하기 적절한 조직 형태는?',
            correct: '기능식 조직 — 개발·마케팅·운영 등 기능별로 부서를 나누어 전문성을 확보한다.',
            wrongs: [
              '매트릭스 조직 — 기능과 프로젝트를 동시에 관리하여 유연성을 극대화한다.',
              '사업부제 조직 — 제품별 독립 사업부를 구성하여 자율 경영을 실시한다.',
              '네트워크 조직 — 외부 파트너와의 계약 관계로 핵심 역량에 집중한다.'
            ]
          }
        ];
        const s = scenarios[Math.floor(Math.random() * scenarios.length)];
        const choices = [s.correct, ...s.wrongs];
        for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
        return {
          question: s.q, choices, answer: choices.indexOf(s.correct),
          keywords: ['기능식조직', '사업부제', '매트릭스', '조직유형비교'],
          type: 'PSAT형', subArea: '조직체계', area: '조직이해능력', level: 'beginner',
          explanation: `정답: ${s.correct}\n기능식(전문성·규모경제) / 사업부제(시장대응·자원중복) / 매트릭스(유연성·이중보고) 각 특징을 구분해야 합니다.`
        };
      }},

      // ── 조직이해능력 ② (intermediate) 경영이해 — BSC·PDCA ──
      { area: '조직이해능력', areaCode: 'org', level: 'intermediate', generator: () => {
        const scenarios = [
          { q: '균형성과표(BSC)의 4대 관점에 해당하지 않는 것은?',
            correct: '규제준수 관점(Compliance Perspective)',
            wrongs: [
              '재무 관점(Financial Perspective)',
              '고객 관점(Customer Perspective)',
              '학습과 성장 관점(Learning & Growth Perspective)'
            ]
          },
          { q: 'BSC의 내부 프로세스 관점(Internal Process Perspective)에서 측정하는 핵심 지표로 가장 적절한 것은?',
            correct: '업무 처리 소요 시간, 불량률, 프로세스 효율성',
            wrongs: [
              '매출 성장률, 투자수익률(ROI), 경제적 부가가치(EVA)',
              '고객 만족도, 고객 유지율, 시장 점유율',
              '직원 역량 지수, 교육 이수율, 정보 시스템 활용도'
            ]
          },
          { q: 'PDCA 사이클에서 Check 단계의 활동으로 가장 적절한 것은?',
            correct: '실행 결과를 계획 대비 측정·분석하여 목표 달성 여부를 평가한다.',
            wrongs: [
              '문제점을 파악하고 개선 목표 및 실행 계획을 수립한다.',
              '수립된 계획에 따라 업무를 실행하고 데이터를 수집한다.',
              '평가 결과를 바탕으로 표준화하거나 새로운 개선 과제를 도출한다.'
            ]
          },
          { q: 'A공공기관이 BSC를 도입하여 성과를 관리하려 한다. "민원 처리 만족도 90% 달성"은 어느 관점의 목표인가?',
            correct: '고객 관점 — 공공기관에서 시민·민원인이 고객에 해당하며, 만족도는 고객 관점의 대표 지표이다.',
            wrongs: [
              '내부 프로세스 관점 — 민원 처리는 내부 업무 프로세스이므로 이 관점에 해당한다.',
              '학습과 성장 관점 — 만족도 향상은 직원의 역량 성장을 통해 달성되므로 이 관점이다.',
              '재무 관점 — 민원 만족도가 높아지면 예산 절감 효과가 있으므로 재무 관점이다.'
            ]
          },
          { q: 'PDCA 사이클의 Act 단계에서 수행하는 활동으로 가장 적절한 것은?',
            correct: 'Check 단계에서 발견된 문제의 근본 원인을 분석하고, 표준을 수정하거나 새로운 Plan을 수립한다.',
            wrongs: [
              '계획을 최초로 수립하고, 목표치와 일정을 설정한다.',
              '수립된 계획에 따라 시범 운영을 실시하고, 실행 데이터를 기록한다.',
              '실행 결과를 KPI 대비 측정하여 목표 달성률을 산출한다.'
            ]
          }
        ];
        const s = scenarios[Math.floor(Math.random() * scenarios.length)];
        const choices = [s.correct, ...s.wrongs];
        for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
        return {
          question: s.q, choices, answer: choices.indexOf(s.correct),
          keywords: ['BSC', '균형성과표', 'PDCA', '경영이해'],
          type: 'PSAT형', subArea: '경영이해', area: '조직이해능력', level: 'intermediate',
          explanation: `정답: ${s.correct}\nBSC 4대 관점(재무·고객·내부프로세스·학습성장)과 PDCA(Plan-Do-Check-Act) 각 단계의 활동을 정확히 구분하세요.`
        };
      }},

      // ── 조직이해능력 ③ (advanced) 노사관계·국제감각 ──
      { area: '조직이해능력', areaCode: 'org', level: 'advanced', generator: () => {
        const scenarios = [
          { q: '헌법상 보장되는 노동3권에 해당하지 않는 것은?',
            correct: '노동 쟁의 조정 신청권',
            wrongs: [
              '단결권 — 노동자가 노동조합을 결성할 수 있는 권리',
              '단체교섭권 — 노동조합이 사용자와 근로 조건을 교섭할 수 있는 권리',
              '단체행동권 — 교섭 결렬 시 쟁의행위를 할 수 있는 권리'
            ]
          },
          { q: 'FTA(자유무역협정)의 효과에 대한 설명으로 옳지 않은 것은?',
            correct: '체결국 간 모든 상품의 관세가 즉시 완전 철폐되어 무관세 교역이 실현된다.',
            wrongs: [
              '체결국 간 관세 인하로 교역량이 증가하는 무역 창출 효과가 발생한다.',
              '비체결국에서 체결국으로 교역이 전환되는 무역 전환 효과가 나타날 수 있다.',
              '원산지 규정을 통해 체결국에서 생산된 상품에만 특혜 관세가 적용된다.'
            ]
          },
          { q: '다음 국제기구와 그 역할의 연결이 옳지 않은 것은?',
            correct: 'ILO(국제노동기구) — 국가 간 무역 분쟁을 중재하고 관세 협상을 주관한다.',
            wrongs: [
              'WTO(세계무역기구) — 다자간 무역 규범을 관리하고 무역 분쟁을 해결한다.',
              'IMF(국제통화기금) — 국제 통화 협력과 환율 안정을 촉진하며 금융 위기국을 지원한다.',
              'OECD(경제협력개발기구) — 회원국 간 경제 정책을 조율하고 경제 발전을 촉진한다.'
            ]
          },
          { q: '부당노동행위에 해당하지 않는 것은?',
            correct: '사용자가 근로자의 자발적 탈퇴 의사를 확인한 후 노조 탈퇴 절차를 안내한 것',
            wrongs: [
              '노동조합 가입을 이유로 근로자를 해고하거나 불이익을 주는 행위',
              '노동조합의 운영비를 사용자가 지원하여 조합의 자주성을 저해하는 행위',
              '정당한 단체교섭 요구를 정당한 사유 없이 거부하는 행위'
            ]
          },
          { q: '한-미 FTA 체결로 인해 국내 농업 부문에 예상되는 영향과 정부 대응으로 가장 적절한 것은?',
            correct: '수입 농산물과의 가격 경쟁 심화가 예상되므로, 피해 농가에 대한 보조금 지원 및 농업 경쟁력 강화 대책이 필요하다.',
            wrongs: [
              'FTA 체결 시 농업 부문은 예외 없이 관세가 철폐되므로, 국내 농업은 전면 포기하는 것이 합리적이다.',
              '관세 철폐로 국내 농산물 가격이 하락하면 수출이 증가하므로, 별도의 대응이 불필요하다.',
              'FTA는 공산품에만 적용되므로 농업 부문에는 직접적인 영향이 없다.'
            ]
          }
        ];
        const s = scenarios[Math.floor(Math.random() * scenarios.length)];
        const choices = [s.correct, ...s.wrongs];
        for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
        return {
          question: s.q, choices, answer: choices.indexOf(s.correct),
          keywords: ['노동3권', 'FTA', '국제기구', '노사관계', '국제감각'],
          type: 'PSAT형', subArea: '노사관계/국제감각', area: '조직이해능력', level: 'advanced',
          explanation: `정답: ${s.correct}\n노동3권(단결·단체교섭·단체행동)과 FTA·국제기구 역할을 정확히 구분해야 합니다.`
        };
      }},

      // ── 대인관계능력 ① (beginner) 의사소통 유형 구분 ──
      { area: '대인관계능력', areaCode: 'inter', level: 'beginner', generator: () => {
        const scenarios = [
          { q: '직장에서의 의사소통 유형 중 "주장적(Assertive) 의사소통"에 해당하는 것은?',
            correct: '"이 일정은 제 업무량을 고려하면 어렵습니다. 대안으로 이 방법을 제안드립니다."',
            wrongs: [
              '"그건 불가능합니다. 당신이 알아서 하세요."',
              '"네, 알겠습니다..." (내심 불만이지만 표현하지 않음)',
              '"그 일은 제가 하는 것보다 다른 분이 하는 게 나을 것 같은데... 아무튼 괜찮습니다."'
            ]
          },
          { q: '수동적(Passive) 의사소통 유형의 특징으로 가장 적절한 것은?',
            correct: '자신의 의견이나 감정을 표현하지 않고, 타인의 요구에 순응하며 내적 불만을 축적한다.',
            wrongs: [
              '자신의 의견을 강하게 표현하며, 상대방의 감정이나 입장을 고려하지 않는다.',
              '자신의 권리와 타인의 권리를 동등하게 존중하며 명확하게 의사를 전달한다.',
              '표면적으로는 동의하면서 뒤에서 불만을 간접적으로 표출한다.'
            ]
          },
          { q: '팀 회의에서 동료가 본인의 아이디어를 가로채 발표했다. 다음 중 주장적(Assertive) 대응은?',
            correct: '"그 아이디어는 제가 앞서 제안한 것인데, 함께 공동 제안으로 발전시키면 어떨까요?"',
            wrongs: [
              '"제 아이디어를 훔치다니 정말 비열하군요." (공격적)',
              '아무 말도 하지 않고 속으로만 불쾌해 한다. (수동적)',
              '"괜찮아요, 그냥 넘어가죠." (내심 이후 비협조로 보복할 생각)'
            ]
          },
          { q: '공격적(Aggressive) 의사소통의 장기적 결과로 가장 적절한 것은?',
            correct: '단기적으로 목표를 달성할 수 있으나, 신뢰 저하와 관계 손상으로 협력이 어려워진다.',
            wrongs: [
              '명확한 의사 표현으로 오해가 줄어들어 업무 효율성이 높아진다.',
              '상대방이 자신의 의견을 존중하게 되어 장기적으로 좋은 관계가 형성된다.',
              '갈등을 즉시 해소하여 조직 분위기가 개선되고 팀워크가 강화된다.'
            ]
          },
          { q: '다음 중 수동-공격적(Passive-Aggressive) 의사소통에 해당하는 것은?',
            correct: '회의에서 "네, 좋습니다"라고 동의한 뒤, 의도적으로 기한을 지키지 않거나 업무 질을 낮춘다.',
            wrongs: [
              '회의에서 반대 의견을 명확히 밝히고, 대안을 제시한다.',
              '회의에서 "절대 안 됩니다"라며 강하게 거부하고 상대를 비난한다.',
              '회의에서 아무 말도 하지 않고, 이후에도 시키는 대로 성실히 수행한다.'
            ]
          }
        ];
        const s = scenarios[Math.floor(Math.random() * scenarios.length)];
        const choices = [s.correct, ...s.wrongs];
        for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
        return {
          question: s.q, choices, answer: choices.indexOf(s.correct),
          keywords: ['의사소통유형', '주장적', '수동적', '공격적'],
          type: '피듈형', subArea: '의사소통', area: '대인관계능력', level: 'beginner',
          explanation: `정답: ${s.correct}\n수동적(자기 억제)·공격적(타인 무시)·주장적(상호 존중) 의사소통의 특징과 결과를 구분하세요.`
        };
      }},

      // ── 대인관계능력 ② (intermediate) 고객서비스능력 ──
      { area: '대인관계능력', areaCode: 'inter', level: 'intermediate', generator: () => {
        const scenarios = [
          { q: '고객이 제품 불량으로 강하게 항의하고 있다. 초기 대응으로 가장 적절한 것은?',
            correct: '고객의 말을 경청하고 불편에 대해 공감을 표현한 뒤, 구체적인 해결 방안을 안내한다.',
            wrongs: [
              '고객의 감정이 진정될 때까지 기다린 후, 규정상 환불이 불가함을 설명한다.',
              '즉시 상위 관리자에게 이관하여 본인은 관여하지 않는다.',
              '제품 불량의 원인이 고객의 사용법에 있을 수 있음을 먼저 확인한다.'
            ]
          },
          { q: '고객 불만 처리 절차(LAST 기법)의 순서로 올바른 것은?',
            correct: 'Listen(경청) → Apologize(사과) → Solve(해결) → Thank(감사)',
            wrongs: [
              'Apologize(사과) → Listen(경청) → Solve(해결) → Thank(감사)',
              'Listen(경청) → Solve(해결) → Apologize(사과) → Thank(감사)',
              'Thank(감사) → Listen(경청) → Apologize(사과) → Solve(해결)'
            ]
          },
          { q: '전화 응대 시 고객이 담당자 부재 중에 전화한 경우, 가장 적절한 대응은?',
            correct: '고객의 용건과 연락처를 정확히 기록하고, 담당자가 복귀하는 즉시 회신할 것을 약속한다.',
            wrongs: [
              '"담당자가 자리에 없습니다. 나중에 다시 전화해 주세요."라고 안내한다.',
              '담당자 개인 휴대폰 번호를 알려주어 직접 연락하도록 한다.',
              '고객의 요청을 직접 처리하겠다고 약속한 뒤, 담당자에게 알리지 않는다.'
            ]
          },
          { q: '서비스 회복 역설(Service Recovery Paradox)에 대한 설명으로 가장 적절한 것은?',
            correct: '서비스 실패 후 효과적으로 복구하면, 실패가 없었을 때보다 고객 만족도가 더 높아질 수 있다.',
            wrongs: [
              '서비스 실패를 경험한 고객은 어떤 보상을 해도 원래 만족 수준으로 돌아갈 수 없다.',
              '서비스 품질이 높을수록 고객의 기대치도 높아져 불만이 증가하는 현상이다.',
              '고객 불만을 제기하지 않는 침묵 고객이 오히려 재구매율이 높은 현상이다.'
            ]
          },
          { q: '고객이 환불 규정에 해당하지 않는 건으로 환불을 강하게 요구한다. 가장 적절한 대응은?',
            correct: '고객의 입장에 공감을 표현하되, 규정을 명확히 안내하고 교환·수리 등 가능한 대안을 제시한다.',
            wrongs: [
              '규정에 해당하지 않으므로 불가하다고 단호하게 거절한다.',
              '민원 확대를 방지하기 위해 규정을 무시하고 즉시 환불 처리한다.',
              '고객에게 소비자보호원에 직접 문의하라고 안내하고 대응을 종료한다.'
            ]
          }
        ];
        const s = scenarios[Math.floor(Math.random() * scenarios.length)];
        const choices = [s.correct, ...s.wrongs];
        for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
        return {
          question: s.q, choices, answer: choices.indexOf(s.correct),
          keywords: ['고객서비스', '불만처리', 'LAST기법', '서비스회복'],
          type: '피듈형', subArea: '고객서비스', area: '대인관계능력', level: 'intermediate',
          explanation: `정답: ${s.correct}\n고객 불만 처리의 핵심은 경청·공감 후 해결이며, 규정 안내와 대안 제시의 균형이 중요합니다.`
        };
      }},

      // ── 대인관계능력 ③ (advanced) 멘토링·코칭 리더십 ──
      { area: '대인관계능력', areaCode: 'inter', level: 'advanced', generator: () => {
        const scenarios = [
          { q: '멘토링(Mentoring)과 코칭(Coaching)의 차이에 대한 설명으로 가장 적절한 것은?',
            correct: '멘토링은 경험이 풍부한 선배가 장기적 경력 개발을 지원하고, 코칭은 특정 업무 성과 향상을 위해 단기 목표 중심으로 진행된다.',
            wrongs: [
              '멘토링은 상사가 업무 지시를 통해 직접 가르치고, 코칭은 외부 전문가가 심리 상담을 제공하는 것이다.',
              '멘토링은 단기 프로젝트 성과 향상에 초점을 맞추고, 코칭은 장기적 경력 비전을 설계하는 것이다.',
              '멘토링과 코칭은 동일한 개념이며, 조직에 따라 용어만 다르게 사용한다.'
            ]
          },
          { q: '코칭 대화에서 GROW 모델의 단계별 질문으로 옳지 않은 것은?',
            correct: 'Reality(현실 파악) — "이번 분기 목표를 달성하지 못하면 어떤 징계를 받게 되나요?"',
            wrongs: [
              'Goal(목표 설정) — "이번 프로젝트에서 가장 달성하고 싶은 것은 무엇인가요?"',
              'Options(대안 탐색) — "목표 달성을 위해 시도해 볼 수 있는 방법에는 어떤 것들이 있나요?"',
              'Will(실행 의지) — "첫 번째 단계를 언제까지 실행할 수 있나요?"'
            ]
          },
          { q: '신입사원에 대한 멘토링 효과로 가장 적절하지 않은 것은?',
            correct: '멘토의 업무 방식을 그대로 답습하게 되어 독립적 사고력이 약화된다.',
            wrongs: [
              '조직 문화와 암묵적 규범을 빠르게 습득할 수 있다.',
              '업무상 어려움을 상담할 수 있는 심리적 안전망이 형성된다.',
              '멘토의 네트워크를 활용하여 조직 내 관계를 확장할 수 있다.'
            ]
          },
          { q: '상황대응 리더십(Situational Leadership)에서, 능력은 높지만 의지가 낮은 구성원에게 적합한 리더십 스타일은?',
            correct: '참여형(Participating) — 의사결정에 참여시켜 동기를 부여하고, 지시보다는 지원에 초점을 둔다.',
            wrongs: [
              '지시형(Telling) — 구체적 업무 지시와 밀착 감독을 통해 성과를 관리한다.',
              '위임형(Delegating) — 자율성을 최대한 부여하여 스스로 업무를 수행하게 한다.',
              '설득형(Selling) — 업무 방법을 상세히 설명하고 질의응답을 통해 이해를 돕는다.'
            ]
          },
          { q: '효과적인 피드백의 원칙으로 가장 적절하지 않은 것은?',
            correct: '피드백은 가능한 한 시간이 지난 후 여러 건을 모아서 한꺼번에 제공하는 것이 효과적이다.',
            wrongs: [
              '구체적인 행동과 결과에 초점을 맞추어 피드백한다.',
              '개인의 성격이 아닌 관찰 가능한 행동을 기반으로 피드백한다.',
              '긍정적 피드백과 개선 피드백을 균형 있게 제공한다.'
            ]
          }
        ];
        const s = scenarios[Math.floor(Math.random() * scenarios.length)];
        const choices = [s.correct, ...s.wrongs];
        for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
        return {
          question: s.q, choices, answer: choices.indexOf(s.correct),
          keywords: ['멘토링', '코칭', 'GROW모델', '상황대응리더십', '피드백'],
          type: 'PSAT형', subArea: '리더십', area: '대인관계능력', level: 'advanced',
          explanation: `정답: ${s.correct}\n멘토링(장기·경력)과 코칭(단기·성과)의 차이, GROW 모델, 상황대응 리더십 유형을 정확히 구분하세요.`
        };
      }},

      // ── 기술능력 ① (beginner) 기술수명주기 4단계 ──
      { area: '기술능력', areaCode: 'tech', level: 'beginner', generator: () => {
        const scenarios = [
          { q: '기술수명주기(Technology Life Cycle)의 4단계를 순서대로 나열한 것은?',
            correct: '도입기 → 성장기 → 성숙기 → 쇠퇴기',
            wrongs: [
              '성장기 → 도입기 → 성숙기 → 쇠퇴기',
              '도입기 → 성숙기 → 성장기 → 쇠퇴기',
              '도입기 → 성장기 → 쇠퇴기 → 성숙기'
            ]
          },
          { q: '기술수명주기에서 성장기(Growth Stage)의 특징으로 가장 적절한 것은?',
            correct: '기술의 성능이 급격히 향상되고, 시장 수요가 빠르게 증가하며, 경쟁 기업의 진입이 활발해진다.',
            wrongs: [
              '기술이 처음 개발되어 성능이 불안정하고, 시장 인지도가 낮으며, R&D 비용이 집중된다.',
              '기술이 표준화되고, 시장이 포화 상태에 이르며, 가격 경쟁이 심화된다.',
              '대체 기술이 등장하고, 기존 기술의 수요가 감소하며, 시장에서 점차 퇴출된다.'
            ]
          },
          { q: '현재 DVD 플레이어는 기술수명주기상 어느 단계에 해당하는가?',
            correct: '쇠퇴기 — 스트리밍 서비스 등 대체 기술의 등장으로 수요가 급격히 감소하고 있다.',
            wrongs: [
              '성숙기 — 기술이 안정화되어 여전히 주류 시장에서 활용되고 있다.',
              '성장기 — 고화질 DVD 기술의 발전으로 시장이 확대되고 있다.',
              '도입기 — 새로운 DVD 규격이 출시되어 시장 테스트 중이다.'
            ]
          },
          { q: '도입기(Introduction Stage)에 있는 기술에 대한 기업의 전략으로 가장 적절한 것은?',
            correct: '기술의 가능성을 검증하기 위한 파일럿 프로젝트를 운영하고, 선도적 투자로 시장 선점을 노린다.',
            wrongs: [
              '대량 생산 체계를 구축하여 원가를 절감하고 시장 점유율을 확대한다.',
              '기술 라이선싱을 통해 수익을 극대화하고 신규 투자를 중단한다.',
              '가격 인하 전략으로 경쟁사를 압도하고 시장 독점을 추구한다.'
            ]
          },
          { q: '성숙기(Maturity Stage)에서 기업이 취할 수 있는 전략으로 가장 적절한 것은?',
            correct: '공정 개선을 통한 원가 절감과 차별화된 부가 서비스 제공으로 경쟁 우위를 유지한다.',
            wrongs: [
              '대규모 R&D 투자를 통해 기술의 기본 성능을 획기적으로 향상시킨다.',
              '시장 진입을 위한 공격적 마케팅으로 인지도를 높인다.',
              '기술을 즉시 폐기하고 차세대 기술로 전환한다.'
            ]
          }
        ];
        const s = scenarios[Math.floor(Math.random() * scenarios.length)];
        const choices = [s.correct, ...s.wrongs];
        for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
        return {
          question: s.q, choices, answer: choices.indexOf(s.correct),
          keywords: ['기술수명주기', '도입기', '성장기', '성숙기', '쇠퇴기'],
          type: 'PSAT형', subArea: '기술이해', area: '기술능력', level: 'beginner',
          explanation: `정답: ${s.correct}\n도입기(R&D·파일럿) → 성장기(급성장·경쟁진입) → 성숙기(표준화·원가절감) → 쇠퇴기(대체기술·퇴출) 각 단계의 특징을 구분하세요.`
        };
      }},

      // ── 기술능력 ② (intermediate) 매뉴얼 해독·기술 문서 이해 ──
      { area: '기술능력', areaCode: 'tech', level: 'intermediate', generator: () => {
        const scenarios = [
          { q: '장비 매뉴얼에 "정격 전압: AC 220V ±10%, 정격 주파수: 60Hz"라고 표기되어 있다. 이에 대한 해석으로 옳은 것은?',
            correct: '198V~242V 범위의 교류 전원에서 정상 작동하며, 60Hz 주파수 환경에서 사용해야 한다.',
            wrongs: [
              '정확히 220V에서만 작동하며, 전압 변동 시 즉시 고장이 발생한다.',
              '직류(DC) 220V 전원에 연결해야 하며, 50Hz와 60Hz 모두 호환된다.',
              '최대 220V까지 사용 가능하며, 그 이상은 과부하로 차단된다.'
            ]
          },
          { q: '기술 사양서에 "IP65 등급"이라고 표기된 장비의 방진·방수 성능으로 옳은 것은?',
            correct: '분진이 내부에 침입하지 않으며(6등급), 사방에서의 물줄기에 대해 보호된다(5등급).',
            wrongs: [
              '가벼운 먼지는 침입할 수 있으며, 물에 완전히 잠겨도 보호된다.',
              '모든 분진과 수중 1m 이상 침수에도 완벽히 보호된다.',
              '일반 먼지 환경에서만 사용 가능하며, 물 접촉은 완전히 불가하다.'
            ]
          },
          { q: '제조업체 매뉴얼에 "예방정비(PM) 주기: 500시간 또는 3개월 중 빠른 시점"이라고 되어 있다. 장비 가동 2개월 경과, 누적 가동 시간 520시간인 경우 적절한 조치는?',
            correct: '이미 누적 가동 500시간을 초과했으므로, 즉시 예방정비를 실시해야 한다.',
            wrongs: [
              '3개월이 되지 않았으므로, 1개월 후에 정비를 실시한다.',
              '500시간을 약간 초과했으나 허용 오차 범위이므로, 600시간에 정비한다.',
              '가동 시간과 경과 기간 중 늦은 시점인 3개월에 정비하면 된다.'
            ]
          },
          { q: '안전보건표지에서 노란색 바탕에 검정색 느낌표(!)가 그려진 삼각형 표지의 의미는?',
            correct: '경고 표지 — 위험 요소가 존재하므로 주의가 필요함을 알린다.',
            wrongs: [
              '금지 표지 — 해당 행위를 절대로 해서는 안 됨을 의미한다.',
              '지시 표지 — 반드시 특정 행동을 해야 함을 나타낸다.',
              '안내 표지 — 비상구나 응급처치 시설의 위치를 안내한다.'
            ]
          },
          { q: '기술 문서에서 "MTBF(Mean Time Between Failures): 10,000시간"의 의미로 가장 적절한 것은?',
            correct: '장비의 평균 고장 간격이 10,000시간으로, 수리 후 다음 고장까지 평균 10,000시간 가동이 기대된다.',
            wrongs: [
              '장비의 총 수명이 10,000시간이며, 이후에는 반드시 교체해야 한다.',
              '10,000시간 이내에 반드시 1회 고장이 발생한다는 의미이다.',
              '장비가 고장 난 후 수리까지 평균 10,000시간이 소요된다는 의미이다.'
            ]
          }
        ];
        const s = scenarios[Math.floor(Math.random() * scenarios.length)];
        const choices = [s.correct, ...s.wrongs];
        for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
        return {
          question: s.q, choices, answer: choices.indexOf(s.correct),
          keywords: ['매뉴얼해독', '기술사양', 'IP등급', 'MTBF', '기술문서'],
          type: '모듈형', subArea: '기술적용', area: '기술능력', level: 'intermediate',
          explanation: `정답: ${s.correct}\n기술 문서의 규격·수치·기호를 정확히 해석하는 능력이 중요합니다.`
        };
      }},

      // ── 기술능력 ③ (advanced) 디지털 전환(DX) 전략 및 ROI 분석 ──
      { area: '기술능력', areaCode: 'tech', level: 'advanced', generator: () => {
        const scenarios = [
          { q: '디지털 전환(DX)에 대한 설명으로 가장 적절한 것은?',
            correct: '디지털 기술을 활용하여 비즈니스 모델·프로세스·조직 문화를 근본적으로 변혁하는 것이다.',
            wrongs: [
              '기존 아날로그 문서를 디지털 파일로 변환(Digitization)하는 것과 동일한 개념이다.',
              'IT 부서가 주도하여 사내 시스템을 최신 버전으로 업그레이드하는 것이다.',
              '오프라인 매장을 폐쇄하고 온라인 쇼핑몰로 전환하는 것만을 의미한다.'
            ]
          },
          { q: 'DX 프로젝트의 ROI(투자수익률)를 산정할 때, 다음 중 무형적 편익(Intangible Benefit)에 해당하는 것은?',
            correct: '직원 업무 만족도 향상 및 고객 경험 개선으로 인한 브랜드 가치 상승',
            wrongs: [
              '자동화로 인한 인건비 절감액 연간 3억원',
              '종이 사용량 감소로 인한 소모품 비용 절감액 월 500만원',
              '시스템 오류 감소로 인한 재작업 비용 절감액 분기 1억원'
            ]
          },
          { q: 'A기업이 RPA(로봇프로세스자동화)를 도입하여 월 100시간의 반복 업무를 자동화했다. 직원 시간당 비용이 3만원이고, RPA 월 운영비가 50만원일 때, 월 순편익은?',
            correct: '250만원 (절감액 300만원 - 운영비 50만원)',
            wrongs: [
              '300만원 (절감액만 계산, 운영비 미차감)',
              '50만원 (운영비만 절감액으로 계산)',
              '350만원 (절감액에 운영비를 추가로 합산)'
            ]
          },
          { q: '디지털 전환 성숙도 모델에서 가장 높은 단계의 특징으로 적절한 것은?',
            correct: '데이터 기반 의사결정이 조직 전반에 내재화되고, 신기술을 활용한 비즈니스 모델 혁신이 지속적으로 이루어진다.',
            wrongs: [
              '일부 부서에서 파일럿 프로젝트를 통해 디지털 도구를 시범 적용하고 있다.',
              '전사적 ERP 시스템이 도입되어 업무 프로세스가 표준화되었다.',
              'IT 인프라가 클라우드로 전환되어 시스템 운영 효율성이 향상되었다.'
            ]
          },
          { q: 'DX 추진 시 가장 큰 실패 요인으로 자주 지적되는 것은?',
            correct: '기술 도입 자체에만 집중하고, 조직 문화·변화 관리·리더십 전환에 실패하는 것',
            wrongs: [
              '최신 기술이 아닌 검증된 기술을 선택하여 혁신성이 부족한 것',
              '외부 컨설팅 없이 내부 역량만으로 추진하여 전문성이 부족한 것',
              'DX 전담 조직을 별도로 신설하여 기존 조직과의 괴리가 발생하는 것'
            ]
          }
        ];
        const s = scenarios[Math.floor(Math.random() * scenarios.length)];
        const choices = [s.correct, ...s.wrongs];
        for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
        return {
          question: s.q, choices, answer: choices.indexOf(s.correct),
          keywords: ['디지털전환', 'DX', 'ROI', 'RPA', '성숙도모델'],
          type: 'PSAT형', subArea: '기술경영', area: '기술능력', level: 'advanced',
          explanation: `정답: ${s.correct}\nDX는 단순 IT 도입이 아닌 비즈니스 모델·문화의 근본적 변혁이며, ROI 산정 시 유·무형 편익을 모두 고려해야 합니다.`
        };
      }},

      // ── 자기개발능력 ① (beginner) Holland RIASEC 직업적성 ──
      { area: '자기개발능력', areaCode: 'self', level: 'beginner', generator: () => {
        const scenarios = [
          { q: 'Holland의 직업적성 유형(RIASEC) 중 "탐구형(Investigative)"에 가장 적합한 직업군은?',
            correct: '연구원, 데이터 분석가, 의사 — 분석적·논리적 사고와 지적 탐구를 선호한다.',
            wrongs: [
              '회계사, 행정관, 은행원 — 체계적·반복적 업무와 정확성을 중시한다.',
              '영업사원, 교사, 상담사 — 대인 관계와 타인 돕기를 선호한다.',
              '엔지니어, 농부, 정비사 — 도구와 기계를 활용한 실체적 업무를 선호한다.'
            ]
          },
          { q: 'Holland 유형 중 "관습형(Conventional)"의 특성으로 가장 적절한 것은?',
            correct: '질서, 규칙, 정확성을 중시하며 자료 정리·수치 관리 등 체계적 업무를 선호한다.',
            wrongs: [
              '창의성과 자유로운 표현을 중시하며 비구조화된 환경을 선호한다.',
              '모험심이 강하고 신체적 활동이 요구되는 야외 업무를 선호한다.',
              '리더십과 설득력을 발휘하여 조직을 이끌고 목표를 달성하는 것을 선호한다.'
            ]
          },
          { q: 'Holland의 육각형 모형에서 서로 인접한 유형끼리는 유사성이 높다. "예술형(Artistic)"과 가장 인접한 두 유형은?',
            correct: '탐구형(Investigative)과 사회형(Social)',
            wrongs: [
              '실재형(Realistic)과 관습형(Conventional)',
              '진취형(Enterprising)과 실재형(Realistic)',
              '관습형(Conventional)과 탐구형(Investigative)'
            ]
          },
          { q: '다음 중 "진취형(Enterprising)" 유형의 사람에게 적합한 업무 환경은?',
            correct: '목표 달성 위주의 경쟁적 환경에서 팀을 이끌고 의사결정을 내리는 역할',
            wrongs: [
              '정해진 매뉴얼에 따라 정확하게 데이터를 입력하고 문서를 관리하는 역할',
              '혼자 집중하여 실험 설계와 데이터 분석을 수행하는 연구 환경',
              '자유로운 분위기에서 작품을 창작하고 감성적 표현을 하는 환경'
            ]
          },
          { q: '신입사원이 RIASEC 검사 결과 "사회형(S)-진취형(E)-관습형(C)" 조합이 나왔다. 이 사람에게 가장 적합한 직무는?',
            correct: '인사·교육 담당 — 사람을 돕고(S), 프로젝트를 기획·추진하며(E), 체계적으로 관리한다(C).',
            wrongs: [
              '연구개발 엔지니어 — 기술 탐구(I)와 정밀 작업(R)이 핵심인 직무이다.',
              '디자이너 — 창의적 표현(A)이 핵심이며 자유로운 환경이 필요하다.',
              '현장 기술자 — 도구 활용(R)과 반복적 현장 작업이 주된 업무이다.'
            ]
          }
        ];
        const s = scenarios[Math.floor(Math.random() * scenarios.length)];
        const choices = [s.correct, ...s.wrongs];
        for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
        return {
          question: s.q, choices, answer: choices.indexOf(s.correct),
          keywords: ['Holland', 'RIASEC', '직업적성', '자기이해'],
          type: '피듈형', subArea: '자기이해', area: '자기개발능력', level: 'beginner',
          explanation: `정답: ${s.correct}\nRIASEC 6유형: 실재형(R)·탐구형(I)·예술형(A)·사회형(S)·진취형(E)·관습형(C) 각 특성과 적합 직업을 구분하세요.`
        };
      }},

      // ── 자기개발능력 ② (intermediate) 학습전략·자기주도학습 ──
      { area: '자기개발능력', areaCode: 'self', level: 'intermediate', generator: () => {
        const scenarios = [
          { q: '자기주도학습(Self-Directed Learning)의 핵심 특징으로 가장 적절한 것은?',
            correct: '학습자가 스스로 학습 목표를 설정하고, 학습 전략을 선택하며, 학습 결과를 평가하는 과정이다.',
            wrongs: [
              '교수자의 지도 없이 교재만으로 독학하는 것을 의미한다.',
              '학습자가 원하는 시간에 원하는 장소에서 학습하는 이러닝(e-Learning)과 동일한 개념이다.',
              '외부 동기(시험, 승진)에 의해 학습이 촉발되는 것이 핵심 특징이다.'
            ]
          },
          { q: '콜브(Kolb)의 경험학습 이론에서 학습 사이클의 올바른 순서는?',
            correct: '구체적 경험 → 성찰적 관찰 → 추상적 개념화 → 능동적 실험',
            wrongs: [
              '추상적 개념화 → 구체적 경험 → 능동적 실험 → 성찰적 관찰',
              '구체적 경험 → 능동적 실험 → 성찰적 관찰 → 추상적 개념화',
              '성찰적 관찰 → 구체적 경험 → 추상적 개념화 → 능동적 실험'
            ]
          },
          { q: '학습 전략 중 "정교화 전략(Elaboration Strategy)"에 해당하는 것은?',
            correct: '새로운 내용을 기존 지식과 연결하여 의미를 부여하고, 예시나 비유를 활용하여 이해를 심화한다.',
            wrongs: [
              '핵심 키워드에 밑줄을 긋고, 중요 내용을 반복적으로 읽어 암기한다.',
              '학습 내용을 표·그래프·개념도 등으로 시각화하여 구조를 파악한다.',
              '학습 시간과 장소를 정하고, 방해 요소를 제거하여 집중력을 유지한다.'
            ]
          },
          { q: '70-20-10 학습 모델에서 가장 큰 비중(70%)을 차지하는 학습 방식은?',
            correct: '실무 경험을 통한 학습(On-the-Job Learning) — 실제 업무 수행, 과제 해결, 프로젝트 참여 등',
            wrongs: [
              '공식적 교육(Formal Learning) — 강의, 세미나, 이러닝, 자격증 과정 등',
              '타인과의 상호작용(Social Learning) — 멘토링, 코칭, 동료 피드백 등',
              '자기 성찰(Reflective Learning) — 학습 일지 작성, 경험 되돌아보기 등'
            ]
          },
          { q: '학습 전이(Transfer of Learning)를 높이기 위한 방법으로 가장 적절하지 않은 것은?',
            correct: '학습 내용과 실무 적용 상황의 유사성을 최소화하여 창의적 응용력을 기른다.',
            wrongs: [
              '학습 직후 실무에 적용할 수 있는 실행 계획(Action Plan)을 수립한다.',
              '상사가 학습 내용의 실무 적용을 지원하고 피드백을 제공한다.',
              '실제 업무 사례를 활용하여 학습하고, 현업 적용 과제를 부여한다.'
            ]
          }
        ];
        const s = scenarios[Math.floor(Math.random() * scenarios.length)];
        const choices = [s.correct, ...s.wrongs];
        for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
        return {
          question: s.q, choices, answer: choices.indexOf(s.correct),
          keywords: ['자기주도학습', '콜브', '경험학습', '70-20-10', '학습전략'],
          type: 'PSAT형', subArea: '학습전략', area: '자기개발능력', level: 'intermediate',
          explanation: `정답: ${s.correct}\n자기주도학습의 핵심은 학습자의 주도성이며, 경험학습·학습전이·정교화전략 등 학습 이론의 핵심 개념을 구분하세요.`
        };
      }},

      // ── 자기개발능력 ③ (advanced) 경력개발 CDP 설계·역량 갭 분석 ──
      { area: '자기개발능력', areaCode: 'self', level: 'advanced', generator: () => {
        const scenarios = [
          { q: 'CDP(경력개발프로그램)의 구성 요소로 가장 적절하지 않은 것은?',
            correct: '조직의 인건비 예산 편성 및 급여 체계 설계',
            wrongs: [
              '개인의 적성·흥미·가치관에 기반한 경력 목표 설정',
              '현재 역량 수준과 목표 역량 간의 갭(Gap) 분석',
              '경력 경로(Career Path) 설계 및 직무 순환(Job Rotation) 계획'
            ]
          },
          { q: '역량 갭 분석(Competency Gap Analysis)의 절차로 올바른 순서는?',
            correct: '목표 역량 정의 → 현재 역량 진단 → 갭 분석 → 개발 계획 수립 → 실행 및 평가',
            wrongs: [
              '현재 역량 진단 → 개발 계획 수립 → 목표 역량 정의 → 갭 분석 → 실행 및 평가',
              '갭 분석 → 목표 역량 정의 → 현재 역량 진단 → 실행 및 평가 → 개발 계획 수립',
              '목표 역량 정의 → 갭 분석 → 현재 역량 진단 → 실행 및 평가 → 개발 계획 수립'
            ]
          },
          { q: '직원 A의 "데이터 분석" 역량이 현재 수준 2(기초)이고 목표 수준이 4(심화)일 때, 가장 적절한 개발 방법은?',
            correct: '단계적으로 중급 과정 이수 → 실무 프로젝트 참여 → 심화 과정 이수의 경로를 설계한다.',
            wrongs: [
              '즉시 심화(레벨 4) 과정을 수강하여 최단 시간 내 목표에 도달한다.',
              '현재 수준이 낮으므로 데이터 분석 역량 개발을 포기하고 다른 역량에 집중한다.',
              '기초 과정을 반복 수강하여 기본기를 완벽히 다진 후 실무에 투입한다.'
            ]
          },
          { q: '경력 정체(Career Plateau) 상태에 있는 중간관리자에게 가장 적절한 경력개발 전략은?',
            correct: '직무 확대(Job Enlargement)나 직무 충실화(Job Enrichment)를 통해 현 직무에서 새로운 도전과 성장을 경험하게 한다.',
            wrongs: [
              '승진 가능성이 없으므로 조기 퇴직을 권유하고 전직 지원 프로그램을 제공한다.',
              '현재 직무를 계속 수행하되, 성과 목표를 낮추어 심리적 부담을 줄인다.',
              '다른 부서로 강제 전보하여 새로운 환경에서 재출발하도록 한다.'
            ]
          },
          { q: 'IDP(개인개발계획)를 수립할 때 SMART 원칙에 맞는 목표 설정은?',
            correct: '"6개월 내 PMP 자격증을 취득하여 프로젝트 관리 역량을 중급(Level 3)에서 고급(Level 4)으로 향상시킨다."',
            wrongs: [
              '"올해 안에 역량을 전반적으로 향상시킨다."',
              '"가능하면 프로젝트 관리 관련 교육을 수강한다."',
              '"리더십 역량을 최고 수준으로 끌어올린다."'
            ]
          }
        ];
        const s = scenarios[Math.floor(Math.random() * scenarios.length)];
        const choices = [s.correct, ...s.wrongs];
        for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
        return {
          question: s.q, choices, answer: choices.indexOf(s.correct),
          keywords: ['CDP', '경력개발', '역량갭분석', 'IDP', 'SMART'],
          type: 'PSAT형', subArea: '경력개발', area: '자기개발능력', level: 'advanced',
          explanation: `정답: ${s.correct}\nCDP는 개인 경력 목표와 조직 니즈를 연계하며, 역량 갭 분석→개발 계획→실행의 체계적 절차가 핵심입니다.`
        };
      }},

      // ── 직업윤리 ① (beginner) 직업관(소명의식·봉사정신·장인정신) ──
      { area: '직업윤리', areaCode: 'ethics', level: 'beginner', generator: () => {
        const scenarios = [
          { q: '직업윤리에서 "소명의식(Calling)"에 대한 설명으로 가장 적절한 것은?',
            correct: '자신의 직업을 단순한 생계 수단이 아닌, 사회적 사명과 가치 실현의 수단으로 인식하는 태도이다.',
            wrongs: [
              '직업에 대한 전문 기술을 최고 수준으로 연마하여 완벽한 결과물을 추구하는 태도이다.',
              '자신의 이익보다 고객과 사회의 이익을 우선시하여 무상으로 봉사하는 태도이다.',
              '조직의 목표 달성을 위해 개인의 가치관과 신념을 양보하는 태도이다.'
            ]
          },
          { q: '"장인정신(Craftsmanship)"이 가장 잘 드러나는 사례는?',
            correct: '30년간 한 분야에 종사하며 기술을 연마하고, 작은 부분도 타협하지 않는 품질 기준을 유지하는 목수',
            wrongs: [
              '빠른 승진을 위해 다양한 부서를 경험하며 폭넓은 인맥을 구축하는 직장인',
              '업무 외 시간에 지역사회 봉사활동에 적극 참여하는 공무원',
              '조직의 비전에 공감하여 초과 근무도 마다하지 않는 신입사원'
            ]
          },
          { q: '직업윤리의 덕목 중 "봉사정신"에 대한 설명으로 가장 적절한 것은?',
            correct: '자신의 직업 활동이 타인과 사회에 기여한다는 인식을 바탕으로, 고객·시민에게 성실히 봉사하는 태도이다.',
            wrongs: [
              '무보수로 사회적 약자를 돕는 자원봉사에 참여하는 것만을 의미한다.',
              '개인의 성과보다 조직의 이익을 우선시하여 자기희생을 감수하는 태도이다.',
              '업무 시간 외에 별도로 사회 공헌 활동을 수행하는 것을 의미한다.'
            ]
          },
          { q: '다음 중 직업윤리의 기본 덕목에 해당하지 않는 것은?',
            correct: '이윤극대화 — 어떤 수단을 사용하더라도 최대 수익을 달성하려는 태도',
            wrongs: [
              '성실성 — 맡은 업무에 최선을 다하고 책임감 있게 수행하는 태도',
              '정직성 — 업무 수행 과정에서 거짓 없이 투명하게 행동하는 태도',
              '공정성 — 이해관계에 치우치지 않고 공평하게 업무를 처리하는 태도'
            ]
          },
          { q: '한 공무원이 "내 직업은 시민을 위해 존재한다"는 신념으로 민원인을 대한다. 이 태도를 설명하는 직업윤리 개념의 조합으로 가장 적절한 것은?',
            correct: '소명의식 + 봉사정신 — 직업의 사회적 사명을 인식하고 시민 봉사를 실천하는 태도',
            wrongs: [
              '장인정신 + 전문성 — 업무 기술의 완벽한 연마를 통해 시민에게 최고의 서비스를 제공하는 태도',
              '근면성 + 책임감 — 열심히 일하고 결과에 책임지는 태도',
              '충성심 + 복종 — 조직의 명령에 따라 시민 봉사를 수행하는 태도'
            ]
          }
        ];
        const s = scenarios[Math.floor(Math.random() * scenarios.length)];
        const choices = [s.correct, ...s.wrongs];
        for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
        return {
          question: s.q, choices, answer: choices.indexOf(s.correct),
          keywords: ['소명의식', '봉사정신', '장인정신', '직업관'],
          type: '피듈형', subArea: '직업관', area: '직업윤리', level: 'beginner',
          explanation: `정답: ${s.correct}\n소명의식(사명감)·봉사정신(사회기여)·장인정신(기술연마·품질추구)의 핵심 차이를 구분하세요.`
        };
      }},

      // ── 직업윤리 ② (intermediate) 이해충돌방지법 적용 사례 ──
      { area: '직업윤리', areaCode: 'ethics', level: 'intermediate', generator: () => {
        const scenarios = [
          { q: '공직자의 이해충돌방지법상 "사적이해관계자 신고" 의무에 해당하는 사례는?',
            correct: '공무원 A가 담당하는 인허가 심사 대상 기업의 대표가 자신의 배우자인 경우, 이를 소속기관장에게 신고해야 한다.',
            wrongs: [
              '공무원 A의 대학 동기가 민원을 접수한 경우, 반드시 사적이해관계를 신고해야 한다.',
              '공무원 A가 담당 업무와 무관한 부서의 계약 상대방이 친인척인 경우에도 신고 대상이다.',
              '사적이해관계자 신고는 공무원 본인의 판단에 따라 선택적으로 할 수 있다.'
            ]
          },
          { q: '이해충돌방지법상 "직무 관련 외부활동 제한"에 해당하는 것은?',
            correct: '소속 기관이 감독하는 기관에 대가를 받고 자문·강의를 제공하는 행위',
            wrongs: [
              '퇴근 후 직무와 무관한 분야에서 개인 취미 활동을 하는 행위',
              '소속 기관의 허가를 받아 대학에서 비직무 관련 강의를 하는 행위',
              '공무원 노조 활동에 참여하여 근로 조건 개선을 요구하는 행위'
            ]
          },
          { q: '이해충돌방지법상 "퇴직자 사적 접촉 신고" 의무에 대한 설명으로 옳은 것은?',
            correct: '소관 직무와 관련된 퇴직자가 사적으로 접촉한 경우, 소속기관장에게 신고해야 한다.',
            wrongs: [
              '모든 퇴직자와의 사적 만남을 예외 없이 신고해야 한다.',
              '퇴직 후 3년이 경과한 퇴직자는 신고 대상에서 완전히 제외된다.',
              '퇴직자가 먼저 접촉한 경우에만 신고 의무가 발생한다.'
            ]
          },
          { q: '공무원 B가 자신의 직무와 관련된 부동산의 매입을 추진 중이다. 이해충돌방지법상 적절한 조치는?',
            correct: '직무 관련 부동산 거래 사실을 소속기관장에게 신고하고, 직무 회피 여부에 대한 지시를 받아야 한다.',
            wrongs: [
              '부동산 거래는 개인 재산권이므로 별도의 신고 없이 자유롭게 거래할 수 있다.',
              '거래 완료 후 30일 이내에 사후 신고하면 된다.',
              '직무와 관련된 부동산은 어떠한 경우에도 매입이 절대 금지된다.'
            ]
          },
          { q: '이해충돌방지법 위반 시 제재에 대한 설명으로 옳은 것은?',
            correct: '신고·제출 의무 위반 시 과태료가 부과되며, 직무상 비밀 이용 금지 위반 시에는 형사처벌이 가능하다.',
            wrongs: [
              '모든 위반 행위에 대해 형사처벌(징역 또는 벌금)만 부과된다.',
              '위반 시 과태료만 부과되며, 형사처벌 조항은 존재하지 않는다.',
              '법 위반이 확인되더라도 자진 신고하면 모든 제재가 면제된다.'
            ]
          }
        ];
        const s = scenarios[Math.floor(Math.random() * scenarios.length)];
        const choices = [s.correct, ...s.wrongs];
        for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
        return {
          question: s.q, choices, answer: choices.indexOf(s.correct),
          keywords: ['이해충돌방지법', '사적이해관계', '신고의무', '공직윤리'],
          type: '피듈형', subArea: '공직윤리', area: '직업윤리', level: 'intermediate',
          explanation: `정답: ${s.correct}\n이해충돌방지법의 핵심은 직무 관련 사적이해관계의 사전 신고와 직무 회피이며, 위반 유형에 따라 과태료·형사처벌이 구분됩니다.`
        };
      }},

      // ── 직업윤리 ③ (advanced) 복합 윤리 딜레마 상황 판단 ──
      { area: '직업윤리', areaCode: 'ethics', level: 'advanced', generator: () => {
        const scenarios = [
          { q: '공무원 C는 상급자로부터 특정 업체에 유리한 방향으로 입찰 규격을 조정하라는 지시를 받았다. 가장 적절한 대응은?',
            correct: '부당한 지시임을 상급자에게 소명하고, 시정되지 않으면 상급기관 또는 감사부서에 신고한다.',
            wrongs: [
              '상급자의 지시이므로 일단 따른 후, 사후에 감사부서에 보고한다.',
              '개인적으로 증거를 수집한 뒤 언론에 제보하여 공익을 도모한다.',
              '지시를 거부하되, 조직 내 갈등을 피하기 위해 별도의 신고는 하지 않는다.'
            ]
          },
          { q: '연구원 D는 연구 데이터에서 가설을 뒷받침하지 못하는 이상치를 발견했다. 프로젝트 마감이 임박한 상황에서 가장 적절한 행동은?',
            correct: '이상치를 포함한 전체 데이터를 보고하고, 이상치의 원인을 추가 분석하여 투명하게 기술한다.',
            wrongs: [
              '이상치를 통계적 오류로 판단하여 제거한 후, 가설에 부합하는 결과만 보고한다.',
              '이상치가 있는 실험을 재실시하여 가설에 맞는 결과가 나올 때까지 반복한다.',
              '마감에 맞추기 위해 이상치 부분을 "추후 분석 예정"으로 기재하고 넘어간다.'
            ]
          },
          { q: '회사 내부 감사 중 동료의 횡령 의혹을 발견한 직원 E의 가장 적절한 행동은?',
            correct: '객관적 증거를 확보한 뒤 내부 신고 채널(감사부서, 윤리경영 핫라인)을 통해 신고한다.',
            wrongs: [
              '동료에게 직접 횡령 사실을 확인하고, 자진 반환을 권유한다.',
              '확실한 증거가 없으므로 본인이 확인할 때까지 관망한다.',
              '즉시 수사기관에 고발하여 조직 차원의 은폐를 방지한다.'
            ]
          },
          { q: '의약품 영업사원 F가 주요 거래처 의사에게 고가의 해외 학회 참석비를 지원하겠다고 제안했다. 윤리적 관점에서 가장 적절한 판단은?',
            correct: '의사의 처방 결정에 영향을 줄 수 있는 경제적 이익 제공으로, 리베이트에 해당하여 위법한 행위이다.',
            wrongs: [
              '학회 참석은 의사의 전문성 향상에 기여하므로, 정당한 학술 지원 활동이다.',
              '제약업계의 관행이므로 금액이 적정 수준이면 윤리적 문제가 없다.',
              '의사가 자발적으로 요청한 것이 아니므로 제안 단계에서는 문제가 되지 않는다.'
            ]
          },
          { q: '공익신고자 보호에 대한 설명으로 가장 적절한 것은?',
            correct: '공익신고자는 신분상 불이익이나 근무 조건 차별로부터 법적으로 보호받으며, 보호 조치 신청이 가능하다.',
            wrongs: [
              '공익신고자 보호는 신고 내용이 사실로 확인된 경우에만 적용된다.',
              '익명 신고의 경우에는 공익신고자 보호 대상에서 제외된다.',
              '공익신고로 인해 조직에 손해가 발생한 경우, 신고자도 연대 배상 책임을 진다.'
            ]
          }
        ];
        const s = scenarios[Math.floor(Math.random() * scenarios.length)];
        const choices = [s.correct, ...s.wrongs];
        for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
        return {
          question: s.q, choices, answer: choices.indexOf(s.correct),
          keywords: ['윤리딜레마', '공익신고', '부당지시', '연구윤리', '이해충돌'],
          type: '피듈형', subArea: '윤리적판단', area: '직업윤리', level: 'advanced',
          explanation: `정답: ${s.correct}\n윤리 딜레마 상황에서는 합법성·투명성·공익성을 기준으로 판단하며, 내부 신고 채널 우선 활용이 원칙입니다.`
        };
      }}
    ];
  }

  // ─── 유틸 ───
  _rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

module.exports = { QuestionGenerator };
