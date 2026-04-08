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
