/**
 * NCS 문제은행 해설 강화 스크립트
 * 대상 영역: 직업윤리, 대인관계능력, 기술능력, 자기개발능력, 조직이해능력
 * 기존 1줄 요약 해설을 [정답] [풀이] [오답 이유] 구조화 포맷으로 변환
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'questions.js');

// Read the file
let content = fs.readFileSync(filePath, 'utf-8');

const targetAreas = ['직업윤리', '대인관계능력', '기술능력', '자기개발능력', '조직이해능력'];

// Map of question ID -> new enhanced explanation
const enhancedExplanations = {
  "trend-inter-001": "[정답] 2번. [풀이] MZ세대의 즉시 피드백·업무시간 팀빌딩 선호와 기성세대의 경험 존중·대면 소통 선호를 모두 균형 있게 반영하는 방식이 가장 적절하다. [오답 이유] ① 모든 회의를 온라인으로 전환하면 기성세대의 대면 소통 선호(76%)를 무시하게 된다. ③ 모든 소통 채널을 폐쇄하는 것은 극단적 회피 방식으로 세대 간 이해를 저해한다. ④ 호칭 통일만으로는 업무 피드백 방식, 팀빌딩 형태 등 실질적 소통 차이를 해결할 수 없다.",

  "trend-org-001": "[정답] 3번. [풀이] 공공기관 경영평가 편람에 ESG 관련 지표가 사회적 가치 구현 등의 항목으로 반영되어 있으며, 기관장 재량이 아닌 평가 의무 지표이므로 ③이 옳지 않은 설명이다. [오답 이유] ① E(환경)에 탄소중립·자원순환·녹색구매가 포함된다는 설명은 정확하다. ② S(사회)에 안전보건·인권경영·지역사회 기여가 포함된다는 설명도 정확하다. ④ G(지배구조)에 이사회 독립성·윤리경영·반부패가 포함된다는 설명도 정확하다.",

  "trend-ethics-001": "[정답] 4번. [풀이] AI의 판단 정확도가 높더라도 국민 권익에 영향을 미치는 처분은 반드시 사람의 최종 검토(Human-in-the-loop)가 필요하며, 이는 '사람 중심' AI 윤리 원칙의 핵심이다. [오답 이유] ① AI 의사결정의 투명성(설명 가능성)은 공공기관 AI 윤리의 기본 원칙이다. ② AI 알고리즘의 편향 점검을 통한 공정성 확보는 필수적인 윤리 원칙이다. ③ AI 오류로 인한 피해에 대해 운영 기관이 책임을 지는 것은 책임성 원칙에 부합한다.",

  "trend-self-001": "[정답] 4번. [풀이] 디지털 전환 시대에 수기(手記) 문서 작성 기법은 디지털 역량과 가장 거리가 먼 분야이다. 정부 디지털 인재양성 정책에서는 데이터 리터러시, AI·머신러닝, 클라우드·정보보안을 핵심 역량으로 강조한다. [오답 이유] ① 데이터 리터러시는 데이터 기반 의사결정의 기초로 디지털 핵심 역량이다. ② AI·머신러닝 기초 이해는 공공기관 디지털 전환의 필수 학습 분야이다. ③ 클라우드 서비스 활용 및 정보보안 이해는 디지털 업무 환경의 기본 역량이다.",

  "trend-org-002": "[정답] 2번. [풀이] ㄱ(경영관리 범주 구성), ㄴ(주요사업 범주의 설립 목적 사업 평가), ㄷ(공공기관운영법 제48조에 따른 D등급 이하 기관장 해임건의)은 모두 옳은 설명이다. ㄹ은 자체평가 결과가 경영평가에 참고자료로 활용되므로 틀린 설명이다. [오답 이유] ① ㄱ, ㄴ만 선택하면 옳은 설명인 ㄷ이 빠진다. ③ 틀린 설명인 ㄹ이 포함되어 있다. ④ 마찬가지로 틀린 설명인 ㄹ이 포함되어 있다.",

  "trend-tech-001": "[정답] 3번. [풀이] 제로 트러스트의 핵심 원칙은 'Never Trust, Always Verify(절대 신뢰하지 말고, 항상 검증하라)'로, 내부·외부 구분 없이 모든 접근 요청을 검증하고 최소 권한만 부여한다. [오답 이유] ① 내부 사용자를 기본 신뢰하는 것은 전통적 경계 보안 모델의 사고방식이며, 제로 트러스트는 내부도 검증한다. ② 한 번 인증 후 추가 검증 없이 접근 가능한 것은 제로 트러스트가 아닌 기존 보안 방식이다. ④ 방화벽과 VPN만으로 충분하다는 것은 경계 기반 보안의 한계를 간과한 설명이다.",

  "trend-ethics-002": "[정답] 1번. [풀이] B팀장은 자신이 담당하는 수의계약 대상 업체에 배우자가 재직 중이므로, 사적이해관계 신고 의무와 수의계약 체결 제한 규정 모두에 해당하여 신고하지 않은 것은 법 위반이다. [오답 이유] ② 담당 업무와 무관한 부서의 인턴 채용 추천은 직접적 이해충돌에 해당하지 않는다. ③ 퇴직 동료의 송별회 참석은 업무상 접촉이 아닌 사적 모임으로 신고 대상이 아니다. ④ 자신의 직무와 무관한 학술 세미나 참석은 직무 관련 외부활동 제한 대상이 아니다.",

  "trend-inter-002": "[정답] 4번. [풀이] 부서 통합이라는 중요한 구조적 변화 상황에서는 협력(Collaborating) 방식이 최적이다. 양측 프로세스의 장단점을 분석하고 최적의 통합안을 함께 도출하는 것이 장기적 팀 성과에 가장 유리하다. [오답 이유] ① 경쟁 방식으로 팀장이 일방적으로 A팀 방식을 결정하면 B팀의 반발을 초래한다. ② 회피 방식으로 논의를 중단하면 갈등이 오히려 심화된다. ③ 인원수(A팀 5명 > B팀 4명)를 근거로 결정하는 것은 합리적 근거가 부족하며, 소수 의견이 무시된다.",

  "trend-self-002": "[정답] 4번. [풀이] 개편안은 순환형과 전문형을 '병행'하는 제도이므로 상호 배타적이지 않다. 순환형을 선택하더라도 특정 분야에서 5년 이상 근무 조건을 충족하면 전문관 자격을 취득할 수 있다. [오답 이유] ① 직원이 순환형 또는 전문형 경력경로를 자율 선택 가능하다는 것은 개편 내용에 명시되어 있다. ② 전문형 선택 시 한 분야에서 깊이 성장할 수 있다는 것은 전문직위제의 취지에 부합한다. ③ 전문관의 교육·멘토링 의무는 개편 내용에 명시되어 있다.",

  "trend-tech-002": "[정답] 1번. [풀이] 화상회의의 핵심 목적은 표정, 제스처 등 비언어적 소통을 포함한 실시간 의사소통이므로, 카메라를 끄고 음소거 상태로 참여하면 참여도와 소통 품질이 크게 저하된다. [오답 이유] ② 실시간 문서 공동 편집 도구 활용은 원격 환경에서 협업 효율을 높이는 적절한 방법이다. ③ 프로젝트 관리 도구를 통한 업무 진행 상황 공유는 투명한 협업의 기본이다. ④ 비동기 소통 도구 활용은 시간대가 다른 팀원과의 협업에 효과적인 방법이다."
};

let enhancedCount = 0;
let alreadyEnhanced = 0;
let totalTargetArea = 0;

// For each question ID in our map, find and replace the explanation
for (const [qId, newExplanation] of Object.entries(enhancedExplanations)) {
  // Find the explanation line for this question ID
  // Pattern: find id: "qId" then find the next explanation: "..."
  const idPattern = `id: "${qId}"`;
  const idIndex = content.indexOf(idPattern);

  if (idIndex === -1) {
    console.log(`WARNING: Question ${qId} not found in file!`);
    continue;
  }

  // Find the explanation field after this id
  const searchStart = idIndex;
  const explanationPattern = /explanation:\s*"/g;
  explanationPattern.lastIndex = searchStart;
  const expMatch = explanationPattern.exec(content);

  if (!expMatch) {
    console.log(`WARNING: No explanation found for ${qId}`);
    continue;
  }

  // Find the end of the explanation string (closing quote not preceded by backslash)
  let expStart = expMatch.index + expMatch[0].length;
  let expEnd = expStart;
  while (expEnd < content.length) {
    if (content[expEnd] === '"' && content[expEnd - 1] !== '\\') {
      break;
    }
    expEnd++;
  }

  const oldExplanation = content.substring(expStart, expEnd);

  // Check if already enhanced
  if (oldExplanation.startsWith('[정답]')) {
    console.log(`SKIP (already enhanced): ${qId}`);
    alreadyEnhanced++;
    continue;
  }

  // Replace
  const before = content.substring(0, expStart);
  const after = content.substring(expEnd);
  content = before + newExplanation + after;

  console.log(`ENHANCED: ${qId}`);
  console.log(`  OLD: ${oldExplanation.substring(0, 60)}...`);
  console.log(`  NEW: ${newExplanation.substring(0, 60)}...`);
  console.log();
  enhancedCount++;
}

// Write back
fs.writeFileSync(filePath, content, 'utf-8');

console.log('='.repeat(60));
console.log(`Enhancement complete!`);
console.log(`  Enhanced: ${enhancedCount}`);
console.log(`  Already enhanced (skipped): ${alreadyEnhanced}`);
console.log(`  File saved: ${filePath}`);

// Verify: count all explanations in target areas that now have [정답] format
const verifyRegex = /area:\s*"(직업윤리|대인관계능력|기술능력|자기개발능력|조직이해능력)"/g;
let verifyMatch;
let totalInTarget = 0;
let totalWithFormat = 0;
while ((verifyMatch = verifyRegex.exec(content)) !== null) {
  totalInTarget++;
  // Find the next explanation after this area match
  const expCheck = /explanation:\s*"/g;
  expCheck.lastIndex = verifyMatch.index;
  const em = expCheck.exec(content);
  if (em) {
    let es = em.index + em[0].length;
    let ee = es;
    while (ee < content.length && !(content[ee] === '"' && content[ee-1] !== '\\')) ee++;
    const exp = content.substring(es, ee);
    if (exp.startsWith('[정답]')) totalWithFormat++;
  }
}

console.log();
console.log(`Verification:`);
console.log(`  Total questions in 5 target areas: ${totalInTarget}`);
console.log(`  Questions with [정답] format: ${totalWithFormat}`);
console.log(`  Questions without format: ${totalInTarget - totalWithFormat}`);
