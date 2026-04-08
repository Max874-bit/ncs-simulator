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
    description: 'NCS 직업기초능력 일반행정 표준 출제 비율 (2025~2026 트렌드 반영)',
    areaWeights: { '의사소통능력': 25, '수리능력': 25, '문제해결능력': 20, '자원관리능력': 8, '정보능력': 7, '조직이해능력': 5, '자기개발능력': 3, '대인관계능력': 3, '기술능력': 2, '직업윤리': 2 },
    levelDist: { beginner: 25, intermediate: 50, advanced: 25 },
    typeDist: { 'PSAT형': 61, '피듈형': 28, '모듈형': 11 },
    totalQuestions: 20,
    totalTime: 1800
  },
  {
    companyName: '한국전력공사 (KEPCO)',
    description: 'PSAT형 고비중, 수리·문제해결 강조, 고난도 논리추론 다수',
    areaWeights: { '의사소통능력': 20, '수리능력': 30, '문제해결능력': 25, '자원관리능력': 8, '정보능력': 7, '조직이해능력': 5, '직업윤리': 5 },
    levelDist: { beginner: 15, intermediate: 40, advanced: 45 },
    typeDist: { 'PSAT형': 70, '피듈형': 20, '모듈형': 10 },
    totalQuestions: 25,
    totalTime: 2250
  },
  {
    companyName: '국민건강보험공단',
    description: '의사소통·자원관리 비중 높음, 규정 해석·법령 적용 문제 다수',
    areaWeights: { '의사소통능력': 30, '수리능력': 20, '문제해결능력': 15, '자원관리능력': 12, '정보능력': 5, '조직이해능력': 8, '직업윤리': 10 },
    levelDist: { beginner: 25, intermediate: 50, advanced: 25 },
    typeDist: { '피듈형': 45, 'PSAT형': 40, '모듈형': 15 },
    totalQuestions: 20,
    totalTime: 1800
  },
  {
    companyName: '한국수자원공사 (K-water)',
    description: '자원관리·조직이해 비중 높음, 모듈형 출제 비중 상대적 높음',
    areaWeights: { '의사소통능력': 20, '수리능력': 20, '문제해결능력': 18, '자원관리능력': 15, '정보능력': 7, '조직이해능력': 10, '기술능력': 5, '직업윤리': 5 },
    levelDist: { beginner: 25, intermediate: 50, advanced: 25 },
    typeDist: { '피듈형': 35, 'PSAT형': 40, '모듈형': 25 },
    totalQuestions: 20,
    totalTime: 1800
  },
  {
    companyName: '한국토지주택공사 (LH)',
    description: 'PSAT형 중심, 수리능력·문제해결 고비중, 직무수행능력 포함',
    areaWeights: { '의사소통능력': 20, '수리능력': 25, '문제해결능력': 20, '자원관리능력': 10, '정보능력': 5, '조직이해능력': 5, '직무수행능력': 15 },
    levelDist: { beginner: 20, intermediate: 45, advanced: 35 },
    typeDist: { 'PSAT형': 65, '피듈형': 25, '모듈형': 10 },
    totalQuestions: 25,
    totalTime: 2250
  },
  {
    companyName: '국민연금공단',
    description: '의사소통·수리 균형, 직업윤리 비중 높음, 피듈형 중심',
    areaWeights: { '의사소통능력': 25, '수리능력': 25, '문제해결능력': 15, '자원관리능력': 10, '정보능력': 5, '조직이해능력': 5, '직업윤리': 10, '대인관계능력': 5 },
    levelDist: { beginner: 30, intermediate: 50, advanced: 20 },
    typeDist: { '피듈형': 50, 'PSAT형': 35, '모듈형': 15 },
    totalQuestions: 20,
    totalTime: 1800
  },
  {
    companyName: '인천국제공항공사',
    description: 'PSAT형 고비중, 영어 지문 포함 가능, 고난도 수리·논리',
    areaWeights: { '의사소통능력': 25, '수리능력': 30, '문제해결능력': 25, '자원관리능력': 5, '정보능력': 5, '조직이해능력': 5, '직업윤리': 5 },
    levelDist: { beginner: 10, intermediate: 40, advanced: 50 },
    typeDist: { 'PSAT형': 75, '피듈형': 15, '모듈형': 10 },
    totalQuestions: 25,
    totalTime: 2250
  },
  {
    companyName: '한국도로공사',
    description: '수리·자원관리 강조, 직무수행능력(일반행정) 포함',
    areaWeights: { '의사소통능력': 20, '수리능력': 25, '문제해결능력': 15, '자원관리능력': 12, '정보능력': 5, '조직이해능력': 8, '직무수행능력': 10, '직업윤리': 5 },
    levelDist: { beginner: 20, intermediate: 50, advanced: 30 },
    typeDist: { 'PSAT형': 55, '피듈형': 30, '모듈형': 15 },
    totalQuestions: 20,
    totalTime: 1800
  },
  {
    companyName: '한국가스공사 (KOGAS)',
    description: '기술능력 포함, PSAT형 중심, 안전·기술 관련 문제 출제',
    areaWeights: { '의사소통능력': 20, '수리능력': 25, '문제해결능력': 20, '자원관리능력': 8, '정보능력': 7, '기술능력': 10, '조직이해능력': 5, '직업윤리': 5 },
    levelDist: { beginner: 20, intermediate: 45, advanced: 35 },
    typeDist: { 'PSAT형': 60, '피듈형': 25, '모듈형': 15 },
    totalQuestions: 25,
    totalTime: 2250
  },
  {
    companyName: '근로복지공단',
    description: '의사소통·직업윤리 비중 높음, 법령·규정 해석 다수',
    areaWeights: { '의사소통능력': 30, '수리능력': 20, '문제해결능력': 15, '자원관리능력': 8, '정보능력': 5, '조직이해능력': 7, '직업윤리': 10, '대인관계능력': 5 },
    levelDist: { beginner: 30, intermediate: 50, advanced: 20 },
    typeDist: { '피듈형': 45, 'PSAT형': 35, '모듈형': 20 },
    totalQuestions: 20,
    totalTime: 1800
  },
  {
    companyName: '한국철도공사 (코레일)',
    description: '수리·문제해결 중심, 자원관리·조직이해 비중 있음',
    areaWeights: { '의사소통능력': 20, '수리능력': 25, '문제해결능력': 20, '자원관리능력': 10, '정보능력': 5, '조직이해능력': 8, '기술능력': 7, '직업윤리': 5 },
    levelDist: { beginner: 20, intermediate: 50, advanced: 30 },
    typeDist: { 'PSAT형': 55, '피듈형': 30, '모듈형': 15 },
    totalQuestions: 25,
    totalTime: 2250
  },
  {
    companyName: '서울교통공사',
    description: '피듈형 중심, 의사소통·대인관계·직업윤리 강조',
    areaWeights: { '의사소통능력': 25, '수리능력': 20, '문제해결능력': 15, '자원관리능력': 8, '정보능력': 5, '대인관계능력': 10, '조직이해능력': 7, '직업윤리': 10 },
    levelDist: { beginner: 30, intermediate: 50, advanced: 20 },
    typeDist: { '피듈형': 50, 'PSAT형': 30, '모듈형': 20 },
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
