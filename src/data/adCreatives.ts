// Placeholder ad creatives drawn as inline SVGs, so the mock advertisements
// have images without shipping binary assets. Real creatives come from uploads.

interface CreativeSeed {
  /** Gradient start / end colors. */
  from: string;
  to: string;
  /** Decorative shapes + eyebrow text color. */
  accent: string;
  eyebrow: string;
  /** Headline, one entry per line (two lines fit best). */
  lines: string[];
}

const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A 2:1 SVG banner as a data URL. */
export const makeCreative = ({ from, to, accent, eyebrow, lines }: CreativeSeed) => {
  const headline = lines
    .map(
      (line, index) =>
        `<text x="48" y="${168 + index * 58}" font-size="50" font-weight="800" fill="#fff">${escapeXml(line)}</text>`,
    )
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="320" viewBox="0 0 640 320" font-family="Inter, Arial, sans-serif">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
<rect width="640" height="320" fill="url(#g)"/>
<circle cx="560" cy="70" r="120" fill="${accent}" opacity="0.25"/>
<circle cx="600" cy="290" r="90" fill="#fff" opacity="0.12"/>
<rect x="430" y="150" width="150" height="110" rx="18" fill="#fff" opacity="0.18"/>
<rect x="455" y="175" width="100" height="12" rx="6" fill="#fff" opacity="0.5"/>
<rect x="455" y="200" width="70" height="12" rx="6" fill="#fff" opacity="0.35"/>
<text x="48" y="100" font-size="20" font-weight="700" letter-spacing="3" fill="${accent}">${escapeXml(eyebrow.toUpperCase())}</text>
${headline}
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};
