import { siteMeta } from '$lib/config/site.js';

const WIDTH = 1200;
const HEIGHT = 630;

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function trimLine(value, max = 42) {
  const text = String(value || '').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function ogSvg({ title, eyebrow = siteMeta.name, description = siteMeta.description, footer = 'quizz-land' }) {
  const safeTitle = escapeXml(trimLine(title || siteMeta.name, 44));
  const safeEyebrow = escapeXml(trimLine(eyebrow, 56));
  const safeDescription = escapeXml(trimLine(description, 82));
  const safeFooter = escapeXml(trimLine(footer, 54));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${safeTitle}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#101726"/>
      <stop offset="0.5" stop-color="#0b1020"/>
      <stop offset="1" stop-color="#171e31"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#e53935"/>
      <stop offset="0.52" stop-color="#ffd54a"/>
      <stop offset="1" stop-color="#39d5ff"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <path d="M76 84h1048v462H76z" fill="none" stroke="#e6e8ef" stroke-opacity=".16" stroke-width="2"/>
  <path d="M76 164h1048" stroke="#e6e8ef" stroke-opacity=".12" stroke-width="2"/>
  <g transform="translate(94 104)">
    <rect width="58" height="48" rx="8" fill="url(#accent)"/>
    <text x="29" y="32" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="900" fill="#0b1020">QL</text>
  </g>
  <text x="172" y="136" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="900" fill="#ffd54a">${safeEyebrow}</text>
  <text x="94" y="276" font-family="Arial, Helvetica, sans-serif" font-size="82" font-weight="900" fill="#e6e8ef">${safeTitle}</text>
  <text x="98" y="344" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="800" fill="#c8cedc">${safeDescription}</text>
  <g transform="translate(96 416)">
    <rect width="300" height="58" rx="8" fill="#e53935"/>
    <text x="150" y="38" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="900" fill="#fff">Rejoindre la partie</text>
  </g>
  <g transform="translate(428 416)">
    <rect width="300" height="58" rx="8" fill="#e6e8ef"/>
    <text x="150" y="38" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="900" fill="#0b1020">${safeFooter}</text>
  </g>
  <g transform="translate(850 212)">
    <rect width="204" height="204" rx="22" fill="#ffd54a"/>
    <path d="M902 266h102v31H902zm0 52h102v31H902zm0 52h72v31h-72z" fill="#0b1020"/>
    <circle cx="1036" cy="270" r="25" fill="#e53935"/>
    <circle cx="1018" cy="388" r="31" fill="#39d5ff"/>
  </g>
</svg>`;
}

export function svgResponse(svg) {
  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=60, stale-while-revalidate=300'
    }
  });
}
