const m = require('../data/questions.js');
const q = m.QUESTIONS;
const areas = ['직업윤리', '대인관계능력', '기술능력', '자기개발능력', '조직이해능력'];
const target = q.filter(x => areas.includes(x.area));
const enhanced = target.filter(x => x.explanation.includes('[정답]'));
const notEnhanced = target.filter(x => !x.explanation.includes('[정답]'));

console.log('대상 영역 총 문제:', target.length);
console.log('강화 완료:', enhanced.length);
console.log('미완료:', notEnhanced.length);

if (notEnhanced.length > 0) {
  console.log('\n--- 미강화 문제 샘플 ---');
  notEnhanced.slice(0, 10).forEach(x => {
    console.log(`  ${x.id} (${x.area}): ${x.explanation.substring(0, 80)}...`);
  });
}

// Show a sample of enhanced ones
console.log('\n--- 강화된 해설 샘플 ---');
enhanced.slice(0, 3).forEach(x => {
  console.log(`\n[${x.id}] (${x.area})`);
  console.log(x.explanation.substring(0, 200));
});
