/**
 * ═══════════════════════════════════════════════════
 *  Agent 3: EvaluationAgent (시험 평가 에이전트)
 * ═══════════════════════════════════════════════════
 *
 *  역할: 점수 산정, 합격/불합격 판정, 영역별 등급 부여
 *  입력: AnswerExtractAgent의 출력
 *  출력: { score, passStatus, passPercentage, areaGrades }
 */

class EvaluationAgent {
  constructor() {
    this.name = 'EvaluationAgent';
    this.log = [];

    // 합격 기준선 설정 (일반행정 전형)
    this.thresholds = {
      highPass: 80,    // 상위권 합격
      pass: 60,        // 합격선
      borderline: 50,  // 경계선
    };

    // 등급 기준
    this.gradeThresholds = { A: 80, B: 60, C: 40 };
  }

  /**
   * 전체 평가 수행
   */
  evaluate(extractedData) {
    this._emit('info', `평가 시작: ${extractedData.totalCount}문항, 점수 ${extractedData.score}점`);

    const passResult = this._judgePass(extractedData.score);
    const passPercentage = this._calcPassPercentage(extractedData.score);
    const areaGrades = this._gradeAreas(extractedData.areaRaw);

    this._emit('success', `평가 완료: ${passResult.passStatus} (${passResult.passMessage})`);

    return {
      score: extractedData.score,
      correct: extractedData.correctCount,
      total: extractedData.totalCount,
      unanswered: extractedData.unansweredCount,
      ...passResult,
      passPercentage,
      areaGrades
    };
  }

  /**
   * 합격/불합격 판정
   */
  _judgePass(score) {
    if (score >= this.thresholds.highPass) {
      return { passStatus: 'high_pass', passMessage: '상위권 합격 가능' };
    }
    if (score >= this.thresholds.pass) {
      return { passStatus: 'pass', passMessage: '합격권 (안정권 진입을 위해 보강 필요)' };
    }
    if (score >= this.thresholds.borderline) {
      return { passStatus: 'borderline', passMessage: '합격 경계선 (집중 보강 필요)' };
    }
    return { passStatus: 'fail', passMessage: '불합격권 (기초부터 체계적 학습 필요)' };
  }

  /**
   * 합격 가능성 % 및 예상 등수 계산
   * (일반행정 NCS 시험 경쟁률 기반 시뮬레이션)
   */
  _calcPassPercentage(score) {
    const table = [
      { min: 90, pass: 95, rank: '상위 5%' },
      { min: 85, pass: 90, rank: '상위 10%' },
      { min: 80, pass: 82, rank: '상위 18%' },
      { min: 75, pass: 70, rank: '상위 30%' },
      { min: 70, pass: 55, rank: '상위 45%' },
      { min: 65, pass: 40, rank: '상위 60%' },
      { min: 60, pass: 25, rank: '상위 75%' },
      { min: 50, pass: 10, rank: '상위 90%' },
      { min: 0,  pass: 3,  rank: '하위권' }
    ];

    for (const t of table) {
      if (score >= t.min) return { pass: t.pass, rank: t.rank };
    }
    return { pass: 1, rank: '하위권' };
  }

  /**
   * 영역별 등급 부여
   */
  _gradeAreas(areaRaw) {
    const result = {};

    for (const [area, stats] of Object.entries(areaRaw)) {
      const rate = Math.round((stats.correct / stats.total) * 100);
      let grade;
      if (rate >= this.gradeThresholds.A) grade = 'A';
      else if (rate >= this.gradeThresholds.B) grade = 'B';
      else if (rate >= this.gradeThresholds.C) grade = 'C';
      else grade = 'D';

      const weakSubAreas = Object.entries(stats.subAreas)
        .sort((a, b) => b[1] - a[1])
        .map(([sub]) => sub);

      result[area] = {
        total: stats.total,
        correct: stats.correct,
        unanswered: stats.unanswered,
        rate,
        grade,
        weakSubAreas,
        wrongIds: stats.wrong
      };
    }

    return result;
  }

  _emit(level, message) {
    this.log.push({ agent: this.name, level, message, timestamp: new Date().toISOString() });
  }

  getLog() { return this.log; }
  clearLog() { this.log = []; }
}

module.exports = { EvaluationAgent };
