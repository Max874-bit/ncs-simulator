/**
 * 선택지 길이 편향 최종 수정
 * choices 배열의 선택지 순서를 swap하여 정답이 가장 긴 선택지가 아니도록 변경
 * 큰따옴표(") 형식 대응
 */
const fs = require('fs');
const qpath = require('path').resolve(__dirname, '../data/questions.js');
let content = fs.readFileSync(qpath, 'utf-8');
const { QUESTIONS } = require(qpath);

let fixCount = 0;

for (const q of QUESTIONS) {
  const lengths = q.choices.map(c => c.length);
  const maxLen = Math.max(...lengths);
  const answerLen = q.choices[q.answer].length;

  if (answerLen !== maxLen) continue;
  if (lengths.filter(l => l === maxLen).length !== 1) continue;

  const gap = answerLen - Math.max(...lengths.filter((_, i) => i !== q.answer));
  if (gap < 3) continue;

  // 가장 긴 오답 찾기
  let swapIdx = -1;
  let swapLen = 0;
  for (let i = 0; i < q.choices.length; i++) {
    if (i === q.answer) continue;
    if (q.choices[i].length > swapLen) {
      swapLen = q.choices[i].length;
      swapIdx = i;
    }
  }
  if (swapIdx === -1) continue;

  // 파일에서 해당 문제 블록 찾기
  const qMarker = 'id: "' + q.id + '"';
  const qIdx = content.indexOf(qMarker);
  if (qIdx === -1) continue;

  // choices 배열 시작/끝 찾기
  const choicesKeyword = content.indexOf('choices:', qIdx);
  if (choicesKeyword === -1 || choicesKeyword > qIdx + 2000) continue;

  const arrStart = content.indexOf('[', choicesKeyword);
  if (arrStart === -1) continue;

  let depth = 0, arrEnd = -1;
  for (let i = arrStart; i < arrStart + 3000 && i < content.length; i++) {
    if (content[i] === '[') depth++;
    if (content[i] === ']') { depth--; if (depth === 0) { arrEnd = i + 1; break; } }
  }
  if (arrEnd === -1) continue;

  const choicesBlock = content.substring(arrStart, arrEnd);

  // 각 선택지의 위치를 따옴표로 파싱
  const positions = [];
  let inStr = false, strChar = '', strStart = -1, escaped = false;

  for (let i = 0; i < choicesBlock.length; i++) {
    const ch = choicesBlock[i];

    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }

    if (!inStr && (ch === '"' || ch === "'" || ch === '`')) {
      inStr = true;
      strChar = ch;
      strStart = i;
    } else if (inStr && ch === strChar) {
      positions.push({ start: strStart, end: i + 1 });
      inStr = false;
    }
  }

  if (positions.length !== 4) continue;

  // swap 실행: answer 위치 ↔ swapIdx 위치
  const answerText = choicesBlock.substring(positions[q.answer].start, positions[q.answer].end);
  const swapText = choicesBlock.substring(positions[swapIdx].start, positions[swapIdx].end);

  let newBlock = choicesBlock;
  // 뒤쪽부터 교체 (인덱스 안 밀리게)
  const first = Math.min(q.answer, swapIdx);
  const second = Math.max(q.answer, swapIdx);
  const firstText = choicesBlock.substring(positions[first].start, positions[first].end);
  const secondText = choicesBlock.substring(positions[second].start, positions[second].end);

  newBlock = choicesBlock.substring(0, positions[second].start) +
             firstText +
             choicesBlock.substring(positions[second].end, choicesBlock.length);

  // 다시 계산 (두 번째가 바뀌었으므로 첫 번째 위치는 동일)
  newBlock = newBlock.substring(0, positions[first].start) +
             secondText +
             newBlock.substring(positions[first].start + firstText.length);

  // content에서 교체
  content = content.substring(0, arrStart) + newBlock + content.substring(arrEnd);

  // answer 값 교체 (현재 answer → swapIdx)
  const answerKeyword = content.indexOf('answer:', arrStart + newBlock.length);
  if (answerKeyword === -1 || answerKeyword > arrStart + newBlock.length + 200) continue;

  const answerLineEnd = content.indexOf(',', answerKeyword);
  if (answerLineEnd === -1) continue;

  const oldAnswerLine = content.substring(answerKeyword, answerLineEnd);
  const newAnswerLine = 'answer: ' + swapIdx;

  content = content.substring(0, answerKeyword) + newAnswerLine + content.substring(answerLineEnd);

  fixCount++;
}

fs.writeFileSync(qpath, content, 'utf-8');

// 검증
delete require.cache[require.resolve(qpath)];
const { QUESTIONS: Q2 } = require(qpath);

let bias = 0;
Q2.forEach(q => {
  const lengths = q.choices.map(c => c.length);
  const maxLen = Math.max(...lengths);
  const answerLen = q.choices[q.answer].length;
  if (answerLen === maxLen && lengths.filter(l => l === maxLen).length === 1) bias++;
});

const dist = [0, 0, 0, 0];
Q2.forEach(q => dist[q.answer]++);

console.log('Swapped:', fixCount);
console.log('Bias: ' + bias + '/' + Q2.length + ' (' + (bias / Q2.length * 100).toFixed(1) + '%)');
console.log('Answer dist:', dist.map((c, i) => i + ':' + c).join(', '));
console.log('Total:', Q2.length);

// 무결성
const bad = Q2.filter(q => q.answer < 0 || q.answer > 3 || !q.choices || q.choices.length !== 4);
console.log('Integrity:', bad.length === 0 ? 'PASSED' : 'FAILED - ' + bad.map(q => q.id).join(','));
