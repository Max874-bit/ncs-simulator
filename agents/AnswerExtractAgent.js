/**
 * ═══════════════════════════════════════════════════
 *  Agent 2: AnswerExtractAgent (답안 추출 에이전트)
 * ═══════════════════════════════════════════════════
 *
 *  역할: 제출된 답안지에서 답만 추출, 정답 대조표와 매칭
 *  입력: { userAnswers[], answerKey[] }
 *  출력: { extractedResults[], correctCount, totalCount }
 */

class AnswerExtractAgent {
  constructor() {
    this.name = 'AnswerExtractAgent';
    this.log = [];
  }

  /**
   * 답안 추출 및 정답 대조
   * @param {number[]} userAnswers - 사용자 답안 배열 (0~3, -1은 미응답)
   * @param {object[]} answerKey - 정답 키 배열
   * @returns {object} 추출 결과
   */
  extract(userAnswers, answerKey) {
    this._emit('info', `답안 추출 시작: ${userAnswers.length}문항`);

    const results = [];
    let correctCount = 0;
    let unansweredCount = 0;
    const areaRaw = {};

    for (let i = 0; i < answerKey.length; i++) {
      const key = answerKey[i];
      const userAnswer = i < userAnswers.length ? userAnswers[i] : -1;
      const isUnanswered = userAnswer === -1;
      const isCorrect = !isUnanswered && userAnswer === key.answer;

      if (isCorrect) correctCount++;
      if (isUnanswered) unansweredCount++;

      // 영역별 원시 데이터 수집
      if (!areaRaw[key.area]) {
        areaRaw[key.area] = { total: 0, correct: 0, wrong: [], unanswered: 0, subAreas: {} };
      }
      areaRaw[key.area].total++;
      if (isCorrect) {
        areaRaw[key.area].correct++;
      } else {
        if (isUnanswered) areaRaw[key.area].unanswered++;
        areaRaw[key.area].wrong.push(key.id);

        // 세부영역별 오답 카운트
        if (!areaRaw[key.area].subAreas[key.subArea]) {
          areaRaw[key.area].subAreas[key.subArea] = 0;
        }
        areaRaw[key.area].subAreas[key.subArea]++;
      }

      results.push({
        index: i,
        questionId: key.id,
        area: key.area,
        subArea: key.subArea,
        level: key.level,
        keywords: key.keywords,
        userAnswer,
        correctAnswer: key.answer,
        isCorrect,
        isUnanswered,
        explanation: key.explanation
      });
    }

    const score = Math.round((correctCount / answerKey.length) * 100);

    this._emit('success', `답안 추출 완료: ${correctCount}/${answerKey.length} 정답 (${score}점), 미응답 ${unansweredCount}`);

    return {
      results,
      correctCount,
      totalCount: answerKey.length,
      unansweredCount,
      score,
      areaRaw
    };
  }

  /**
   * 오답만 추출
   */
  extractWrongAnswers(extractedResults) {
    const wrong = extractedResults.filter(r => !r.isCorrect);
    this._emit('info', `오답 ${wrong.length}개 추출`);
    return wrong;
  }

  /**
   * 영역별 오답 키워드 추출
   */
  extractWeakKeywords(extractedResults) {
    const keywords = [];
    for (const r of extractedResults) {
      if (!r.isCorrect && r.keywords) {
        keywords.push(...r.keywords);
      }
    }
    // 빈도순 정렬
    const freq = {};
    keywords.forEach(k => { freq[k] = (freq[k] || 0) + 1; });
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);

    this._emit('info', `약점 키워드 ${sorted.length}개 추출: ${sorted.slice(0, 5).map(([k]) => k).join(', ')}`);
    return sorted.map(([keyword, count]) => ({ keyword, count }));
  }

  _emit(level, message) {
    this.log.push({ agent: this.name, level, message, timestamp: new Date().toISOString() });
  }

  getLog() { return this.log; }
  clearLog() { this.log = []; }
}

module.exports = { AnswerExtractAgent };
