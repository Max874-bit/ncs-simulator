const express = require('express');
const path = require('path');
const { Orchestrator } = require('./agents/Orchestrator');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── 오케스트레이터 (에이전트 총괄) ───
const orchestrator = new Orchestrator();

// ═══════════════════════════════════════
//  API 라우트
// ═══════════════════════════════════════

/**
 * 시험 생성
 * Pipeline: QuestionFetchAgent → 문제 수집 → 시험 구성
 */
app.post('/api/exam/generate', (req, res) => {
  try {
    const { level, questionCount = 20 } = req.body;
    const result = orchestrator.generateExam({ level, questionCount });

    if (!result.questions || result.questions.length === 0) {
      return res.status(400).json({ error: '조건에 맞는 문제가 없습니다. 난이도나 문제 수를 조정해 주세요.' });
    }
    res.json(result);
  } catch (err) {
    console.error('시험 생성 오류:', err);
    res.status(500).json({ error: '시험 생성 중 오류가 발생했습니다.' });
  }
});

/**
 * 답안 제출 & 채점 & AI 진단
 * Pipeline: AnswerExtractAgent → EvaluationAgent → DiagnosisAgent → QuestionFetchAgent
 */
app.post('/api/exam/submit', (req, res) => {
  try {
    const { examId, answers, timeSpent } = req.body;

    if (!examId || !answers) {
      return res.status(400).json({ error: '시험 ID와 답안 데이터가 필요합니다.' });
    }

    const result = orchestrator.submitAndAnalyze(examId, answers, timeSpent);

    if (result.error) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('채점 오류:', err);
    res.status(500).json({ error: '채점 처리 중 오류가 발생했습니다.' });
  }
});

/**
 * 공공데이터 API 소스 목록
 */
app.get('/api/external-sources', (req, res) => {
  res.json({ sources: orchestrator.getApiSources() });
});

/**
 * 에이전트 상태 조회
 */
app.get('/api/agents/status', (req, res) => {
  res.json(orchestrator.getStatus());
});

/**
 * 시험 이력 조회
 */
app.get('/api/exam/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const history = orchestrator.getExamHistory(limit);
    res.json({ history });
  } catch (err) {
    console.error('이력 조회 오류:', err);
    res.status(500).json({ error: '이력 조회 중 오류가 발생했습니다.' });
  }
});

/**
 * 시험 상세 조회
 */
app.get('/api/exam/detail/:examId', (req, res) => {
  try {
    const detail = orchestrator.getExamDetail(req.params.examId);
    if (!detail) return res.status(404).json({ error: '시험을 찾을 수 없습니다.' });
    res.json(detail);
  } catch (err) {
    res.status(500).json({ error: '상세 조회 오류' });
  }
});

/**
 * 영역별 누적 정답률
 */
app.get('/api/stats/area-accuracy', (req, res) => {
  try {
    res.json({ accuracy: orchestrator.getAreaAccuracy() });
  } catch (err) {
    res.status(500).json({ error: '통계 조회 오류' });
  }
});

/**
 * 성적 추이
 */
app.get('/api/stats/score-trend', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    res.json({ trend: orchestrator.getScoreTrend(limit) });
  } catch (err) {
    res.status(500).json({ error: '추이 조회 오류' });
  }
});

/**
 * 문제 통계
 */
app.get('/api/stats/questions', (req, res) => {
  try {
    res.json(orchestrator.getQuestionStats());
  } catch (err) {
    res.status(500).json({ error: '통계 조회 오류' });
  }
});

/**
 * 기업 프리셋 목록
 */
app.get('/api/presets', (req, res) => {
  try {
    res.json({ presets: orchestrator.getCompanyPresets() });
  } catch (err) {
    res.status(500).json({ error: '프리셋 조회 오류' });
  }
});

// ═══════════════════════════════════════
//  서버 시작
// ═══════════════════════════════════════
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║   NCS 시험 시뮬레이터 — 멀티 에이전트    ║');
  console.log('  ╠══════════════════════════════════════════╣');
  console.log('  ║                                          ║');
  console.log(`  ║   http://localhost:${PORT}                  ║`);
  console.log('  ║                                          ║');
  console.log('  ║   에이전트 구성:                          ║');
  console.log('  ║   1. QuestionFetchAgent  — 문제 수집     ║');
  console.log('  ║   2. AnswerExtractAgent  — 답안 추출     ║');
  console.log('  ║   3. EvaluationAgent     — 시험 평가     ║');
  console.log('  ║   4. DiagnosisAgent      — AI 진단       ║');
  console.log('  ║   + Orchestrator         — 총괄 제어     ║');
  console.log('  ║                                          ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
});
