// Builds an ATS-friendly Word (.docx) CV from the builder data: one column, real
// headings and plain paragraphs so applicant tracking systems can parse it.
import type { CVData } from './cv-form';

type Entry = Record<string, unknown>;

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : v === null || v === undefined ? '' : String(v).trim());
const filled = (items: unknown, keys: string[]): Entry[] =>
  (Array.isArray(items) ? items : []).filter((i): i is Entry => Boolean(i) && typeof i === 'object' && keys.some((k) => text((i as Entry)[k])));
const range = (s: unknown, e: unknown) => (text(s) || text(e) ? `${text(s)}${text(s) ? ' – ' : ''}${text(e) || 'Present'}` : '');

// Page sizes and margins in twentieths of a point (twips).
const PAGE_SIZES: Record<string, { width: number; height: number }> = {
  a4: { width: 11906, height: 16838 },
  letter: { width: 12240, height: 15840 },
  legal: { width: 12240, height: 20160 },
};
const MARGINS: Record<string, number> = { narrow: 720, normal: 1440, wide: 2160 };

export async function buildCvDocx(
  data: CVData,
  accentColor = '#1d4ed8',
  layout: { pageSize?: string; margins?: string } = {},
): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle, TabStopType } = await import('docx');
  const color = accentColor.replace('#', '').slice(0, 6) || '1D4ED8';
  const children: InstanceType<typeof Paragraph>[] = [];

  const heading = (title: string) =>
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 80 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D1D5DB', space: 2 } },
        children: [new TextRun({ text: title.toUpperCase(), bold: true, color, size: 22 })],
      }),
    );
  const itemLine = (title: string, right: string) =>
    new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: 9600 }],
      spacing: { before: 80 },
      children: [new TextRun({ text: title, bold: true }), ...(right ? [new TextRun({ text: `\t${right}`, color: '6B7280' })] : [])],
    });
  const plain = (value: string, opts: { italics?: boolean } = {}) => new Paragraph({ children: [new TextRun({ text: value, italics: opts.italics })] });
  const lines = (value: string) =>
    value
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((l) => children.push(/^[-•*]\s+/.test(l) ? new Paragraph({ text: l.replace(/^[-•*]\s+/, ''), bullet: { level: 0 } }) : plain(l)));

  children.push(
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: text(data.fullName) || 'Your Name', bold: true, size: 40 })] }),
  );
  if (text(data.jobTitle)) children.push(new Paragraph({ children: [new TextRun({ text: text(data.jobTitle), color, size: 26 })] }));
  const contact = [data.email, data.phoneNumber, data.address].map(text).filter(Boolean).join('  |  ');
  if (contact) children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: contact, color: '4B5563' })] }));

  if (text(data.professionalSummary)) {
    heading('Profile');
    lines(text(data.professionalSummary));
  }

  const experience = filled(data.workExperience, ['jobTitle', 'company', 'description']);
  if (experience.length) {
    heading('Experience');
    experience.forEach((e) => {
      children.push(itemLine([text(e.jobTitle), text(e.company)].filter(Boolean).join(', '), range(e.startDate, e.endDate)));
      if (text(e.description)) lines(text(e.description));
    });
  }

  const education = filled(data.education, ['degree', 'institution']);
  if (education.length) {
    heading('Education');
    education.forEach((e) => children.push(itemLine([text(e.degree), text(e.institution)].filter(Boolean).join(', '), text(e.graduationYear))));
  }

  const skills = Array.isArray(data.skills) ? (data.skills as unknown[]).map(text).filter(Boolean).join(', ') : text(data.skills);
  if (skills) {
    heading('Skills');
    children.push(plain(skills));
  }

  const projects = filled(data.projects, ['name', 'description', 'technologies']);
  if (projects.length) {
    heading('Projects');
    projects.forEach((p) => {
      children.push(itemLine(text(p.name), text(p.startDate) ? range(p.startDate, p.endDate) : ''));
      if (text(p.technologies)) children.push(plain(`Technologies: ${text(p.technologies)}`, { italics: true }));
      if (text(p.description)) lines(text(p.description));
      if (text(p.url)) children.push(plain(text(p.url)));
    });
  }

  const certificates = filled(data.certificates, ['name', 'issuer']);
  if (certificates.length) {
    heading('Certifications');
    certificates.forEach((c) => children.push(itemLine([text(c.name), text(c.issuer)].filter(Boolean).join(', '), text(c.date))));
  }

  const achievements = filled(data.achievements, ['title', 'description']);
  if (achievements.length) {
    heading('Achievements');
    achievements.forEach((a) => {
      children.push(itemLine(text(a.title), text(a.date)));
      if (text(a.description)) lines(text(a.description));
    });
  }

  const languages = filled(data.languages, ['language']);
  if (languages.length) {
    heading('Languages');
    children.push(plain(languages.map((l) => `${text(l.language)}${text(l.proficiency) ? ` (${text(l.proficiency)})` : ''}`).join(', ')));
  }

  const interests = (Array.isArray(data.interests) ? (data.interests as unknown[]) : [])
    .map((i) => (typeof i === 'string' ? i : text((i as Entry)?.items) ? `${text((i as Entry).category) ? `${text((i as Entry).category)}: ` : ''}${text((i as Entry).items)}` : text((i as Entry)?.name)))
    .filter(Boolean);
  if (interests.length) {
    heading('Interests');
    interests.forEach((i) => children.push(plain(i)));
  }

  const references = filled(data.references, ['name', 'company', 'email', 'phone']);
  if (references.length) {
    heading('References');
    references.forEach((r) => {
      children.push(itemLine(text(r.name), ''));
      const detail = [r.position, r.company, r.email, r.phone].map(text).filter(Boolean).join(' | ');
      if (detail) children.push(plain(detail));
    });
  }

  const doc = new Document({
    creator: text(data.fullName) || 'CV Builder',
    title: `${text(data.fullName) || 'CV'} - CV`,
    styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
    sections: [
      {
        properties: {
          page: {
            size: PAGE_SIZES[(layout.pageSize || 'a4').toLowerCase()] ?? PAGE_SIZES.a4,
            margin: (() => {
              const m = MARGINS[layout.margins || 'normal'] ?? MARGINS.normal;
              return { top: m, bottom: m, left: m, right: m };
            })(),
          },
        },
        children,
      },
    ],
  });
  return Packer.toBlob(doc);
}
