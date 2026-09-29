// Builds an ATS-friendly PDF straight from the CV data with jsPDF's text API:
// one column, real text lines (selectable, searchable, parsed in reading order),
// standard headings and page breaks that never cut a line in half.
import type { jsPDF as JsPDF } from 'jspdf';
import type { CVData } from './cv-form';
import { applyHiddenSections, descriptionLines, formatDateRange, formatMonth, normalizeLayout, personalDetails, SECTION_TITLES, type CvLayout, type SectionKey } from './cv-sections';

export interface CvPdfOptions {
  pageSize?: string;
  margins?: string;
  includePageNumbers?: boolean;
  includeWatermark?: boolean;
  sections?: Partial<CvLayout> | null;
}

export interface CvPdfStyle {
  primaryColor?: string;
  fontFamily?: string;
  fontSize?: number;
}

type Entry = Record<string, unknown>;
type Rgb = [number, number, number];

const MARGINS_PT: Record<string, number> = { narrow: 36, normal: 72, wide: 108 };
const PAGE_FORMATS: Record<string, string> = { a4: 'a4', letter: 'letter', legal: 'legal' };

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : v === null || v === undefined ? '' : String(v).trim());
const filled = (items: unknown, keys: string[]): Entry[] =>
  (Array.isArray(items) ? items : []).filter((i): i is Entry => Boolean(i) && typeof i === 'object' && keys.some((k) => text((i as Entry)[k])));

const hexToRgb = (hex: string | undefined, fallback: Rgb): Rgb => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex ?? '').trim());
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Accent colours that are too light to read on white paper fall back to near-black. */
const readable = (rgb: Rgb): Rgb => (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2] > 170 ? [17, 24, 39] : rgb);

const pdfFont = (family = '') => (/mono|consolas|courier/i.test(family) ? 'courier' : /serif|georgia|times|garamond|cambria/i.test(family) && !/sans/i.test(family) ? 'times' : 'helvetica');

// Characters the 14 standard PDF fonts can encode (WinAnsi). Anything else would print as garbage.
const WIN_ANSI_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
const isWinAnsi = (ch: string) => {
  const c = ch.codePointAt(0) ?? 0;
  return c === 9 || c === 10 || c === 13 || (c >= 0x20 && c <= 0x7e) || (c >= 0xa0 && c <= 0xff) || WIN_ANSI_EXTRA.includes(ch);
};

/** Distinct characters in the CV that the PDF's standard fonts cannot show (e.g. Arabic or CJK script). */
export function unsupportedPdfCharacters(data: CVData): string[] {
  const found = new Set<string>();
  const visit = (value: unknown) => {
    if (typeof value === 'string') {
      if (value.startsWith('data:')) return;
      for (const ch of value) if (!isWinAnsi(ch)) found.add(ch);
    } else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  };
  const { profilePictureUrl: _photo, jobDescription: _jd, ...rest } = data;
  void _photo;
  void _jd;
  visit(rest);
  return [...found];
}

/** Loads the profile photo as a data URL (data URLs as-is; remote images only if CORS allows it). */
async function photoDataUrl(url: string): Promise<string | null> {
  if (/^data:image\/(png|jpe?g|webp);base64,/i.test(url)) return url;
  if (!/^https?:\/\//i.test(url)) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(url, { signal: controller.signal, mode: 'cors' });
    clearTimeout(timer);
    if (!response.ok) return null;
    const blob = await response.blob();
    if (!/^image\/(png|jpe?g|webp)$/i.test(blob.type)) return null;
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function buildCvPdf(input: CVData, style: CvPdfStyle = {}, options: CvPdfOptions = {}): Promise<JsPDF> {
  const { jsPDF } = await import('jspdf');
  const layout = normalizeLayout(options.sections);
  const data = applyHiddenSections(input, layout.hidden);

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: PAGE_FORMATS[(options.pageSize || 'a4').toLowerCase()] ?? 'a4', compress: true, putOnlyUsedFonts: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = MARGINS_PT[options.margins || 'normal'] ?? MARGINS_PT.normal;
  const contentWidth = pageWidth - margin * 2;
  const font = pdfFont(style.fontFamily);
  const body = Math.min(12, Math.max(9, Math.round((style.fontSize || 11) * 0.9 * 2) / 2));
  const accent = readable(hexToRgb(style.primaryColor, [17, 24, 39]));
  const INK: Rgb = [17, 24, 39];
  const MUTED: Rgb = [75, 85, 99];
  const lineHeight = (size: number) => size * 1.32;

  const name = text(data.fullName) || 'Your Name';
  pdf.setProperties({
    title: `${name} - CV`,
    subject: 'Curriculum vitae',
    author: name,
    keywords: text(data.skills),
    creator: 'Naqash Thaheem CV Builder (naqashthaheem.com)',
  });
  try {
    pdf.setLanguage('en-US');
  } catch {
    /* older jsPDF builds without the language plugin */
  }

  let y = margin; // top of the next line, measured from the top of the page

  const newPage = () => {
    pdf.addPage();
    y = margin;
  };
  /** Starts a new page unless `height` more points fit above the bottom margin. */
  const ensure = (height: number) => {
    if (y + height > pageHeight - margin && y > margin) newPage();
  };
  const setType = (size: number, weight: 'normal' | 'bold' | 'italic' | 'bolditalic', color: Rgb) => {
    pdf.setFont(font, weight);
    pdf.setFontSize(size);
    pdf.setTextColor(color[0], color[1], color[2]);
  };
  const split = (value: string, width: number) => pdf.splitTextToSize(value, width) as string[];

  /** Writes wrapped text; each visual line is one text object, so extraction keeps words and spaces. */
  const paragraph = (value: string, opts: { size?: number; weight?: 'normal' | 'bold' | 'italic' | 'bolditalic'; color?: Rgb; indent?: number; width?: number; after?: number } = {}) => {
    const size = opts.size ?? body;
    const indent = opts.indent ?? 0;
    setType(size, opts.weight ?? 'normal', opts.color ?? INK);
    for (const line of split(value, (opts.width ?? contentWidth) - indent)) {
      ensure(lineHeight(size));
      pdf.text(line, margin + indent, y + size * 0.85);
      y += lineHeight(size);
    }
    y += opts.after ?? 0;
  };

  const bullet = (value: string) => {
    setType(body, 'normal', INK);
    const lines = split(value, contentWidth - 12);
    lines.forEach((line, i) => {
      ensure(lineHeight(body));
      if (i === 0) pdf.text('•', margin + 2, y + body * 0.85);
      pdf.text(line, margin + 12, y + body * 0.85);
      y += lineHeight(body);
    });
  };

  const description = (value: unknown) => {
    for (const line of descriptionLines(value)) {
      if (line.bullet) bullet(line.text);
      else paragraph(line.text);
    }
  };

  const heading = (title: string) => {
    const size = body * 1.1;
    ensure(size * 1.6 + 6 + lineHeight(body) * 2); // keep the heading with its first lines
    y += body * 0.6;
    setType(size, 'bold', accent);
    pdf.text(title.toUpperCase(), margin, y + size * 0.85);
    y += lineHeight(size);
    pdf.setDrawColor(209, 213, 219);
    pdf.setLineWidth(0.6);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  /** Bold title on the left, grey date right-aligned on the same line, optional italic subtitle. */
  const itemHeader = (title: string, date: string, subtitle = '') => {
    ensure(lineHeight(body) * (subtitle ? 3 : 2));
    y += 3;
    setType(body * 0.95, 'normal', MUTED);
    const dateWidth = date ? pdf.getTextWidth(date) + 12 : 0;
    setType(body, 'bold', INK);
    const titleLines = split(title || ' ', contentWidth - dateWidth);
    titleLines.forEach((line, i) => {
      ensure(lineHeight(body));
      setType(body, 'bold', INK);
      pdf.text(line, margin, y + body * 0.85);
      if (i === 0 && date) {
        setType(body * 0.95, 'normal', MUTED);
        pdf.text(date, pageWidth - margin, y + body * 0.85, { align: 'right' });
      }
      y += lineHeight(body);
    });
    if (subtitle) paragraph(subtitle, { weight: 'italic', color: MUTED });
  };

  // ---- Header ----
  const photo = text(data.profilePictureUrl) ? await photoDataUrl(text(data.profilePictureUrl)) : null;
  const photoSize = 64;
  let headerWidth = contentWidth;
  if (photo) {
    try {
      const format = /^data:image\/png/i.test(photo) ? 'PNG' : /^data:image\/webp/i.test(photo) ? 'WEBP' : 'JPEG';
      pdf.addImage(photo, format, pageWidth - margin - photoSize, margin, photoSize, photoSize);
      headerWidth = contentWidth - photoSize - 12;
    } catch {
      /* unsupported image: leave it out */
    }
  }
  const headerTop = y;
  paragraph(name, { size: body * 2.1, weight: 'bold', width: headerWidth });
  if (text(data.jobTitle)) paragraph(text(data.jobTitle), { size: body * 1.25, color: accent, width: headerWidth, after: 2 });
  const contact = [data.email, data.phoneNumber, data.address].map(text).filter(Boolean).join('  |  ');
  if (contact) paragraph(contact, { size: body * 0.95, color: MUTED, width: headerWidth });
  const details = personalDetails(data)
    .map((d) => `${d.label}: ${d.value}`)
    .join('  |  ');
  if (details) paragraph(details, { size: body * 0.95, color: MUTED, width: headerWidth });
  if (photo) y = Math.max(y, headerTop + photoSize);
  y += 4;
  pdf.setDrawColor(accent[0], accent[1], accent[2]);
  pdf.setLineWidth(1.2);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 4;

  // ---- Sections ----
  const writers: Record<SectionKey, () => void> = {
    summary: () => {
      if (!text(data.professionalSummary)) return;
      heading(SECTION_TITLES.summary);
      description(data.professionalSummary);
    },
    experience: () => {
      const items = filled(data.workExperience, ['jobTitle', 'company', 'description']);
      if (!items.length) return;
      heading(SECTION_TITLES.experience);
      for (const e of items) {
        itemHeader(text(e.jobTitle) || text(e.company), formatDateRange(e.startDate, e.endDate), text(e.jobTitle) ? text(e.company) : '');
        description(e.description);
      }
    },
    education: () => {
      const items = filled(data.education, ['degree', 'institution']);
      if (!items.length) return;
      heading(SECTION_TITLES.education);
      for (const e of items) itemHeader(text(e.degree) || text(e.institution), formatMonth(e.graduationYear), text(e.degree) ? text(e.institution) : '');
    },
    skills: () => {
      const skills = Array.isArray(data.skills) ? (data.skills as unknown[]).map(text).filter(Boolean).join(', ') : text(data.skills);
      if (!skills) return;
      heading(SECTION_TITLES.skills);
      paragraph(skills);
    },
    projects: () => {
      const items = filled(data.projects, ['name', 'description', 'technologies']);
      if (!items.length) return;
      heading(SECTION_TITLES.projects);
      for (const p of items) {
        itemHeader(text(p.name), text(p.startDate) ? formatDateRange(p.startDate, p.endDate) : '');
        if (text(p.technologies)) paragraph(`Technologies: ${text(p.technologies)}`, { weight: 'italic', color: MUTED });
        description(p.description);
        const url = text(p.url);
        if (/^https?:\/\//i.test(url)) {
          setType(body * 0.95, 'normal', accent);
          for (const line of split(url, contentWidth)) {
            ensure(lineHeight(body));
            pdf.textWithLink(line, margin, y + body * 0.85, { url });
            y += lineHeight(body);
          }
        }
      }
    },
    certificates: () => {
      const items = filled(data.certificates, ['name', 'issuer']);
      if (!items.length) return;
      heading(SECTION_TITLES.certificates);
      for (const c of items) {
        itemHeader(text(c.name) || text(c.issuer), formatMonth(c.date), text(c.name) ? text(c.issuer) : '');
        if (text(c.credentialId)) paragraph(`Credential ID: ${text(c.credentialId)}`, { size: body * 0.95, color: MUTED });
      }
    },
    achievements: () => {
      const items = filled(data.achievements, ['title', 'description']);
      if (!items.length) return;
      heading(SECTION_TITLES.achievements);
      for (const a of items) {
        itemHeader(text(a.title), formatMonth(a.date));
        description(a.description);
      }
    },
    languages: () => {
      const items = filled(data.languages, ['language']);
      if (!items.length) return;
      heading(SECTION_TITLES.languages);
      paragraph(items.map((l) => `${text(l.language)}${text(l.proficiency) ? ` (${text(l.proficiency)})` : ''}`).join(', '));
    },
    interests: () => {
      const items = (Array.isArray(data.interests) ? (data.interests as unknown[]) : [])
        .map((i) => (typeof i === 'string' ? i.trim() : text((i as Entry)?.items) ? `${text((i as Entry).category) ? `${text((i as Entry).category)}: ` : ''}${text((i as Entry).items)}` : text((i as Entry)?.name)))
        .filter(Boolean);
      if (!items.length) return;
      heading(SECTION_TITLES.interests);
      items.forEach((i) => paragraph(i));
    },
    references: () => {
      const items = filled(data.references, ['name', 'company', 'email', 'phone']);
      if (!items.length) return;
      heading(SECTION_TITLES.references);
      for (const r of items) {
        itemHeader(text(r.name), '');
        const detail = [r.position ?? r.title, r.company ?? r.organization, r.email, r.phone].map(text).filter(Boolean).join('  |  ');
        if (detail) paragraph(detail, { color: MUTED });
      }
    },
  };
  layout.order.forEach((key) => writers[key]());

  // ---- Footer ----
  const pages = pdf.getNumberOfPages();
  if (options.includePageNumbers || options.includeWatermark) {
    for (let i = 1; i <= pages; i++) {
      pdf.setPage(i);
      setType(8, 'normal', [120, 120, 120]);
      const footerY = pageHeight - Math.min(margin, 72) / 2;
      if (options.includePageNumbers) pdf.text(`Page ${i} of ${pages}`, pageWidth - margin, footerY, { align: 'right' });
      if (options.includeWatermark) pdf.text("Created with Naqash Thaheem's CV Builder", margin, footerY);
    }
  }
  return pdf;
}
