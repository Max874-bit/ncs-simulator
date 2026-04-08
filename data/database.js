/**
 * ═══════════════════════════════════════════════════
 *  NCS 시뮬레이터 — SQLite 데이터베이스 레이어
 * ═══════════════════════════════════════════════════
 *
 *  테이블 구조:
 *  1. questions       — 문제은행 (문제/보기/정답/해설)
 *  2. exam_sessions   — 시험 세션 기록
 *  3. exam_answers    — 각 시험의 개별 답안 기록
 *  4. question_tags   — 문제 태그 (트렌드, 출처 등)
 *  5. company_presets  — 기업별 출제 프리셋
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'ncs_simulator.db');

class NcsDatabase {
  constructor(dbPath = DB_PATH) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this._initTables();
  }

  // ═══════════════════════════════════════
  //  스키마 초기화
  // ═══════════════════════════════════════
  _initTables() {
    this.db.exec(`
      -- 문제은행
      CREATE TABLE IF NOT EXISTS questions (
        id            TEXT PRIMARY KEY,
        area          TEXT NOT NULL,
        sub_area      TEXT NOT NULL,
        level         TEXT NOT NULL CHECK(level IN ('beginner','intermediate','advanced')),
        type          TEXT NOT NULL,
        time_limit    INTEGER NOT NULL DEFAULT 90,
        question      TEXT NOT NULL,
        choices       TEXT NOT NULL,   -- JSON 배열
        answer        INTEGER NOT NULL,
        explanation   TEXT NOT NULL,
        keywords      TEXT,            -- JSON 배열
        source        TEXT DEFAULT 'local',
        year          INTEGER,
        company       TEXT,
        is_active     INTEGER DEFAULT 1,
        created_at    TEXT DEFAULT (datetime('now','localtime')),
        updated_at    TEXT DEFAULT (datetime('now','localtime'))
      );

      -- 문제 태그 (다대다)
      CREATE TABLE IF NOT EXISTS question_tags (
        question_id   TEXT NOT NULL,
        tag           TEXT NOT NULL,
        PRIMARY KEY (question_id, tag),
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      );

      -- 기업별 출제 프리셋
      CREATE TABLE IF NOT EXISTS company_presets (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name  TEXT NOT NULL UNIQUE,
        description   TEXT,
        area_weights  TEXT NOT NULL,   -- JSON: {"의사소통능력":35,"수리능력":30,...}
        level_dist    TEXT,            -- JSON: {"beginner":20,"intermediate":50,"advanced":30}
        type_dist     TEXT,            -- JSON: {"PSAT형":40,"피듈형":40,"모듈형":20}
        total_questions INTEGER DEFAULT 20,
        total_time    INTEGER DEFAULT 3600,
        is_active     INTEGER DEFAULT 1,
        created_at    TEXT DEFAULT (datetime('now','localtime'))
      );

      -- 시험 세션
      CREATE TABLE IF NOT EXISTS exam_sessions (
        exam_id       TEXT PRIMARY KEY,
        level         TEXT,
        question_count INTEGER NOT NULL,
        company_preset TEXT,
        score         REAL,
        correct_count INTEGER,
        pass_status   TEXT,
        pass_message  TEXT,
        pass_percentage TEXT,          -- JSON
        time_spent    INTEGER,
        overall_diagnosis TEXT,
        area_analysis TEXT,            -- JSON
        study_plan    TEXT,            -- JSON
        started_at    TEXT DEFAULT (datetime('now','localtime')),
        completed_at  TEXT
      );

      -- 개별 답안 기록
      CREATE TABLE IF NOT EXISTS exam_answers (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        exam_id       TEXT NOT NULL,
        question_id   TEXT NOT NULL,
        question_order INTEGER NOT NULL,
        user_answer   INTEGER NOT NULL DEFAULT -1,
        correct_answer INTEGER NOT NULL,
        is_correct    INTEGER NOT NULL DEFAULT 0,
        area          TEXT,
        sub_area      TEXT,
        level         TEXT,
        FOREIGN KEY (exam_id) REFERENCES exam_sessions(exam_id) ON DELETE CASCADE
      );

      -- 출제 이력 (중복 방지용 — 시험 생성 시점에 기록)
      CREATE TABLE IF NOT EXISTS exam_question_log (
        exam_id       TEXT NOT NULL,
        question_id   TEXT NOT NULL,
        PRIMARY KEY (exam_id, question_id)
      );

      -- 인덱스
      CREATE INDEX IF NOT EXISTS idx_q_area ON questions(area);
      CREATE INDEX IF NOT EXISTS idx_q_level ON questions(level);
      CREATE INDEX IF NOT EXISTS idx_q_active ON questions(is_active);
      CREATE INDEX IF NOT EXISTS idx_ea_exam ON exam_answers(exam_id);
      CREATE INDEX IF NOT EXISTS idx_es_date ON exam_sessions(started_at);
      CREATE INDEX IF NOT EXISTS idx_eql_qid ON exam_question_log(question_id);
    `);
  }

  // ═══════════════════════════════════════
  //  문제 CRUD
  // ═══════════════════════════════════════

  /** 문제 추가 (단건) */
  insertQuestion(q) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO questions
        (id, area, sub_area, level, type, time_limit, question, choices, answer, explanation, keywords, source, year, company)
      VALUES
        (@id, @area, @sub_area, @level, @type, @time_limit, @question, @choices, @answer, @explanation, @keywords, @source, @year, @company)
    `);
    stmt.run({
      id: q.id,
      area: q.area,
      sub_area: q.subArea,
      level: q.level,
      type: q.type,
      time_limit: q.timeLimit || 90,
      question: q.question,
      choices: JSON.stringify(q.choices),
      answer: q.answer,
      explanation: q.explanation,
      keywords: JSON.stringify(q.keywords || []),
      source: q.source || 'local',
      year: q.year || null,
      company: q.company || null
    });
  }

  /** 문제 일괄 추가 (트랜잭션) */
  bulkInsertQuestions(questions) {
    const insert = this.db.transaction((qs) => {
      for (const q of qs) {
        this.insertQuestion(q);
      }
    });
    insert(questions);
    return questions.length;
  }

  /** 전체 문제 조회 */
  getAllQuestions(onlyActive = true) {
    const where = onlyActive ? 'WHERE is_active = 1' : '';
    const rows = this.db.prepare(`SELECT * FROM questions ${where} ORDER BY area, level, id`).all();
    return rows.map(this._rowToQuestion);
  }

  /** 조건별 문제 조회 */
  getQuestions(filters = {}) {
    let sql = 'SELECT * FROM questions WHERE is_active = 1';
    const params = {};

    if (filters.level && filters.level !== 'mixed') {
      sql += ' AND level = @level';
      params.level = filters.level;
    }
    if (filters.area) {
      sql += ' AND area = @area';
      params.area = filters.area;
    }
    if (filters.areas && filters.areas.length) {
      const placeholders = filters.areas.map((_, i) => `@area${i}`);
      sql += ` AND area IN (${placeholders.join(',')})`;
      filters.areas.forEach((a, i) => { params[`area${i}`] = a; });
    }
    if (filters.company) {
      sql += ' AND (company = @company OR company IS NULL)';
      params.company = filters.company;
    }
    if (filters.type) {
      sql += ' AND type = @type';
      params.type = filters.type;
    }

    sql += ' ORDER BY area, level, RANDOM()';
    return this.db.prepare(sql).all(params).map(this._rowToQuestion);
  }

  /** 문제 수 통계 */
  getQuestionStats() {
    return {
      total: this.db.prepare('SELECT COUNT(*) as cnt FROM questions WHERE is_active=1').get().cnt,
      byArea: this.db.prepare('SELECT area, COUNT(*) as cnt FROM questions WHERE is_active=1 GROUP BY area').all(),
      byLevel: this.db.prepare('SELECT level, COUNT(*) as cnt FROM questions WHERE is_active=1 GROUP BY level').all(),
      byType: this.db.prepare('SELECT type, COUNT(*) as cnt FROM questions WHERE is_active=1 GROUP BY type').all()
    };
  }

  /** 문제 삭제 (soft delete) */
  deactivateQuestion(id) {
    this.db.prepare('UPDATE questions SET is_active = 0, updated_at = datetime("now","localtime") WHERE id = ?').run(id);
  }

  /** 문제 업데이트 */
  updateQuestion(id, fields) {
    const allowed = ['area', 'sub_area', 'level', 'type', 'time_limit', 'question', 'choices', 'answer', 'explanation', 'keywords', 'source', 'year', 'company'];
    const updates = [];
    const params = { id };

    for (const [key, val] of Object.entries(fields)) {
      if (allowed.includes(key)) {
        updates.push(`${key} = @${key}`);
        params[key] = (key === 'choices' || key === 'keywords') ? JSON.stringify(val) : val;
      }
    }
    if (updates.length === 0) return;
    updates.push('updated_at = datetime("now","localtime")');
    this.db.prepare(`UPDATE questions SET ${updates.join(', ')} WHERE id = @id`).run(params);
  }

  // ═══════════════════════════════════════
  //  시험 세션 & 답안 저장
  // ═══════════════════════════════════════

  /** 시험 세션 시작 기록 */
  createExamSession(examId, level, questionCount, companyPreset = null) {
    this.db.prepare(`
      INSERT INTO exam_sessions (exam_id, level, question_count, company_preset)
      VALUES (?, ?, ?, ?)
    `).run(examId, level || 'mixed', questionCount, companyPreset);
  }

  /** 시험 결과 저장 (채점 완료 후) */
  saveExamResult(examId, result, answers) {
    const saveAll = this.db.transaction(() => {
      // 세션 업데이트
      this.db.prepare(`
        UPDATE exam_sessions SET
          score = @score,
          correct_count = @correct,
          pass_status = @passStatus,
          pass_message = @passMessage,
          pass_percentage = @passPercentage,
          time_spent = @timeSpent,
          overall_diagnosis = @overallDiagnosis,
          area_analysis = @areaAnalysis,
          study_plan = @studyPlan,
          completed_at = datetime('now','localtime')
        WHERE exam_id = @examId
      `).run({
        examId,
        score: result.score,
        correct: result.correct,
        passStatus: result.passStatus,
        passMessage: result.passMessage,
        passPercentage: JSON.stringify(result.passPercentage),
        timeSpent: result.timeSpent,
        overallDiagnosis: result.overallDiagnosis,
        areaAnalysis: JSON.stringify(result.areaAnalysis),
        studyPlan: JSON.stringify(result.studyPlan)
      });

      // 개별 답안 저장
      const insertAnswer = this.db.prepare(`
        INSERT INTO exam_answers (exam_id, question_id, question_order, user_answer, correct_answer, is_correct, area, sub_area, level)
        VALUES (@examId, @questionId, @order, @userAnswer, @correctAnswer, @isCorrect, @area, @subArea, @level)
      `);

      for (let i = 0; i < answers.length; i++) {
        const a = answers[i];
        insertAnswer.run({
          examId,
          questionId: a.questionId,
          order: i + 1,
          userAnswer: a.userAnswer,
          correctAnswer: a.correctAnswer,
          isCorrect: a.isCorrect ? 1 : 0,
          area: a.area,
          subArea: a.subArea,
          level: a.level
        });
      }
    });
    saveAll();
  }

  /** 시험 이력 조회 */
  getExamHistory(limit = 20, offset = 0) {
    return this.db.prepare(`
      SELECT * FROM exam_sessions
      WHERE completed_at IS NOT NULL
      ORDER BY started_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);
  }

  /** 특정 시험 상세 조회 */
  getExamDetail(examId) {
    const session = this.db.prepare('SELECT * FROM exam_sessions WHERE exam_id = ?').get(examId);
    if (!session) return null;

    const answers = this.db.prepare(`
      SELECT ea.*, q.question, q.choices, q.explanation
      FROM exam_answers ea
      LEFT JOIN questions q ON ea.question_id = q.id
      ORDER BY ea.question_order
    `).all();

    return {
      ...session,
      pass_percentage: session.pass_percentage ? JSON.parse(session.pass_percentage) : null,
      area_analysis: session.area_analysis ? JSON.parse(session.area_analysis) : null,
      study_plan: session.study_plan ? JSON.parse(session.study_plan) : null,
      answers: answers.map(a => ({
        ...a,
        choices: a.choices ? JSON.parse(a.choices) : [],
        is_correct: !!a.is_correct
      }))
    };
  }

  /** 영역별 누적 정답률 */
  getAreaAccuracy() {
    return this.db.prepare(`
      SELECT area,
        COUNT(*) as total,
        SUM(is_correct) as correct,
        ROUND(SUM(is_correct) * 100.0 / COUNT(*), 1) as accuracy
      FROM exam_answers
      GROUP BY area
      ORDER BY accuracy ASC
    `).all();
  }

  /** 최근 성적 추이 */
  getScoreTrend(limit = 10) {
    return this.db.prepare(`
      SELECT exam_id, score, correct_count, question_count,
             pass_status, time_spent, started_at
      FROM exam_sessions
      WHERE completed_at IS NOT NULL
      ORDER BY started_at DESC
      LIMIT ?
    `).all(limit);
  }

  // ═══════════════════════════════════════
  //  기업 프리셋
  // ═══════════════════════════════════════

  /** 프리셋 추가 */
  addCompanyPreset(preset) {
    this.db.prepare(`
      INSERT OR REPLACE INTO company_presets
        (company_name, description, area_weights, level_dist, type_dist, total_questions, total_time)
      VALUES (@name, @desc, @areaWeights, @levelDist, @typeDist, @totalQ, @totalTime)
    `).run({
      name: preset.companyName,
      desc: preset.description || '',
      areaWeights: JSON.stringify(preset.areaWeights),
      levelDist: JSON.stringify(preset.levelDist || {}),
      typeDist: JSON.stringify(preset.typeDist || {}),
      totalQ: preset.totalQuestions || 20,
      totalTime: preset.totalTime || 3600
    });
  }

  /** 프리셋 목록 */
  getCompanyPresets() {
    return this.db.prepare('SELECT * FROM company_presets WHERE is_active = 1 ORDER BY company_name').all()
      .map(p => ({
        ...p,
        area_weights: JSON.parse(p.area_weights),
        level_dist: p.level_dist ? JSON.parse(p.level_dist) : null,
        type_dist: p.type_dist ? JSON.parse(p.type_dist) : null
      }));
  }

  // ═══════════════════════════════════════
  //  기출 이력 (중복 방지용)
  // ═══════════════════════════════════════

  /** 시험 생성 시 출제 문제 ID 기록 */
  logExamQuestions(examId, questionIds) {
    const insert = this.db.prepare(
      'INSERT OR IGNORE INTO exam_question_log (exam_id, question_id) VALUES (?, ?)'
    );
    const insertAll = this.db.transaction((ids) => {
      for (const qid of ids) insert.run(examId, qid);
    });
    insertAll(questionIds);
  }

  /** 최근 N회 시험에서 출제된 문제 ID 목록 (생성 시점 기준) */
  getRecentQuestionIds(recentExams = 5) {
    const rows = this.db.prepare(`
      SELECT DISTINCT eql.question_id
      FROM exam_question_log eql
      WHERE eql.exam_id IN (
        SELECT exam_id FROM exam_sessions
        ORDER BY started_at DESC LIMIT ?
      )
    `).all(recentExams);
    return rows.map(r => r.question_id);
  }

  /** 영역별·난이도별·유형별 정답률 매트릭스 */
  getCompetencyMatrix() {
    // 영역별 정답률
    const byArea = this.db.prepare(`
      SELECT area, level,
        COUNT(*) as total,
        SUM(is_correct) as correct,
        ROUND(SUM(is_correct) * 100.0 / COUNT(*), 1) as accuracy
      FROM exam_answers
      GROUP BY area, level
    `).all();

    // 영역별·유형별 정답률
    const byAreaType = this.db.prepare(`
      SELECT ea.area, q.type,
        COUNT(*) as total,
        SUM(ea.is_correct) as correct,
        ROUND(SUM(ea.is_correct) * 100.0 / COUNT(*), 1) as accuracy
      FROM exam_answers ea
      LEFT JOIN questions q ON ea.question_id = q.id
      WHERE q.type IS NOT NULL
      GROUP BY ea.area, q.type
    `).all();

    // 영역별·세부영역별 정답률
    const bySubArea = this.db.prepare(`
      SELECT area, sub_area,
        COUNT(*) as total,
        SUM(is_correct) as correct,
        ROUND(SUM(is_correct) * 100.0 / COUNT(*), 1) as accuracy
      FROM exam_answers
      WHERE sub_area IS NOT NULL AND sub_area != ''
      GROUP BY area, sub_area
    `).all();

    // 영역별 종합
    const areaSummary = this.db.prepare(`
      SELECT area,
        COUNT(*) as total,
        SUM(is_correct) as correct,
        ROUND(SUM(is_correct) * 100.0 / COUNT(*), 1) as accuracy
      FROM exam_answers
      GROUP BY area
      ORDER BY accuracy ASC
    `).all();

    // 최근 추이 (마지막 5회)
    const recentTrend = this.db.prepare(`
      SELECT es.exam_id, es.score, es.started_at,
        ea.area,
        COUNT(*) as total,
        SUM(ea.is_correct) as correct
      FROM exam_sessions es
      JOIN exam_answers ea ON es.exam_id = ea.exam_id
      WHERE es.completed_at IS NOT NULL
      GROUP BY es.exam_id, ea.area
      ORDER BY es.started_at DESC
    `).all();

    return { byArea, byAreaType, bySubArea, areaSummary, recentTrend };
  }

  // ═══════════════════════════════════════
  //  태그
  // ═══════════════════════════════════════

  addTag(questionId, tag) {
    this.db.prepare('INSERT OR IGNORE INTO question_tags (question_id, tag) VALUES (?, ?)').run(questionId, tag);
  }

  getTagsByQuestion(questionId) {
    return this.db.prepare('SELECT tag FROM question_tags WHERE question_id = ?').all(questionId).map(r => r.tag);
  }

  getQuestionsByTag(tag) {
    return this.db.prepare(`
      SELECT q.* FROM questions q
      JOIN question_tags t ON q.id = t.question_id
      WHERE t.tag = ? AND q.is_active = 1
    `).all(tag).map(this._rowToQuestion);
  }

  // ═══════════════════════════════════════
  //  유틸
  // ═══════════════════════════════════════

  _rowToQuestion(row) {
    return {
      id: row.id,
      area: row.area,
      subArea: row.sub_area,
      level: row.level,
      type: row.type,
      timeLimit: row.time_limit,
      question: row.question,
      choices: JSON.parse(row.choices),
      answer: row.answer,
      explanation: row.explanation,
      keywords: row.keywords ? JSON.parse(row.keywords) : [],
      source: row.source,
      year: row.year,
      company: row.company
    };
  }

  close() {
    this.db.close();
  }
}

module.exports = { NcsDatabase };
