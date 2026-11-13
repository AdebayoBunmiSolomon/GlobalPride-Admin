// Helpers for the rich text (HTML) used by help articles and FAQs.

/** Tailwind styles for rendered rich text: the editor and previews share them. */
export const richTextClass = [
  "text-sm leading-relaxed text-gray-800",
  "[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2:first-child]:mt-0",
  "[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1",
  "[&_a]:text-primary [&_a]:underline [&_strong]:font-semibold [&_em]:italic",
].join(" ");

/** True when the HTML has no visible text, e.g. "", "<p><br></p>". */
export const isEmptyRichText = (html: string) => {
  if (!html) return true;
  const doc = new DOMParser().parseFromString(html, "text/html");
  return !doc.body.textContent?.trim();
};

const SAFE_LINK = /^(https?:|mailto:)/i;

/** Tags kept as-is, and tags that map onto a kept tag. Anything else is unwrapped. */
const tagMap: Record<string, string> = {
  H1: "h2",
  H2: "h2",
  H3: "h2",
  P: "p",
  DIV: "p",
  BR: "br",
  STRONG: "strong",
  B: "strong",
  EM: "em",
  I: "em",
  UL: "ul",
  OL: "ol",
  LI: "li",
  A: "a",
};

const copyNodes = (source: Node, target: Node, doc: Document) => {
  source.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      target.appendChild(doc.createTextNode(node.textContent ?? ""));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node as Element;
    const tag = tagMap[element.tagName];
    if (["SCRIPT", "STYLE", "IFRAME", "OBJECT"].includes(element.tagName)) return;
    if (!tag) {
      copyNodes(element, target, doc);
      return;
    }

    const clean = doc.createElement(tag);
    if (tag === "a") {
      const href = element.getAttribute("href")?.trim() ?? "";
      if (!SAFE_LINK.test(href)) {
        copyNodes(element, target, doc);
        return;
      }
      clean.setAttribute("href", href);
      clean.setAttribute("target", "_blank");
      clean.setAttribute("rel", "noopener noreferrer");
    }
    copyNodes(element, clean, doc);
    target.appendChild(clean);
  });
};

/**
 * Keeps only the formatting the editor supports (headings, paragraphs, bold,
 * italic, lists and http / https / mailto links) and drops everything else,
 * including attributes, scripts and event handlers.
 */
export const sanitizeRichText = (html: string) => {
  const source = new DOMParser().parseFromString(html, "text/html");
  const output = document.implementation.createHTMLDocument("");
  copyNodes(source.body, output.body, output);
  return output.body.innerHTML;
};

/** Adds "https://" when a link is typed without a scheme; returns "" for unsupported links. */
export const normalizeLink = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return SAFE_LINK.test(withScheme) ? withScheme : "";
};
