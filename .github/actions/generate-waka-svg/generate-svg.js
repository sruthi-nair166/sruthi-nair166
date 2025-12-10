const fs = require('fs');
const path = require('path');

const WAKA_JSON_PATH = path.join(process.cwd(), 'waka.json');
const OUTPUT_SVG_PATH = path.join(process.cwd(), 'waka.svg');

if (!fs.existsSync(WAKA_JSON_PATH)) {
  console.log('waka.json not found! Writing blank SVG.');
  fs.writeFileSync(OUTPUT_SVG_PATH, '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="100"></svg>');
  process.exit(0);
}

const raw = fs.readFileSync(WAKA_JSON_PATH, 'utf-8').trim();
if (!raw) {
  console.log('waka.json is empty. Writing blank SVG.');
  fs.writeFileSync(OUTPUT_SVG_PATH, '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="100"></svg>');
  process.exit(0);
}

let parsed;
try {
  parsed = JSON.parse(raw);
} catch (e) {
  console.error('Failed to parse waka.json — writing blank SVG.');
  fs.writeFileSync(OUTPUT_SVG_PATH, '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="100"></svg>');
  process.exit(0);
}

const waka = parsed.data;

if (!waka || !waka.languages || waka.languages.length === 0 || !waka.total_seconds || waka.total_seconds === 0) {
  console.log('No coding activity found. Writing blank SVG.');
  fs.writeFileSync(OUTPUT_SVG_PATH, '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="100"></svg>');
  process.exit(0);
}

const topLanguages = waka.languages
  .sort((a, b) => (b.total_seconds || 0) - (a.total_seconds || 0))
  .slice(0, 5);

const width = 600;
const leftColWidth = 260;
const barAreaWidth = width - leftColWidth - 20;
const barHeight = 14;
const barSpacing = 20;
const paddingTop = 60;

const startDate = waka.start ? new Date(waka.start).toLocaleDateString() : '';
const endDate = waka.end ? new Date(waka.end).toLocaleDateString() : '';
const humanRange = `From: ${startDate} — To: ${endDate}`;
const humanTotal = waka.human_readable_total || (() => {
  const secs = waka.total_seconds || 0;
  const hrs = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  return `${hrs} hrs ${mins} mins`;
})();

const contentHeight = paddingTop + topLanguages.length * (barHeight + barSpacing) + 30;
let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${contentHeight}" font-family="monospace">
  <rect width="100%" height="100%" fill="#000"/>
  <text x="0" y="22" font-size="16" font-weight="700" fill="#FFF">${escapeXml(humanRange)}</text>
  <text x="0" y="44" font-size="16" fill="#FFF">Total Time: ${escapeXml(humanTotal)}</text>
`;

const totalSecs = topLanguages.reduce((s, l) => s + (l.total_seconds || 0), 0) || 1;

topLanguages.forEach((lang, i) => {
  const yTop = paddingTop + i * (barHeight + barSpacing);
  const name = lang.name || 'Unknown';
  const secs = lang.total_seconds || 0;
  const percent = (secs / totalSecs) * 100;
  const barWidth = Math.round((secs / totalSecs) * barAreaWidth);

  // Left text: language name + time
  const hrs = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  const timeText = `${hrs} hrs ${mins} mins`;

  svgContent += `
    <text x="0" y="${yTop + 12}" font-size="14" fill="#FFF">${escapeXml(padRight(name, 18))}</text>
    <text x="140" y="${yTop + 12}" font-size="14" fill="#FFF">${escapeXml(timeText)}</text>
    
    <!-- dotted background bar -->
    <rect x="${leftColWidth}" y="${yTop}" width="${barAreaWidth}" height="${barHeight}" fill="#111" rx="3" ry="3"/>
    
    <!-- filled bar -->
    <rect x="${leftColWidth}" y="${yTop}" width="${barWidth}" height="${barHeight}" fill="#FFF" rx="3" ry="3"/>
    
    <!-- percent text -->
    <text x="${leftColWidth + barAreaWidth + 6}" y="${yTop + 12}" font-size="14" fill="#FFF">${percent.toFixed(2)} %</text>
  `;
});

svgContent += '</svg>';

fs.writeFileSync(OUTPUT_SVG_PATH, svgContent, 'utf8');
console.log('SVG generated successfully (black-and-white, dotted bars)');

function padRight(str, length) {
  str = String(str);
  if (str.length >= length) return str.slice(0, length - 1) + ' ';
  return str + ' '.repeat(length - str.length);
}

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe).replace(/[<>&'"]/g, c => {
    switch(c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
    }
  });
}
