const fs = require('fs');
const path = require('path');

const WAKA_JSON_PATH = path.join(process.cwd(), 'waka.json');
const OUTPUT_SVG_PATH = path.join(process.cwd(), 'waka.svg');

if (!fs.existsSync(WAKA_JSON_PATH)) {
  console.error('waka.json not found!');
  process.exit(1);
}

const raw = fs.readFileSync(WAKA_JSON_PATH, 'utf-8');
const waka = JSON.parse(raw).data;

if (!waka || !waka.languages || waka.languages.length === 0 || waka.total_seconds === 0) {
  console.log('No coding activity found. Skipping SVG generation.');
  fs.writeFileSync(OUTPUT_SVG_PATH, '');
  process.exit(0);
}

const topLanguages = waka.languages
  .sort((a, b) => b.total_seconds - a.total_seconds)
  .slice(0, 5);

const width = 500;
const barHeight = 18;
const barSpacing = 10;
const paddingTop = 40;
const startDate = new Date(waka.start).toLocaleDateString();
const endDate = new Date(waka.end).toLocaleDateString();

const totalSecs = topLanguages.reduce((sum, l) => sum + l.total_seconds, 0);

// Begin SVG
let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${
  topLanguages.length * (barHeight + barSpacing) + paddingTop + 20
}" font-family="Arial, Helvetica, sans-serif">
  <rect width="100%" height="100%" fill="#000"/> <!-- Black background -->
  <text x="0" y="20" font-size="16" fill="#FFF">From ${startDate} → ${endDate}</text>`;

// Draw bars
topLanguages.forEach((lang, i) => {
  const y = paddingTop + i * (barHeight + barSpacing);
  const percent = lang.total_seconds / totalSecs;
  const barWidth = Math.round(percent * width);
  
  // Bar color white, slightly lighter gray for smaller bars if needed
  svgContent += `
  <text x="0" y="${y + 14}" font-size="14" fill="#FFF">${lang.name} (${Math.round(percent * 100)}%)</text>
  <rect x="0" y="${y + 20}" width="${barWidth}" height="${barHeight}" fill="#FFF" rx="3" ry="3" />`;
});

svgContent += `
</svg>`;

fs.writeFileSync(OUTPUT_SVG_PATH, svgContent);
console.log('SVG generated successfully at waka.svg (black-and-white)');
