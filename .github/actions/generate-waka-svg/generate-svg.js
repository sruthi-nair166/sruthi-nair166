const fs = require('fs');
const path = require('path');

const WAKA_JSON_PATH = path.join(process.cwd(), 'waka.json');
const OUTPUT_SVG_PATH = path.join(process.cwd(), 'waka.svg');

// --- SAFEGUARD: handle missing/empty waka.json ---
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

// If no meaningful data, exit cleanly with empty svg
if (!waka || !waka.languages || waka.languages.length === 0 || !waka.total_seconds || waka.total_seconds === 0) {
  console.log('No coding activity found. Writing blank SVG.');
  fs.writeFileSync(OUTPUT_SVG_PATH, '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="100"></svg>');
  process.exit(0);
}

// Top 5 languages
const topLanguages = waka.languages
  .sort((a, b) => (b.total_seconds || 0) - (a.total_seconds || 0))
  .slice(0, 5);

// Basic measurements and layout
const width = 700;
const leftColWidth = 260; // space reserved for language name + time text
const barAreaWidth = width - leftColWidth - 20; // 20px right padding
const barCharCount = 28; // number of block chars per bar (█/░)
const lineHeight = 22;
const paddingTop = 60;
const barHeight = 14;
const barSpacing = 12;

const startDate = waka.start ? new Date(waka.start).toLocaleDateString() : '';
const endDate = waka.end ? new Date(waka.end).toLocaleDateString() : '';
const humanRange = waka.human_readable_range || `From: ${startDate} - To: ${endDate}`;
const humanTotal = waka.human_readable_total || (() => {
  const secs = waka.total_seconds || 0;
  const hrs = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  return `${hrs} hrs ${mins} mins`;
})();

const contentHeight = paddingTop + topLanguages.length * (lineHeight + barSpacing) + 30;
const svgHeader = `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${contentHeight}" font-family="monospace">\n` +
  `  <rect width="100%" height="100%" fill="#000" />\n` + // black background
  `  <g fill="#FFF" font-size="14">\n` +
  `    <text x="0" y="22" font-weight="700">From: ${escapeXml(humanRange.replace(/^From: */i, ''))}</text>\n` + // Date line
  `    <text x="0" y="44">Total Time: ${escapeXml(humanTotal)}</text>\n` +
  `  </g>\n`;

// compute total seconds across these top languages to scale percentages
const totalSecs = topLanguages.reduce((s, l) => s + (l.total_seconds || 0), 0) || 1;

// helper to format time like "859 hrs 29 mins" if available as human_readable; fallback to computed
function languageTimeText(lang) {
  if (lang.text) return lang.text; // some outputs provide 'text'
  const secs = lang.total_seconds || 0;
  const hrs = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  return `${hrs} hrs ${mins} mins`;
}

let svgBody = '';
// draw each language row: name + time text on left, dotted-bar background + white block characters on right, and percentage at far right
topLanguages.forEach((lang, i) => {
  const yTop = paddingTop + i * (lineHeight + barSpacing);
  const name = lang.name || 'Unknown';
  const timeText = languageTimeText(lang);
  const percent = ((lang.total_seconds || 0) / totalSecs) * 100;
  const percentText = `${percent.toFixed(2)} %`;

  // bar char string (█ for filled, ░ for empty)
  const filledCount = Math.round((lang.total_seconds || 0) / (totalSecs) * barCharCount);
  const filledStr = '█'.repeat(Math.max(0, filledCount));
  const emptyStr = '░'.repeat(Math.max(0, barCharCount - filledCount));
  const barChars = filledStr + emptyStr;

  // positions
  const textX = 0;
  const nameX = textX;
  const timeX = 140; // adjust so time sits after name
  const barX = leftColWidth; // where the bar area starts
  const percentX = barX + barAreaWidth + 6; // percent to the far right

  // background rectangle for bar area (slightly lighter than black)
  svgBody += `  <rect x="${barX}" y="${yTop + 6}" width="${barAreaWidth}" height="${barHeight}" fill="#111" rx="3" ry="3"/>\n`;

  // language name and time text (monospace)
  svgBody += `  <text x="${nameX}" y="${yTop + 16}" font-size="14" fill="#FFF">${escapeXml(padRight(name, 18))}</text>\n`;
  svgBody += `  <text x="${timeX}" y="${yTop + 16}" font-size="14" fill="#FFF">${escapeXml(timeText)}</text>\n`;

  // ASCII block chars overlay (white)
  // render as text so it scales cleanly and stays monospaced
  svgBody += `  <text x="${barX + 6}" y="${yTop + 16}" font-size="14" fill="#FFF">${escapeXml(barChars)}</text>\n`;

  // percentage text
  svgBody += `  <text x="${percentX}" y="${yTop + 16}" font-size="14" fill="#FFF">${escapeXml(percentText)}</text>\n`;
});

const svgFooter = `</svg>\n`;

const finalSvg = svgHeader + svgBody + svgFooter;
fs.writeFileSync(OUTPUT_SVG_PATH, finalSvg, 'utf8');
console.log('SVG generated successfully at waka.svg (black-and-white, ASCII bars)');

// --- helpers ---
function padRight(str, length) {
  // ensure fixed width for left column (approximate using characters)
  str = String(str);
  if (str.length >= length) return str.slice(0, length - 1) + ' ';
  return str + ' '.repeat(length - str.length);
}

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe).replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
    }
  });
}
