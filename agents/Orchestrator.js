/**
 * ═══════════════════════════════════════════════════════════
 *  Orchestrator (오케스트레이터 - 에이전트 총괄 제어)
 * ═══════════════════════════════════════════════════════════
 *
 *  4개 에이전트를 파이프라인으로 조율:
 *
 *  [시험 생성]  QuestionFetchAgent → 클라이언트
 *  [답안 제출]  AnswerExtractAgent → EvaluationAgent → DiagnosisAgent
 *               → QuestionFetchAgent (보강 문제 수집)
 *
 *  각 에이전트는 독립적으로 동작하며,
 *  오케스트레이터가 데이터 흐름을 관리합니다.
 */

const { QuestionFetchAgent } = require('./QuestionFetchAgent');
const { AnswerExtractAgent } = require('./AnswerExtractAgent');
const { EvaluationAgent } = require('./EvaluationAgent');
const { DiagnosisAgent } = require('./DiagnosisAgent');
const { NcsDatabase } = require('../data/database');

class Orchestrator {
  constructor() {
    this.db = new NcsDatabase();
    this.questionAgent = new QuestionFetchAgent(this.db);
    this.answerAgent = new AnswerExtractAgent();
    this.evalAgent = new EvaluationAgent();
    this.diagAgent = new DiagnosisAgent();

    // 진행 중인 시험 저장소
    this.activeExams = new Map();

    this.log = [];
    this._emit('info', '오케스트레이터 초기화 완료 — 4개 에이전트 준비됨');
  }

  /**
   * ═══ PIPELINE 1: 시험 생성 ═══
   * QuestionFetchAgent가 문제를 수집하고 시험을 구성
   */
  generateExam(options = {}) {
    this._emit('info', '═══ 시험 생성 파이프라인 시작 ═══');

    // Step 1: QuestionFetchAgent가 문제 수집
    this.questionAgent.clearLog();
    const examData = this.questionAgent.fetchFromLocalBank(options);

    // Step 2: 시험 세션 저장 (메모리 + DB)
    this.activeExams.set(examData.examId, {
      answerKey: examData.answerKey,
      questions: examData.questions,
      createdAt: new Date(),
      level: options.level || 'mixed'
    });

    try {
      this.db.createExamSession(examData.examId, options.level || 'mixed', examData.safeQuestions.length);
      // 출제 이력 기록 (중복 방지용)
      const questionIds = examData.questions.map(q => q.id);
      this.db.logExamQuestions(examData.examId, questionIds);
      this._emit('info', `시험 세션 DB 저장: ${examData.examId}`);
    } catch (e) {
      this._emit('warn', `DB 세션 저장 실패: ${e.message}`);
    }

    this._emit('success', `시험 생성 완료: ${examData.examId} (${examData.safeQuestions.length}문제)`);

    return {
      examId: examData.examId,
      totalTime: examData.totalTime,
      questions: examData.safeQuestions,
      agentLog: this.questionAgent.getLog()
    };
  }

  /**
   * ═══ PIPELINE 2: 답안 제출 → 채점 → 진단 ═══
   * AnswerExtractAgent → EvaluationAgent → DiagnosisAgent → QuestionFetchAgent
   */
  submitAndAnalyze(examId, userAnswers, timeSpent) {
    this._emit('info', '═══ 채점/진단 파이프라인 시작 ═══');

    // 시험 세션 확인
    const examSession = this.activeExams.get(examId);
    if (!examSession) {
      this._emit('error', `시험 ID ${examId}를 찾을 수 없음`);
      return { error: '시험 정보를 찾을 수 없습니다.' };
    }

    // 에이전트 로그 초기화
    this.answerAgent.clearLog();
    this.evalAgent.clearLog();
    this.diagAgent.clearLog();
    this.questionAgent.clearLog();

    // ─── Step 1: AnswerExtractAgent — 답안 추출 & 정답 대조 ───
    this._emit('info', '→ Step 1: AnswerExtractAgent 실행');
    const extracted = this.answerAgent.extract(userAnswers, examSession.answerKey);
    const wrongAnswers = this.answerAgent.extractWrongAnswers(extracted.results);
    const weakKeywords = this.answerAgent.extractWeakKeywords(extracted.results);

    // ─── Step 2: EvaluationAgent — 점수 산정 & 합격 판정 ───
    this._emit('info', '→ Step 2: EvaluationAgent 실행');
    const evaluation = this.evalAgent.evaluate(extracted);

    // ─── Step 3: DiagnosisAgent — AI 진단 & 보강 전략 ───
    this._emit('info', '→ Step 3: DiagnosisAgent 실행');
    const diagnosis = this.diagAgent.diagnose(evaluation, extracted);

    // ─── Step 4: QuestionFetchAgent — 보강 문제 수집 ───
    this._emit('info', '→ Step 4: QuestionFetchAgent (보강 문제 수집)');
    const weakAreas = diagnosis.recommendations.map(r => r.area);

    // 보강 추천에 실제 문제 연결
    for (const rec of diagnosis.recommendations) {
      const reinforcement = this.questionAgent.fetchReinforcementQuestions(
        [rec.area],
        weakKeywords.map(k => k.keyword),
        examSession.level === 'mixed' ? 'intermediate' : examSession.level
      );
      rec.recommendedQuestions = reinforcement.slice(0, 3).map(q => ({
        id: q.id,
        area: q.area,
        subArea: q.subArea,
        level: q.level,
        type: q.type,
        question: q.question.length > 80 ? q.question.substring(0, 80) + '...' : q.question,
        keywords: q.keywords
      }));
    }

    // 시험 세션 정리
    this.activeExams.delete(examId);

    // DB에 시험 결과 & 답안 저장
    try {
      const dbResult = {
        score: evaluation.score,
        correct: evaluation.correct,
        passStatus: evaluation.passStatus,
        passMessage: evaluation.passMessage,
        passPercentage: evaluation.passPercentage,
        timeSpent,
        overallDiagnosis: diagnosis.overallDiagnosis,
        areaAnalysis: diagnosis.areaDiagnosis,
        studyPlan: diagnosis.studyPlan
      };
      const dbAnswers = extracted.results.map(r => ({
        questionId: r.questionId,
        userAnswer: r.userAnswer,
        correctAnswer: r.correctAnswer,
        isCorrect: r.isCorrect,
        area: r.area,
        subArea: r.subArea,
        level: r.level
      }));
      this.db.saveExamResult(examId, dbResult, dbAnswers);
      this._emit('info', `시험 결과 DB 저장 완료: ${examId}`);
    } catch (e) {
      this._emit('warn', `DB 결과 저장 실패: ${e.message}`);
    }

    this._emit('success', '═══ 전체 파이프라인 완료 ═══');

    // 최종 결과 조합
    return {
      // 점수 & 판정
      score: evaluation.score,
      correct: evaluation.correct,
      total: evaluation.total,
      passStatus: evaluation.passStatus,
      passMessage: evaluation.passMessage,
      passPercentage: evaluation.passPercentage,
      timeSpent,

      // 상세 정오표
      details: extracted.results,

      // 영역별 분석 (진단 포함)
      areaAnalysis: diagnosis.areaDiagnosis,
      weakestArea: diagnosis.weakestArea,

      // 종합 진단
      overallDiagnosis: diagnosis.overallDiagnosis,

      // 보강 추천
      recommendations: diagnosis.recommendations,

      // 학습 계획
      studyPlan: diagnosis.studyPlan,

      // 에이전트 실행 로그 (디버깅/투명성)
      pipeline: {
        agents: [
          { name: 'AnswerExtractAgent', log: this.answerAgent.getLog() },
          { name: 'EvaluationAgent', log: this.evalAgent.getLog() },
          { name: 'DiagnosisAgent', log: this.diagAgent.getLog() },
          { name: 'QuestionFetchAgent', log: this.questionAgent.getLog() }
        ],
        orchestrator: this.log.slice(-10)
      }
    };
  }

  /**
   * API 소스 정보 조회
   */
  getApiSources() {
    return this.questionAgent.getApiSources();
  }

  /**
   * 에이전트 상태 조회
   */
  getStatus() {
    return {
      activeExams: this.activeExams.size,
      agents: {
        questionFetch: { name: 'QuestionFetchAgent', role: '문제 수집', status: 'ready' },
        answerExtract: { name: 'AnswerExtractAgent', role: '답안 추출', status: 'ready' },
        evaluation: { name: 'EvaluationAgent', role: '시험 평가', status: 'ready' },
        diagnosis: { name: 'DiagnosisAgent', role: 'AI 진단', status: 'ready' }
      }
    };
  }

  // ═══ DB 기반 데이터 조회 ═══

  /** 시험 이력 조회 */
  getExamHistory(limit = 20) {
    return this.db.getExamHistory(limit);
  }

  /** 시험 상세 조회 */
  getExamDetail(examId) {
    return this.db.getExamDetail(examId);
  }

  /** 영역별 누적 정답률 */
  getAreaAccuracy() {
    return this.db.getAreaAccuracy();
  }

  /** 성적 추이 */
  getScoreTrend(limit = 10) {
    return this.db.getScoreTrend(limit);
  }

  /** 문제 통계 */
  getQuestionStats() {
    return this.db.getQuestionStats();
  }

  /** 역량 진단 매트릭스 */
  getCompetencyMatrix() {
    return this.db.getCompetencyMatrix();
  }

  /** 기업 프리셋 목록 */
  getCompanyPresets() {
    return this.db.getCompanyPresets();
  }

  _emit(level, message) {
    this.log.push({ agent: 'Orchestrator', level, message, timestamp: new Date().toISOString() });
  }
}

module.exports = { Orchestrator };
