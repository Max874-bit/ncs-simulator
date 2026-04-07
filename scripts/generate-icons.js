/**
 * PWA 아이콘 생성 스크립트
 * Canvas 없이 SVG → PNG 변환 (서버에서 동적 제공)
 */
const fs = require('fs');
const path = require('path');

const svgTemplate = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b5de7"/>
      <stop offset="100%" style="stop-color:#2a47c9"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
  <text x="50%" y="52%" text-anchor="middle" dominant-baseline="central"
        font-family="Arial,sans-serif" font-weight="900" font-size="${size * 0.28}"
        fill="white">NCS</text>
  <text x="50%" y="78%" text-anchor="middle" dominant-baseline="central"
        font-family="Arial,sans-serif" font-weight="600" font-size="${size * 0.12}"
        fill="rgba(255,255,255,0.8)">PREP</text>
</svg>`;

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

[192, 512].forEach(size => {
  const svg = svgTemplate(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.svg`), svg);
  console.log(`✓ icon-${size}.svg 생성`);
});

console.log('아이콘 생성 완료!');
