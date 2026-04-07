/**
 * DB 시드 스크립트 — questions.js 데이터를 SQLite로 마이그레이션
 * 실행: node data/seed.js
 */

const { NcsDatabase } = require('./database');
const { QUESTIONS } = require('./questions');

const db = new NcsDatabase();

console.log('═══ NCS 문제은행 DB 마이그레이션 시작 ═══\n');

// 기존 문제 일괄 등록
const count = db.bulkInsertQuestions(QUESTIONS);
console.log(`✓ ${count}개 문제 DB에 등록 완료`);

// 기본 기업 프리셋 등록
const presets = [
  {
    companyName: '일반행정 (표준)',
    description: 'NCS 직업기초능력 일반행정 표준 출제 비율',
    areaWeights: { '의사소통능력': 30, '수리능력': 30, '문제해결능력': 25, '자원관리능력': 5, '정보능력': 5, '조직이해능력': 5 },
    levelDist: { beginner: 30, intermediate: 50, advanced: 20 },
    typeDist: { '피듈형': 40, 'PSAT형': 35, '모듈형': 25 },
    totalQuestions: 20,
    totalTime: 1800
  },
  {
    companyName: '한국전력공사',
    description: 'PSAT형 비중 높음, 수리/문제해결 강조',
    areaWeights: { '의사소통능력': 25, '수리능력': 35, '문제해결능력': 25, '자원관리능력': 5, '정보능력': 5, '조직이해능력': 5 },
    levelDist: { beginner: 20, intermediate: 40, advanced: 40 },
    typeDist: { 'PSAT형': 50, '피듈형': 30, '모듈형': 20 },
    totalQuestions: 25,
    totalTime: 2250
  },
  {
    companyName: '국민건강보험공단',
    description: '의사소통 비중 높음, 규정 해석 문제 다수',
    areaWeights: { '의사소통능력': 35, '수리능력': 25, '문제해결능력': 20, '자원관리능력': 10, '정보능력': 5, '조직이해능력': 5 },
    levelDist: { beginner: 30, intermediate: 50, advanced: 20 },
    typeDist: { '피듈형': 50, 'PSAT형': 30, '모듈형': 20 },
    totalQuestions: 20,
    totalTime: 1800
  },
  {
    companyName: '한국수자원공사',
    description: '자원관리·조직이해 비중 높음',
    areaWeights: { '의사소통능력': 25, '수리능력': 25, '문제해결능력': 20, '자원관리능력': 15, '정보능력': 5, '조직이해능력': 10 },
    levelDist: { beginner: 25, intermediate: 50, advanced: 25 },
    typeDist: { '피듈형': 40, 'PSAT형': 35, '모듈형': 25 },
    totalQuestions: 20,
    totalTime: 1800
  }
];

for (const p of presets) {
  db.addCompanyPreset(p);
}
console.log(`✓ ${presets.length}개 기업 프리셋 등록 완료`);

// 통계 출력
const stats = db.getQuestionStats();
console.log(`\n═══ DB 통계 ═══`);
console.log(`총 문제 수: ${stats.total}`);
console.log(`영역별:`, stats.byArea.map(r => `${r.area}(${r.cnt})`).join(', '));
console.log(`난이도별:`, stats.byLevel.map(r => `${r.level}(${r.cnt})`).join(', '));
console.log(`유형별:`, stats.byType.map(r => `${r.type}(${r.cnt})`).join(', '));

db.close();
console.log('\n✓ 마이그레이션 완료!');
