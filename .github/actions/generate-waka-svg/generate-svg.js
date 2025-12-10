const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt({
  html: false,
  breaks: false,
});

const mdFile = path.join(process.cwd(), 'waka.md');
if (!fs.existsSync(mdFile)) {
  console.error('waka.md not found — exiting');
  process.exit(1);
}
const content = fs.readFileSync(mdFile, 'utf-8').trim();

const width = 700;
const bg = '#0d1117';       // dark background (GitHub dark theme friendly)
const textColor = '#c9d1d9'; // light grey-ish (visible in dark or light)

function escapeXml(str) {
  return str.replace(/[<>&"]/g, c => {
    switch(c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
    }
  });
}

// If content is empty or only default 0 secs message
if (!content || /total time:\s*0\s*secs/i.test(content)) {
  const fallback = 'No coding data yet ✨';
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bg}"/>
  <text x="20" y="50" fill="${textColor}" font-family="monospace" font-size="24">${fallback}</text>
</svg>`;
  fs.writeFileSync('waka.svg', svg, 'utf8');
  process.exit(0);
}

// Render markdown to HTML-like but we’ll wrap in <pre> to preserve ascii formatting
const lines = content.split(/\r?\n/).map(escapeXml).join('\n');

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bg}"/>
  <foreignObject x="10" y="10" width="${width - 20}" height="2000">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:monospace; white-space:pre; color:${textColor}; line-height:1.2;">
${lines}
    </div>
  </foreignObject>
</svg>`;
fs.writeFileSync('waka.svg', svg, 'utf8');
console.log('waka.svg updated');
