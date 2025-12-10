// .github/actions/generate-waka-svg/generate-svg.js
const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt({
  html: true,
  breaks: true,
});

const WAKA_MD = path.join(process.cwd(), 'waka.md');
const OUT_SVG = path.join(process.cwd(), 'waka.svg');

// read markdown (if missing, bail)
if (!fs.existsSync(WAKA_MD)) {
  console.error('waka.md not found, exiting.');
  process.exit(1);
}

const mdContent = fs.readFileSync(WAKA_MD, 'utf8').trim();
const html = md.render(mdContent);

// basic inline CSS: tweak fonts, sizes, widths here
const width = 700; // target SVG width in px — tweak to fit your layout
const fontFamily = 'Inter, Roboto, -apple-system, system-ui, "Segoe UI", "Helvetica Neue", Arial';

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" viewBox="0 0 ${width} 1000">
  <style>
    .md-body { font-family: ${fontFamily}; font-size:14px; color: #222; }
    .md-body pre { white-space: pre-wrap; word-break: break-word; font-family: monospace; font-size:13px; }
    .md-body code { font-family: monospace; font-size:13px; }
    /* tweak table styles if waka outputs tables */
    .md-body table { border-collapse: collapse; }
    .md-body td, .md-body th { padding:4px 6px; }
  </style>

  <foreignObject x="0" y="0" width="${width}" height="1000">
    <div xmlns="http://www.w3.org/1999/xhtml" class="md-body">
      ${html}
    </div>
  </foreignObject>
</svg>`;

// Estimate height by counting lines; crude but okay — we'll let it be large enough and GitHub will render trimmed visuals.
fs.writeFileSync(OUT_SVG, svg);
console.log('waka.svg written');
