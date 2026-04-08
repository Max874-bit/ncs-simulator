/**
 * 정답 분포 재균형 스크립트
 * 0번이 많고 2/3번이 적음 → 일부 0번 정답을 2/3번으로 이동
 */
const fs = require('fs');
const qpath = require('path').resolve(__dirname, '../data/questions.js');
let content = fs.readFileSync(qpath, 'utf-8');
const { QUESTIONS } = require(qpath);

const target = Math.round(QUESTIONS.length / 4); // 70

// 0번→2번으로 이동할 문제 수: (84-70)=14개 중 8개를 2번으로, 6개를 3번으로
// 1번→2번: (77-70)=7개 중 4개를 2번, 3개를 3번으로

let moved02 = 0, moved03 = 0, moved12 = 0, moved13 = 0;

for (const q of QUESTIONS) {
  // 0번 → 2번 (8개 필요)
  if (q.answer === 0 && moved02 < 8) {
    const targetIdx = 2;
    if (swapInFile(q, targetIdx)) moved02++;
    continue;
  }
  // 0번 → 3번 (6개 필요)
  if (q.answer === 0 && moved03 < 6) {
    const targetIdx = 3;
    if (swapInFile(q, targetIdx)) moved03++;
    continue;
  }
  // 1번 → 2번 (4개 필요)
  if (q.answer === 1 && moved12 < 4) {
    const targetIdx = 2;
    if (swapInFile(q, targetIdx)) moved12++;
    continue;
  }
  // 1번 → 3번 (3개 필요)
  if (q.answer === 1 && moved13 < 3) {
    const targetIdx = 3;
    if (swapInFile(q, targetIdx)) moved13++;
    continue;
  }
}

function swapInFile(q, targetIdx) {
  const qMarker = 'id: "' + q.id + '"';
  const qIdx = content.indexOf(qMarker);
  if (qIdx === -1) return false;

  // choices 배열 찾기
  const choicesKey = content.indexOf('choices:', qIdx);
  if (choicesKey === -1 || choicesKey > qIdx + 2000) return false;

  const arrStart = content.indexOf('[', choicesKey);
  if (arrStart === -1) return false;

  let depth = 0, arrEnd = -1;
  for (let i = arrStart; i < arrStart + 4000 && i < content.length; i++) {
    if (content[i] === '[') depth++;
    if (content[i] === ']') { depth--; if (depth === 0) { arrEnd = i + 1; break; } }
  }
  if (arrEnd === -1) return false;

  const block = content.substring(arrStart, arrEnd);

  // 선택지 위치 파싱
  const positions = [];
  let inStr = false, strChar = '', strStart = -1, esc = false;
  for (let i = 0; i < block.length; i++) {
    const ch = block[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (!inStr && (ch === '"' || ch === "'" || ch === '`')) {
      inStr = true; strChar = ch; strStart = i;
    } else if (inStr && ch === strChar) {
      positions.push({ start: strStart, end: i + 1 }); inStr = false;
    }
  }
  if (positions.length !== 4) return false;

  const currentIdx = q.answer;
  const currentText = block.substring(positions[currentIdx].start, positions[currentIdx].end);
  const targetText = block.substring(positions[targetIdx].start, positions[targetIdx].end);

  // swap
  const first = Math.min(currentIdx, targetIdx);
  const second = Math.max(currentIdx, targetIdx);
  const firstPos = positions[first];
  const secondPos = positions[second];

  const firstText = block.substring(firstPos.start, firstPos.end);
  const secondText = block.substring(secondPos.start, secondPos.end);

  let newBlock = block.substring(0, secondPos.start) + firstText + block.substring(secondPos.end);
  // Recalculate first position (second was replaced, first is before it so unchanged)
  newBlock = newBlock.substring(0, firstPos.start) + secondText + newBlock.substring(firstPos.start + firstText.length);

  content = content.substring(0, arrStart) + newBlock + content.substring(arrEnd);

  // answer 값 변경
  const newArrEnd = arrStart + newBlock.length;
  const answerKey = content.indexOf('answer:', newArrEnd);
  if (answerKey === -1 || answerKey > newArrEnd + 200) return false;

  const commaAfter = content.indexOf(',', answerKey);
  if (commaAfter === -1) return false;

  content = content.substring(0, answerKey) + 'answer: ' + targetIdx + content.substring(commaAfter);

  return true;
}

fs.writeFileSync(qpath, content, 'utf-8');

// 검증
delete require.cache[require.resolve(qpath)];
const { QUESTIONS: Q2 } = require(qpath);

const dist = [0, 0, 0, 0];
Q2.forEach(q => dist[q.answer]++);
console.log('Moved: 0→2:' + moved02, '0→3:' + moved03, '1→2:' + moved12, '1→3:' + moved13);
console.log('Distribution:', dist.map((c, i) => i + ':' + c + '(' + (c / Q2.length * 100).toFixed(1) + '%)').join(', '));
console.log('Total:', Q2.length);

const bad = Q2.filter(q => q.answer < 0 || q.answer > 3);
console.log('Integrity:', bad.length === 0 ? 'PASSED' : 'FAILED');
