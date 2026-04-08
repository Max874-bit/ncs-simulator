/**
 * ═══════════════════════════════════════════════════
 *  Agent 4: DiagnosisAgent (AI 진단 에이전트)
 * ═══════════════════════════════════════════════════
 *
 *  역할: 풀이 패턴 분석, 사고 전략 제안, 영역별 약점 진단, 보강 전략 수립
 *  입력: EvaluationAgent 결과 + AnswerExtractAgent 결과 + 전체 문제 데이터
 *  출력: { patternAnalysis, thinkingStrategies, areaDiagnosis, overallDiagnosis, recommendations, studyPlan }
 */

class DiagnosisAgent {
  constructor() {
    this.name = 'DiagnosisAgent';
    this.log = [];

    // 영역별 진단 메시지 데이터베이스
    this.diagnosisDB = {
      '의사소통능력': {
        high: '문서 이해 및 작성 능력이 우수합니다. 복합 규정 해석도 안정적입니다.',
        mid: '기본 독해력은 양호하나, 복합 조건이 포함된 규정/지침 해석에서 실수가 있습니다. 업무 문서(공지, 규정, 내부지침) 정독 연습을 강화하세요.',
        low: '업무 문서 독해 기초가 부족합니다. 공지, 규정, 보고서 등 실무 문서 읽기부터 시작하세요. 핵심 정보 추출 연습이 필요합니다.',
        tips: ['규정/지침의 단서 조항(다만, 단, 제외)에 주의', '선택지와 지문의 키워드 대조 습관화', '업무 메일/보고서 작성 원칙 숙지'],
        trapPatterns: {
          '조건 반전': '지문에서 "~하지 않는 경우", "제외" 등 부정 조건을 놓치고 긍정으로 읽는 경향이 있습니다.',
          '유사 표현 혼동': '비슷한 표현(예: "보고하여야 한다" vs "보고할 수 있다")의 의무/임의 차이를 구분하지 못합니다.',
          '부분 정답 선택': '선택지 4개 중 부분적으로 맞는 내용에 끌려, 완전한 정답을 놓치는 패턴입니다.'
        },
        thinkingTip: '지문을 읽을 때 "의무(~해야 한다)"와 "임의(~할 수 있다)" 표현을 형광펜 치듯 구분하세요. 단서 조항(다만, 단, 제외)이 나오면 반드시 밑줄 긋고 선택지와 대조하세요.'
      },
      '수리능력': {
        high: '자료 해석 및 수리 계산 능력이 우수합니다. 복합 표/그래프도 정확히 분석합니다.',
        mid: '기본 계산은 가능하나 복합 표/그래프 해석, 증감률 계산에서 오류가 발생합니다. PSAT형 자료해석 문제를 집중 연습하세요.',
        low: '기초 수리 능력 보강이 시급합니다. 백분율, 비율, 평균 등 기본 계산부터 다시 연습하고, 점진적으로 표/그래프 해석으로 확장하세요.',
        tips: ['표에서 합계, 비율, 증감률 빠르게 계산하는 연습', '선택지 검증 시 소거법 활용', '단위 환산 실수 주의'],
        trapPatterns: {
          '단위 혼동': '단위(만 원 vs 원, % vs %p)를 혼동하여 계산 결과가 10배, 100배 틀어지는 패턴입니다.',
          '증감률 오류': '전년 대비 증감률을 구할 때 분모를 기준연도가 아닌 비교연도로 잡는 실수를 합니다.',
          '부분 계산 오류': '표의 일부 데이터만 계산에 포함하거나, 소수점 반올림 시점을 잘못 잡습니다.'
        },
        thinkingTip: '표/그래프 문제에서는 먼저 선택지의 숫자 범위를 훑어보세요. 대략적인 어림셈으로 2~3개를 소거한 뒤 정밀 계산하면 시간을 절약할 수 있습니다.'
      },
      '문제해결능력': {
        high: '논리적 추론과 상황판단 능력이 뛰어납니다. 복합 조건 문제도 체계적으로 접근합니다.',
        mid: '단순 추론은 가능하나 다중 조건 결합 문제에서 오류가 있습니다. 조건을 표/매트릭스로 정리하는 습관을 기르세요.',
        low: '논리적 사고 기초 훈련이 필요합니다. 조건 정리 → 경우의 수 나열 → 소거법 적용의 기본 프로세스를 체화하세요.',
        tips: ['조건을 반드시 표로 정리', '긴급도/중요도 매트릭스 활용', '가중 평균 계산 연습'],
        trapPatterns: {
          '조건 누락': '3개 이상의 조건이 주어질 때 1~2개 조건만 적용하고 나머지를 무시하는 패턴입니다.',
          '우선순위 혼동': '긴급도와 중요도를 구분하지 못하고, "긴급한 것 = 중요한 것"으로 동일시합니다.',
          '논리 비약': '전제와 결론 사이의 논리적 연결 없이 직감적으로 답을 선택합니다.'
        },
        thinkingTip: '복합 조건 문제는 반드시 조건을 번호 매겨 나열하세요 (①②③...). 각 선택지를 검증할 때 조건 체크리스트를 하나씩 대조하면 누락을 방지할 수 있습니다.'
      },
      '자원관리능력': {
        high: '시간, 예산, 인적자원 관리 개념이 탄탄합니다.',
        mid: '기본 개념은 이해하나 복합 제약조건 하 최적 배분에서 약점이 있습니다. 실제 업무 시나리오 기반 연습을 권장합니다.',
        low: '자원관리 기본 이론(시간관리, 예산편성, 인력배치)부터 학습이 필요합니다.',
        tips: ['아이젠하워 매트릭스 개념 숙지', '예산 편성/집행/결산 프로세스 이해', '제약조건 만족 여부 체크리스트 활용'],
        trapPatterns: {
          '제약조건 무시': '예산 한도, 인원 제한 등 제약조건을 간과하고 이상적인 답을 선택합니다.',
          '효율성 착각': '"가장 많이" 배분하는 것을 "가장 효율적"이라고 착각합니다.',
          '비용 계산 누락': '직접 비용만 계산하고 간접 비용(교육비, 이동비 등)을 누락합니다.'
        },
        thinkingTip: '자원 배분 문제에서는 먼저 "제약 조건"을 모두 밑줄 치세요. 각 선택지가 모든 제약 조건을 만족하는지 체크한 후, 만족하는 것들 중 최적을 고르는 2단계 접근을 하세요.'
      },
      '정보능력': {
        high: '정보 처리 및 분석 능력이 우수합니다. 보안 판단도 정확합니다.',
        mid: '기본 컴퓨터 활용은 가능하나 데이터 분석, 정보보안 판단에서 보완이 필요합니다.',
        low: '정보 활용 기초(스프레드시트 함수, 개인정보 보호, 정보보안 기본)부터 학습하세요.',
        tips: ['엑셀 기본 함수(SUM, AVERAGE, VLOOKUP) 숙지', '개인정보 보호법 기본 개념', '정보보안 이상행위 패턴 학습'],
        trapPatterns: {
          '함수 혼동': 'VLOOKUP과 HLOOKUP, COUNT와 COUNTA 등 유사 함수를 혼동합니다.',
          '보안 등급 오해': '개인정보 등급 구분(고유식별정보 vs 일반개인정보)을 혼동합니다.',
          '논리 연산 오류': 'AND/OR 조건을 반대로 적용하거나, NOT 조건을 누락합니다.'
        },
        thinkingTip: '정보보안 문제에서는 "가장 심각한 위반"을 고를 때, 법적 의무사항(개인정보보호법)과 조직 내부 규정을 구분하세요. 법적 의무 위반이 항상 더 심각합니다.'
      },
      '조직이해능력': {
        high: '조직 구조와 업무 프로세스에 대한 이해가 깊습니다.',
        mid: '기본 조직 이론은 이해하나 프로세스 개선, 조직 분석에서 보완이 필요합니다.',
        low: '조직 구조(라인/스태프/매트릭스), 경영 기초, 업무 프로세스 개념 학습이 필요합니다.',
        tips: ['조직 유형별 특성 비교 정리', '프로세스 개선(병행처리, 단축) 계산 연습', 'PDCA 사이클 이해'],
        trapPatterns: {
          '조직 유형 혼동': '라인조직과 라인-스태프 조직, 매트릭스 조직의 특성을 혼동합니다.',
          '프로세스 순서 오류': '업무 프로세스의 선후행 관계를 잘못 파악합니다.',
          '역할 혼동': '의사결정 권한과 실행 권한, 자문 역할을 구분하지 못합니다.'
        },
        thinkingTip: '조직 구조 문제에서는 "의사결정 속도"와 "전문성 활용" 두 축으로 각 조직 유형을 비교하세요. 장단점이 trade-off 관계임을 기억하면 함정을 피할 수 있습니다.'
      },
      '자기개발능력': {
        high: '자기 분석과 경력 설계 역량이 우수합니다.',
        mid: 'SMART 목표 설정, 경력개발 기본은 이해하나 구체적 실행 계획 수립이 부족합니다.',
        low: '자기 분석(SWOT, Holland 적성검사)과 경력개발 기초 개념부터 학습하세요.',
        tips: ['SMART 목표 설정 원칙 숙지', 'Holland 직업적성 6유형 이해', '경력개발제도(CDP) 개념 정리'],
        trapPatterns: {
          'SMART 조건 혼동': 'Specific/Measurable/Achievable/Relevant/Time-bound 중 하나를 빠뜨리거나 잘못 적용합니다.',
          '적성 유형 혼동': 'Holland 6유형(RIASEC)의 특성을 서로 혼동합니다.',
          '목표 vs 수단 혼동': '최종 목표와 달성 수단/과정을 구분하지 못합니다.'
        },
        thinkingTip: 'SMART 목표 문제에서는 각 선택지를 S-M-A-R-T 5개 기준에 하나씩 대입해보세요. 하나라도 불충족이면 탈락시키는 소거법이 가장 정확합니다.'
      },
      '대인관계능력': {
        high: '팀워크, 갈등관리, 리더십 역량이 뛰어납니다.',
        mid: '기본 대인관계 이론은 이해하나 복합 갈등 상황 대응에서 보완이 필요합니다.',
        low: '갈등관리(Thomas-Kilmann), 리더십 이론, 협상 기본 개념부터 학습하세요.',
        tips: ['Thomas-Kilmann 5가지 갈등해결 유형 숙지', 'Tuckman 팀 발달 단계 이해', '적극적 경청과 비폭력 대화법'],
        trapPatterns: {
          '갈등해결 유형 혼동': '타협과 협력, 회피와 수용을 구분하지 못합니다.',
          '상황 무시': '갈등 상황의 맥락(긴급도, 관계 중요도)을 무시하고 일률적으로 "협력"만 선택합니다.',
          '리더십 유형 오적용': '상황적 리더십에서 구성원 성숙도에 맞지 않는 유형을 선택합니다.'
        },
        thinkingTip: '갈등 상황 문제에서는 "관계 유지"와 "목표 달성" 두 축으로 판단하세요. 둘 다 중요하면 협력, 목표만 중요하면 경쟁, 관계만 중요하면 수용입니다.'
      },
      '기술능력': {
        high: '기술 이해와 적용 능력이 우수합니다.',
        mid: '기본 기술 개념은 이해하나 신기술(AI, 클라우드, RPA) 적용 판단에서 보완이 필요합니다.',
        low: '기술수명주기, 클라우드(IaaS/PaaS/SaaS), 디지털 전환 기초 개념부터 학습하세요.',
        tips: ['클라우드 서비스 모델 3종 비교', '기술수명주기 4단계 이해', 'RPA 적용 적합 업무 판단 기준'],
        trapPatterns: {
          '서비스 모델 혼동': 'IaaS/PaaS/SaaS의 관리 범위 경계를 혼동합니다.',
          '기술 수준 오판': '기술의 성숙도(도입기/성장기/성숙기/쇠퇴기)를 잘못 판단합니다.',
          '적용 적합성 오류': '모든 업무에 신기술을 적용하는 것이 좋다고 판단하는 편향이 있습니다.'
        },
        thinkingTip: '기술 적용 문제에서는 "비용 대비 효과"를 기준으로 생각하세요. 단순 반복 → RPA, 데이터 분석 → AI, 인프라 유연성 → 클라우드로 매핑하면 판단이 쉬워집니다.'
      },
      '직업윤리': {
        high: '공직윤리, 청렴, 이해충돌 방지에 대한 이해가 확실합니다.',
        mid: '기본 윤리 원칙은 이해하나 실무 적용(김영란법, 이해충돌방지법 등) 세부 사항에서 보완이 필요합니다.',
        low: '공직자 행동강령, 김영란법, 이해충돌방지법 기본 내용부터 학습하세요.',
        tips: ['김영란법 금액 기준(식사 3만, 선물 5만, 경조사 10만) 암기', '이해충돌방지법 주요 의무 5가지', '공익신고자 보호 요건'],
        trapPatterns: {
          '금액 기준 혼동': '김영란법의 식사/선물/경조사비 상한을 혼동합니다.',
          '적용 대상 오류': '법 적용 대상(공직자, 공공기관 임직원 등)의 범위를 잘못 파악합니다.',
          '예외 규정 무시': '정당한 직무수행, 사교 목적 등 예외 규정을 고려하지 않습니다.'
        },
        thinkingTip: '윤리 문제에서 "이것이 외부에 공개되어도 문제없는가?" 테스트를 적용하세요. 조금이라도 의심이 들면 더 엄격한 선택지를 고르는 것이 NCS에서는 정답인 경우가 많습니다.'
      },
      '직무수행능력': {
        high: '경영/경제/행정/회계 전공 지식이 탄탄합니다.',
        mid: '기본 이론은 이해하나 응용 문제(재무비율 분석, 정책평가, 원가계산 등)에서 보완이 필요합니다.',
        low: '경영학(SWOT, BSC), 경제학(수요공급), 행정학(예산제도), 회계학(재무상태표) 기초부터 체계적으로 학습하세요.',
        tips: ['BSC 4대 관점 및 KPI 예시 정리', '재무비율(유동/부채/ROE) 계산 연습', '예산제도 4종 비교(LIBS/PBS/PPBS/ZBB)', '포터의 경쟁전략 3유형 숙지'],
        trapPatterns: {
          '이론 혼동': '유사한 경영/경제 이론(예: BSC vs KPI, SWOT vs PEST)을 혼동합니다.',
          '계산 공식 오적용': '재무비율의 분자/분모를 뒤바꾸거나 잘못된 공식을 적용합니다.',
          '제도 특성 혼동': '예산제도(LIBS/PBS/PPBS/ZBB) 각각의 핵심 특성을 구분하지 못합니다.'
        },
        thinkingTip: '이론 비교 문제에서는 각 이론의 "핵심 한 줄 정의"를 떠올리세요. 예: BSC="4대 관점 균형", ZBB="매년 0부터 재편성". 핵심 키워드가 맞는지만 확인하면 함정을 피할 수 있습니다.'
      }
    };
  }

  /**
   * 전체 진단 수행
   * @param {object} evaluationResult - EvaluationAgent 결과
   * @param {object} extractedData - AnswerExtractAgent 결과
   * @param {object[]} questions - 전체 문제 데이터 (선택지 텍스트 포함)
   */
  diagnose(evaluationResult, extractedData, questions = []) {
    this._emit('info', '진단 시작...');

    // 기존 영역별 진단
    const areaDiagnosis = this._diagnoseAreas(evaluationResult.areaGrades);
    const weakestArea = this._findWeakestArea(evaluationResult.areaGrades);
    const overallDiagnosis = this._generateOverallDiagnosis(
      evaluationResult.score,
      evaluationResult.areaGrades,
      weakestArea
    );
    const recommendations = this._generateRecommendations(
      evaluationResult.areaGrades,
      extractedData
    );
    const studyPlan = this._generateStudyPlan(evaluationResult.score, evaluationResult.areaGrades);

    // ═══ 새 기능: 풀이 패턴 분석 & 사고 전략 제안 ═══
    this._emit('info', '풀이 패턴 분석 중...');
    const patternAnalysis = this._analyzeAnswerPatterns(extractedData.results, questions);

    this._emit('info', '사고 전략 생성 중...');
    const thinkingStrategies = this._generateThinkingStrategies(
      patternAnalysis,
      evaluationResult.areaGrades,
      extractedData.results
    );

    this._emit('success', `진단 완료 — 패턴 ${patternAnalysis.patterns.length}개, 전략 ${thinkingStrategies.length}개 도출`);

    return {
      areaDiagnosis,
      weakestArea,
      overallDiagnosis,
      recommendations,
      studyPlan,
      patternAnalysis,
      thinkingStrategies
    };
  }

  // ═══════════════════════════════════════════════════════
  //  풀이 패턴 분석 (신규)
  // ═══════════════════════════════════════════════════════

  /**
   * 사용자의 답안 선택 패턴을 분석하여 행동적 특성을 도출
   */
  _analyzeAnswerPatterns(results, questions) {
    const patterns = [];
    const wrongResults = results.filter(r => !r.isCorrect && !r.isUnanswered);
    const unanswered = results.filter(r => r.isUnanswered);
    const totalWrong = wrongResults.length;

    // ─── 패턴 1: 시간 압박 (후반부 오답 집중) ───
    const halfIdx = Math.floor(results.length / 2);
    const firstHalfWrong = results.slice(0, halfIdx).filter(r => !r.isCorrect).length;
    const secondHalfWrong = results.slice(halfIdx).filter(r => !r.isCorrect).length;
    const firstHalfTotal = halfIdx;
    const secondHalfTotal = results.length - halfIdx;

    if (secondHalfTotal > 0 && firstHalfTotal > 0) {
      const firstHalfRate = firstHalfWrong / firstHalfTotal;
      const secondHalfRate = secondHalfWrong / secondHalfTotal;

      if (secondHalfRate > firstHalfRate * 1.5 && secondHalfWrong >= 2) {
        patterns.push({
          type: 'timeDecay',
          severity: secondHalfRate > firstHalfRate * 2 ? 'high' : 'medium',
          title: '후반부 집중력 저하',
          description: `전반부 오답률 ${Math.round(firstHalfRate * 100)}% → 후반부 오답률 ${Math.round(secondHalfRate * 100)}%로 증가했습니다.`,
          insight: '시험 후반으로 갈수록 정답률이 떨어지는 패턴입니다. 시간 배분 전략을 점검하거나, 어려운 문제는 표시 후 건너뛰고 쉬운 문제부터 풀어보세요.',
          data: { firstHalfRate: Math.round(firstHalfRate * 100), secondHalfRate: Math.round(secondHalfRate * 100) }
        });
      }
    }

    // ─── 패턴 2: 미응답 경향 ───
    if (unanswered.length >= 2) {
      const unansweredAreas = {};
      unanswered.forEach(r => { unansweredAreas[r.area] = (unansweredAreas[r.area] || 0) + 1; });
      const topUnansweredArea = Object.entries(unansweredAreas).sort((a, b) => b[1] - a[1])[0];

      patterns.push({
        type: 'unanswered',
        severity: unanswered.length >= 4 ? 'high' : 'medium',
        title: '미응답 문항 다수',
        description: `${unanswered.length}문항을 답하지 않았습니다${topUnansweredArea ? ` (${topUnansweredArea[0]} ${topUnansweredArea[1]}문항)` : ''}.`,
        insight: 'NCS 시험은 오답 감점이 없습니다. 확신이 없더라도 소거법으로 2개를 줄인 뒤 반드시 답을 표기하세요. 무응답은 0%지만, 찍기는 25~50% 확률입니다.',
        data: { count: unanswered.length, areas: unansweredAreas }
      });
    }

    // ─── 패턴 3: 난이도 불일치 (초급 문제 오답) ───
    const beginnerWrong = wrongResults.filter(r => r.level === 'beginner');
    if (beginnerWrong.length >= 2) {
      const bwAreas = [...new Set(beginnerWrong.map(r => r.area))];
      patterns.push({
        type: 'levelMismatch',
        severity: 'high',
        title: '기초 문항 오답 다수',
        description: `초급 난이도 문제를 ${beginnerWrong.length}개 틀렸습니다 (${bwAreas.join(', ')}).`,
        insight: '초급 문제에서의 오답은 해당 영역의 기본 개념이 불확실하다는 신호입니다. 고급 문제 연습보다 기초 개념을 다시 정리하는 것이 점수 향상에 훨씬 효과적입니다.',
        data: { count: beginnerWrong.length, areas: bwAreas }
      });
    }

    // ─── 패턴 4: 영역 연쇄 오답 (같은 영역 2문제 이상 연속 오답) ───
    const areaStreaks = {};
    for (const r of wrongResults) {
      areaStreaks[r.area] = (areaStreaks[r.area] || 0) + 1;
    }
    const chainedAreas = Object.entries(areaStreaks).filter(([, cnt]) => cnt >= 2);
    if (chainedAreas.length > 0) {
      for (const [area, cnt] of chainedAreas) {
        const areaTotal = results.filter(r => r.area === area).length;
        const areaWrongRate = Math.round((cnt / areaTotal) * 100);

        if (areaWrongRate >= 50) {
          patterns.push({
            type: 'areaWeakness',
            severity: areaWrongRate >= 75 ? 'high' : 'medium',
            title: `${area} 취약`,
            description: `${area} 영역에서 ${areaTotal}문항 중 ${cnt}문항을 틀렸습니다 (오답률 ${areaWrongRate}%).`,
            insight: this.diagnosisDB[area]?.thinkingTip || `${area} 영역의 핵심 이론을 다시 정리하고, 해당 유형 문제를 집중적으로 풀어보세요.`,
            data: { area, wrong: cnt, total: areaTotal, rate: areaWrongRate }
          });
        }
      }
    }

    // ─── 패턴 5: 선택지 함정 패턴 분석 (문제 데이터가 있을 때) ───
    const distractorPatterns = this._analyzeDistractorChoices(wrongResults, questions);
    if (distractorPatterns.length > 0) {
      patterns.push(...distractorPatterns);
    }

    // ─── 패턴 6: 고급 문제 전멸 ───
    const advancedResults = results.filter(r => r.level === 'advanced');
    const advancedWrong = advancedResults.filter(r => !r.isCorrect);
    if (advancedResults.length >= 3 && advancedWrong.length === advancedResults.length) {
      patterns.push({
        type: 'advancedFail',
        severity: 'medium',
        title: '고급 문제 전멸',
        description: `고급 난이도 ${advancedResults.length}문항을 모두 틀렸습니다.`,
        insight: '고급 문제는 2~3개 개념의 복합 적용을 요구합니다. 먼저 중급 수준을 안정적으로 맞힌 후(90% 이상), 고급 문제에 도전하세요. 급하게 난이도를 올리면 오히려 자신감이 떨어집니다.',
        data: { count: advancedResults.length }
      });
    }

    // 패턴 우선순위 정렬 (severity: high > medium > low)
    const severityOrder = { high: 0, medium: 1, low: 2 };
    patterns.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return {
      totalQuestions: results.length,
      totalWrong,
      totalUnanswered: unanswered.length,
      patterns,
      summary: this._generatePatternSummary(patterns)
    };
  }

  /**
   * 선택한 오답(distractor)의 유형을 분석
   */
  _analyzeDistractorChoices(wrongResults, questions) {
    if (!questions || questions.length === 0) return [];

    const patterns = [];
    const questionMap = {};
    questions.forEach(q => { questionMap[q.id] = q; });

    let adjacentCount = 0;  // 정답 인접 선택지를 고른 횟수
    let totalAnalyzed = 0;

    for (const wr of wrongResults) {
      const q = questionMap[wr.questionId];
      if (!q || !q.choices || q.choices.length < 4) continue;
      totalAnalyzed++;

      // 정답 인접 선택지 선택 여부 (정답이 2번이면 1번이나 3번을 골랐는지)
      const diff = Math.abs(wr.userAnswer - wr.correctAnswer);
      if (diff === 1) adjacentCount++;
    }

    // 인접 선택지 선택 패턴
    if (totalAnalyzed >= 3 && adjacentCount >= Math.ceil(totalAnalyzed * 0.5)) {
      patterns.push({
        type: 'adjacentChoice',
        severity: 'medium',
        title: '유사 선택지 혼동',
        description: `오답 중 ${adjacentCount}건에서 정답과 인접한 번호의 선택지를 골랐습니다.`,
        insight: '정답과 가까운 선택지를 고르는 경향이 있습니다. 이는 "대충 이해하고 넘어간" 개념에서 발생합니다. 선택지를 읽을 때 "이것이 왜 정답이 아닌지"를 적극적으로 반증하는 습관을 기르세요.',
        data: { adjacentCount, totalAnalyzed }
      });
    }

    return patterns;
  }

  /**
   * 패턴 요약 메시지 생성
   */
  _generatePatternSummary(patterns) {
    if (patterns.length === 0) {
      return '뚜렷한 오답 패턴이 발견되지 않았습니다. 고른 실력을 보여주고 있습니다.';
    }

    const highPatterns = patterns.filter(p => p.severity === 'high');
    const medPatterns = patterns.filter(p => p.severity === 'medium');

    let summary = '';
    if (highPatterns.length > 0) {
      summary += `주의가 필요한 패턴 ${highPatterns.length}개: ${highPatterns.map(p => p.title).join(', ')}. `;
    }
    if (medPatterns.length > 0) {
      summary += `개선 가능한 패턴 ${medPatterns.length}개: ${medPatterns.map(p => p.title).join(', ')}.`;
    }
    return summary;
  }

  // ═══════════════════════════════════════════════════════
  //  사고 전략 제안 (신규)
  // ═══════════════════════════════════════════════════════

  /**
   * 분석된 패턴과 영역별 성적을 기반으로 구체적인 사고 전략을 제안
   */
  _generateThinkingStrategies(patternAnalysis, areaGrades, results) {
    const strategies = [];

    // ─── 1. 영역별 맞춤 사고 전략 (오답 영역만) ───
    const weakAreas = Object.entries(areaGrades)
      .filter(([, s]) => s.rate < 80)
      .sort((a, b) => a[1].rate - b[1].rate);

    for (const [area, stats] of weakAreas) {
      const db = this.diagnosisDB[area];
      if (!db || !db.trapPatterns) continue;

      // 해당 영역의 오답 문제들을 분석하여 가장 빈번한 함정 유형 추론
      const areaWrong = results.filter(r => r.area === area && !r.isCorrect && !r.isUnanswered);
      if (areaWrong.length === 0) continue;

      // 오답 키워드에서 함정 유형 추론
      const trapType = this._inferTrapType(area, areaWrong, stats);

      strategies.push({
        area,
        currentRate: stats.rate,
        grade: stats.grade,
        wrongCount: areaWrong.length,
        trapType: trapType.type,
        trapDescription: trapType.description,
        thinkingStrategy: db.thinkingTip,
        actionItem: this._generateActionItem(area, stats.rate, trapType.type),
        prediction: this._generatePrediction(area, areaWrong.length, stats.total, trapType.type)
      });
    }

    // ─── 2. 행동 패턴 기반 범용 전략 ───
    for (const pattern of patternAnalysis.patterns) {
      if (pattern.type === 'timeDecay') {
        strategies.push({
          area: '시간 관리',
          currentRate: null,
          grade: null,
          wrongCount: null,
          trapType: 'timeManagement',
          trapDescription: '시험 후반부에 시간이 부족하여 급하게 풀거나 미응답으로 처리하는 경향',
          thinkingStrategy: '문제당 평균 시간을 미리 정하고(예: 90초), 1분 30초가 지나도 풀리지 않으면 즉시 표시하고 넘기세요. 남은 시간에 돌아와서 풀면 오히려 객관적으로 볼 수 있습니다.',
          actionItem: '연습 시 타이머를 켜고 문제당 90초 제한을 엄격히 지키는 연습을 하세요.',
          prediction: '현재 후반부 오답 집중 패턴을 교정하면, 전체 점수가 5~10점 상승할 수 있습니다.'
        });
      }

      if (pattern.type === 'unanswered') {
        strategies.push({
          area: '응답 전략',
          currentRate: null,
          grade: null,
          wrongCount: pattern.data.count,
          trapType: 'noAnswer',
          trapDescription: '확신이 없는 문제에서 답을 선택하지 않는 경향',
          thinkingStrategy: '4지선다에서 2개를 확실히 소거할 수 있다면 50% 확률입니다. 완전히 모르는 문제도 소거 후 찍으면 무응답보다 항상 유리합니다.',
          actionItem: '풀이 시 "절대 아닌 것 2개 소거" → "나머지 중 선택" 2단계를 습관화하세요.',
          prediction: `미응답 ${pattern.data.count}문항에 소거법 적용 시, 확률적으로 ${Math.round(pattern.data.count * 0.4)}~${Math.round(pattern.data.count * 0.5)}문항을 추가로 맞힐 수 있습니다.`
        });
      }
    }

    return strategies;
  }

  /**
   * 오답 패턴에서 함정 유형을 추론
   */
  _inferTrapType(area, wrongResults, stats) {
    const db = this.diagnosisDB[area];
    if (!db || !db.trapPatterns) {
      return { type: 'general', description: '정확한 개념 이해가 필요한 문항에서 오답이 발생했습니다.' };
    }

    const trapTypes = Object.entries(db.trapPatterns);

    // 키워드 기반 추론
    const allKeywords = wrongResults.flatMap(r => r.keywords || []);
    const keywordFreq = {};
    allKeywords.forEach(k => { keywordFreq[k] = (keywordFreq[k] || 0) + 1; });

    // 난이도 기반 추론: 초급 오답이 많으면 기초 혼동, 고급 오답이 많으면 복합 오류
    const beginnerWrong = wrongResults.filter(r => r.level === 'beginner').length;
    const advancedWrong = wrongResults.filter(r => r.level === 'advanced').length;

    if (beginnerWrong > wrongResults.length * 0.5) {
      // 초급 오답 다수 → 기본 개념 혼동 유형
      return { type: trapTypes[0][0], description: trapTypes[0][1] };
    } else if (advancedWrong > wrongResults.length * 0.5) {
      // 고급 오답 다수 → 복합 응용 오류
      return { type: trapTypes[trapTypes.length - 1][0], description: trapTypes[trapTypes.length - 1][1] };
    } else {
      // 중간 수준 → 가장 빈번한 함정
      const midIdx = Math.min(1, trapTypes.length - 1);
      return { type: trapTypes[midIdx][0], description: trapTypes[midIdx][1] };
    }
  }

  /**
   * 구체적 실행 과제 생성
   */
  _generateActionItem(area, rate, trapType) {
    if (rate < 40) {
      return `${area} 기초 이론서를 1주일간 매일 30분씩 정독하고, 각 단원 끝의 확인 문제를 풀어보세요.`;
    } else if (rate < 60) {
      return `${area} 영역의 "${trapType}" 유형 문제를 매일 5문항씩 풀면서, 틀린 문제는 오답 노트에 "왜 이 선택지에 끌렸는지"를 기록하세요.`;
    } else {
      return `${area} 영역은 기본기는 충분합니다. 고급 문제 위주로 풀되, 오답 시 "어떤 조건을 놓쳤는지" 메모하는 습관을 기르세요.`;
    }
  }

  /**
   * 향후 답변 확률 예측 메시지 생성
   */
  _generatePrediction(area, wrongCount, totalInArea, trapType) {
    const wrongRate = Math.round((wrongCount / totalInArea) * 100);
    return `현재 ${area}의 "${trapType}" 유형에서 오답 확률이 약 ${wrongRate}%입니다. 위 전략을 2주간 실천하면 이 유형의 오답률을 ${Math.max(10, wrongRate - 25)}% 이하로 줄일 수 있습니다.`;
  }

  // ═══════════════════════════════════════════════════════
  //  기존 진단 메서드 (유지)
  // ═══════════════════════════════════════════════════════

  /**
   * 영역별 진단
   */
  _diagnoseAreas(areaGrades) {
    const result = {};

    for (const [area, stats] of Object.entries(areaGrades)) {
      const db = this.diagnosisDB[area] || { high: '우수', mid: '보통', low: '미흡', tips: [] };

      let diagnosis;
      if (stats.rate >= 80) diagnosis = db.high;
      else if (stats.rate >= 50) diagnosis = db.mid;
      else diagnosis = db.low;

      result[area] = {
        ...stats,
        diagnosis,
        tips: db.tips || [],
        priority: stats.rate < 60 ? 'high' : stats.rate < 80 ? 'medium' : 'low'
      };
    }

    return result;
  }

  /**
   * 가장 약한 영역 찾기
   */
  _findWeakestArea(areaGrades) {
    let weakest = null, lowestRate = 100;
    for (const [area, stats] of Object.entries(areaGrades)) {
      if (stats.rate < lowestRate) {
        lowestRate = stats.rate;
        weakest = area;
      }
    }
    return weakest;
  }

  /**
   * 종합 진단 생성
   */
  _generateOverallDiagnosis(score, areaGrades, weakestArea) {
    const areas = Object.entries(areaGrades);
    const strongAreas = areas.filter(([, s]) => s.rate >= 80).map(([a]) => a);
    const weakAreas = areas.filter(([, s]) => s.rate < 60).map(([a]) => a);
    const criticalAreas = areas.filter(([, s]) => s.rate < 40).map(([a]) => a);

    let diagnosis = '';

    if (score >= 80) {
      diagnosis = `전체적으로 우수한 수준입니다 (${score}점).`;
      if (weakAreas.length > 0) {
        diagnosis += ` 다만, ${weakAreas.join(', ')} 영역의 추가 보강으로 더욱 안정적인 합격이 가능합니다.`;
      } else {
        diagnosis += ` 모든 영역에서 균형 잡힌 실력을 보여주고 있습니다. 현재 수준을 유지하세요.`;
      }
    } else if (score >= 60) {
      diagnosis = `합격 가능 수준이나 안정권은 아닙니다 (${score}점).`;
      if (strongAreas.length > 0) {
        diagnosis += ` ${strongAreas.join(', ')}은(는) 강점입니다.`;
      }
      if (weakestArea) {
        diagnosis += ` ${weakestArea} 영역을 집중 보강하면 점수 상승 효과가 가장 큽니다.`;
      }
      diagnosis += ` 목표 점수 80점까지 ${80 - score}점을 더 올려야 안정권에 진입합니다.`;
    } else {
      diagnosis = `현재 불합격권입니다 (${score}점).`;
      if (criticalAreas.length > 0) {
        diagnosis += ` 특히 ${criticalAreas.join(', ')} 영역이 심각하게 부족합니다.`;
      }
      diagnosis += ` 기초 개념부터 체계적으로 학습한 뒤, 유형별 문제 풀이를 병행하세요. 합격선(60점)까지 ${60 - score}점이 필요합니다.`;
    }

    return diagnosis;
  }

  /**
   * 보강 추천 전략 수립
   */
  _generateRecommendations(areaGrades, extractedData) {
    const recs = [];
    const sorted = Object.entries(areaGrades).sort((a, b) => a[1].rate - b[1].rate);

    for (const [area, stats] of sorted) {
      if (stats.rate < 80) {
        const db = this.diagnosisDB[area] || {};

        const strategy = stats.rate < 40
          ? `${area} 기초 이론부터 체계적으로 학습 후 모듈형 문제 풀이`
          : stats.rate < 60
          ? `${area} 유형별 약점 집중 공략 (피듈형/PSAT형 병행)`
          : `${area} 고난도 문제 훈련으로 실력 고도화`;

        recs.push({
          area,
          currentRate: stats.rate,
          grade: stats.grade,
          priority: stats.rate < 40 ? 'critical' : stats.rate < 60 ? 'high' : 'medium',
          strategy,
          weakSubAreas: stats.weakSubAreas,
          diagnosis: this._diagnoseAreas({ [area]: stats })[area].diagnosis,
          tips: db.tips || [],
          targetScore: Math.min(stats.rate + 20, 100),
          estimatedQuestions: Math.ceil((80 - stats.rate) / 5)
        });
      }
    }

    return recs;
  }

  /**
   * 학습 계획 생성
   */
  _generateStudyPlan(score, areaGrades) {
    const weakAreas = Object.entries(areaGrades)
      .filter(([, s]) => s.rate < 80)
      .sort((a, b) => a[1].rate - b[1].rate);

    if (weakAreas.length === 0) {
      return { message: '모든 영역이 우수합니다. 실전 감각 유지를 위해 주 1회 모의고사를 권장합니다.', steps: [] };
    }

    const steps = weakAreas.map(([area, stats], idx) => ({
      step: idx + 1,
      area,
      currentGrade: stats.grade,
      targetGrade: stats.rate < 60 ? 'B' : 'A',
      action: stats.rate < 40
        ? `${area} 기초 이론 학습 (모듈형 교재)`
        : stats.rate < 60
        ? `${area} 유형별 문제 풀이 (피듈형)`
        : `${area} 고난도 문제 연습 (PSAT형)`,
      estimatedDays: stats.rate < 40 ? 14 : stats.rate < 60 ? 7 : 3
    }));

    const totalDays = steps.reduce((sum, s) => sum + s.estimatedDays, 0);

    return {
      totalDays,
      message: `총 ${totalDays}일 보강 계획이 필요합니다. 가장 약한 영역부터 순서대로 집중하세요.`,
      steps
    };
  }

  _emit(level, message) {
    this.log.push({ agent: this.name, level, message, timestamp: new Date().toISOString() });
  }

  getLog() { return this.log; }
  clearLog() { this.log = []; }
}

module.exports = { DiagnosisAgent };
