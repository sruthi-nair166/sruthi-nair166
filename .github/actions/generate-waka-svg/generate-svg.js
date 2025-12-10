const fs = require("fs");

// Replace this with your actual WakaTime JSON
const wakaData = {
  data: {
    languages: [
      { name: "JavaScript", total_seconds: 4500 },
      { name: "HTML", total_seconds: 2700 },
      { name: "CSS", total_seconds: 1800 },
      { name: "Python", total_seconds: 900 },
    ],
    human_readable_total: "3 hrs 15 mins",
    human_readable_range: "From: 01 Dec 2025 - To: 10 Dec 2025"
  }
};

// Exit early if no data
if (!wakaData.data || !wakaData.data.languages || wakaData.data.languages.length === 0) {
  console.log("No WakaTime activity. SVG will not be generated.");
  process.exit(0);
}

// Top 5 languages
const languages = wakaData.data.languages.slice(0, 5);

// SVG layout
const barMaxWidth = 200;
const svgWidth = 400;
const svgHeight = 40 + languages.length * 30 + 20;
const paddingLeft = 10;

const maxSeconds = Math.max(...languages.map(l => l.total_seconds));

let svgContent = `
<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .bar { fill: #D326FF; }
    .text { font-family: monospace; font-size: 14px; fill: #000; }
  </style>
`;

// Date range at the top
svgContent += `<text x="${paddingLeft}" y="20" class="text">${wakaData.data.human_readable_range}</text>`;

// Draw bars
languages.forEach((lang, i) => {
  const width = Math.round((lang.total_seconds / maxSeconds) * barMaxWidth);
  const y = 40 + i * 30;
  svgContent += `
    <text x="${paddingLeft}" y="${y}" class="text">${lang.name} - ${Math.round(lang.total_seconds/3600)} hrs</text>
    <rect x="150" y="${y-12}" width="${width}" height="12" class="bar"/>
  `;
});

// Total time at the bottom
svgContent += `<text x="${paddingLeft}" y="${svgHeight - 10}" class="text">Total: ${wakaData.data.human_readable_total}</text>`;

svgContent += `</svg>`;

// Save SVG
fs.writeFileSync("waka.svg", svgContent);
console.log("waka.svg generated successfully!");
