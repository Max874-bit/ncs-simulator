/**
 * ═══════════════════════════════════════════════════
 *  Agent 4: DiagnosisAgent (AI 진단 에이전트)
 * ═══════════════════════════════════════════════════
 *
 *  역할: 영역별 약점 진단, 종합 소견 생성, 보강 문제 추천 전략 수립
 *  입력: EvaluationAgent 결과 + AnswerExtractAgent 결과
 *  출력: { areaDiagnosis, overallDiagnosis, recommendations }
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
        tips: ['규정/지침의 단서 조항(다만, 단, 제외)에 주의', '선택지와 지문의 키워드 대조 습관화', '업무 메일/보고서 작성 원칙 숙지']
      },
      '수리능력': {
        high: '자료 해석 및 수리 계산 능력이 우수합니다. 복합 표/그래프도 정확히 분석합니다.',
        mid: '기본 계산은 가능하나 복합 표/그래프 해석, 증감률 계산에서 오류가 발생합니다. PSAT형 자료해석 문제를 집중 연습하세요.',
        low: '기초 수리 능력 보강이 시급합니다. 백분율, 비율, 평균 등 기본 계산부터 다시 연습하고, 점진적으로 표/그래프 해석으로 확장하세요.',
        tips: ['표에서 합계, 비율, 증감률 빠르게 계산하는 연습', '선택지 검증 시 소거법 활용', '단위 환산 실수 주의']
      },
      '문제해결능력': {
        high: '논리적 추론과 상황판단 능력이 뛰어납니다. 복합 조건 문제도 체계적으로 접근합니다.',
        mid: '단순 추론은 가능하나 다중 조건 결합 문제에서 오류가 있습니다. 조건을 표/매트릭스로 정리하는 습관을 기르세요.',
        low: '논리적 사고 기초 훈련이 필요합니다. 조건 정리 → 경우의 수 나열 → 소거법 적용의 기본 프로세스를 체화하세요.',
        tips: ['조건을 반드시 표로 정리', '긴급도/중요도 매트릭스 활용', '가중 평균 계산 연습']
      },
      '자원관리능력': {
        high: '시간, 예산, 인적자원 관리 개념이 탄탄합니다.',
        mid: '기본 개념은 이해하나 복합 제약조건 하 최적 배분에서 약점이 있습니다. 실제 업무 시나리오 기반 연습을 권장합니다.',
        low: '자원관리 기본 이론(시간관리, 예산편성, 인력배치)부터 학습이 필요합니다.',
        tips: ['아이젠하워 매트릭스 개념 숙지', '예산 편성/집행/결산 프로세스 이해', '제약조건 만족 여부 체크리스트 활용']
      },
      '정보능력': {
        high: '정보 처리 및 분석 능력이 우수합니다. 보안 판단도 정확합니다.',
        mid: '기본 컴퓨터 활용은 가능하나 데이터 분석, 정보보안 판단에서 보완이 필요합니다.',
        low: '정보 활용 기초(스프레드시트 함수, 개인정보 보호, 정보보안 기본)부터 학습하세요.',
        tips: ['엑셀 기본 함수(SUM, AVERAGE, VLOOKUP) 숙지', '개인정보 보호법 기본 개념', '정보보안 이상행위 패턴 학습']
      },
      '조직이해능력': {
        high: '조직 구조와 업무 프로세스에 대한 이해가 깊습니다.',
        mid: '기본 조직 이론은 이해하나 프로세스 개선, 조직 분석에서 보완이 필요합니다.',
        low: '조직 구조(라인/스태프/매트릭스), 경영 기초, 업무 프로세스 개념 학습이 필요합니다.',
        tips: ['조직 유형별 특성 비교 정리', '프로세스 개선(병행처리, 단축) 계산 연습', 'PDCA 사이클 이해']
      }
    };
  }

  /**
   * 전체 진단 수행
   */
  diagnose(evaluationResult, extractedData) {
    this._emit('info', '진단 시작...');

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

    this._emit('success', '진단 완료');

    return {
      areaDiagnosis,
      weakestArea,
      overallDiagnosis,
      recommendations,
      studyPlan
    };
  }

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
          estimatedQuestions: Math.ceil((80 - stats.rate) / 5) // 5점당 약 1문제 연습
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
