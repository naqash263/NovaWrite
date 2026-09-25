// Built-in, single-column ATS-friendly template. Always available, so the CV builder
// keeps working (live preview + every export) even when no admin templates are loaded.
// Uses the same {{placeholder}} contract as the admin-managed templates.
export const BUILTIN_TEMPLATE_ID = 'builtin-classic';

/** A CV template as returned by GET /api/cv-templates (admin-managed) or the built-in one. */
export interface CvTemplateRecord {
  id: string | number;
  name?: string;
  description?: string | null;
  category?: string | null;
  ats_score?: number | null;
  is_default?: boolean;
  thumbnail?: string | null;
  customizable_options?: string[] | null;
  html_content?: string | null;
}

export const builtinTemplate: CvTemplateRecord & { html_content: string } = {
  id: BUILTIN_TEMPLATE_ID,
  name: 'Classic ATS',
  description: 'Single column, standard section headings and real text that applicant tracking systems can parse.',
  category: 'built-in',
  ats_score: null as number | null,
  is_default: false,
  thumbnail: null as string | null,
  customizable_options: ['Accent colour', 'Font'],
  html_content: `<div class="cv-template cv-classic" style="font-family: {{fontFamily}}; font-size: {{fontSize}}px;">
<style>
  .cv-classic { color: #1f2937; line-height: 1.45; padding: 24px; background: #fff; max-width: 100%; box-sizing: border-box; overflow-wrap: anywhere; }
  .cv-classic * { box-sizing: border-box; }
  .cv-classic .cv-header { border-bottom: 2px solid {{primaryColor}}; padding-bottom: 10px; margin-bottom: 14px; }
  .cv-classic .cv-photo { float: right; width: 72px; height: 72px; border-radius: 6px; object-fit: cover; margin-left: 12px; }
  .cv-classic .cv-name { font-size: 1.9em; font-weight: 700; color: #111827; margin: 0; }
  .cv-classic .cv-role { font-size: 1.15em; color: {{primaryColor}}; margin: 2px 0 6px; }
  .cv-classic .cv-contact { font-size: 0.95em; color: #4b5563; display: flex; flex-wrap: wrap; gap: 4px 14px; }
  .cv-classic section { margin-bottom: 14px; clear: both; }
  .cv-classic h3 { font-size: 1.05em; text-transform: uppercase; letter-spacing: 0.06em; color: {{primaryColor}}; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; margin: 0 0 8px; }
  .cv-classic h4 { font-size: 1em; margin: 0; color: #111827; }
  .cv-classic .experience-card, .cv-classic .education-item, .cv-classic .project-card, .cv-classic .certificate-item,
  .cv-classic .achievement-item, .cv-classic .reference-item { margin-bottom: 9px; }
  .cv-classic .experience-header, .cv-classic .education-header, .cv-classic .project-header, .cv-classic .certificate-header,
  .cv-classic .achievement-header { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
  .cv-classic .item-date { color: #6b7280; font-size: 0.9em; white-space: nowrap; }
  .cv-classic .item-subtitle { color: #374151; font-style: italic; }
  .cv-classic .item-description { margin: 3px 0 0; white-space: pre-line; }
  .cv-classic .item-bullets { margin: 3px 0 0; padding-left: 18px; list-style: disc; }
  .cv-classic .item-bullets li { margin: 1px 0; }
  .cv-classic .cv-details { font-size: 0.95em; color: #4b5563; display: flex; flex-wrap: wrap; gap: 2px 14px; margin-top: 3px; }
  .cv-classic .tech-tags { display: flex; flex-wrap: wrap; gap: 4px; margin: 3px 0; }
  .cv-classic .tech-tag { font-size: 0.85em; border: 1px solid #d1d5db; border-radius: 3px; padding: 0 4px; }
  .cv-classic .language-item, .cv-classic .interest-item { display: inline-block; margin: 0 14px 4px 0; }
  .cv-classic .proficiency-level { color: #6b7280; margin-left: 4px; }
  .cv-classic a { color: {{primaryColor}}; }
</style>
<header class="cv-header">
  {{#if profilePictureUrl}}<img class="cv-photo" src="{{profilePictureUrl}}" alt="">{{/if}}
  <div class="cv-name">{{fullName}}</div>
  <div class="cv-role">{{jobTitle}}</div>
  <div class="cv-contact"><span>{{email}}</span><span>{{phoneNumber}}</span><span>{{address}}</span></div>
  <div class="cv-details">{{personalDetails}}</div>
</header>
<section id="summary"><h3>Profile</h3><p class="item-description">{{professionalSummary}}</p></section>
<section id="experience"><h3>Experience</h3>{{workExperience}}</section>
<section id="education"><h3>Education</h3>{{education}}</section>
<section id="skills"><h3>Skills</h3><p class="item-description">{{skills}}</p></section>
<section id="projects"><h3>Projects</h3>{{projects}}</section>
<section id="certificates"><h3>Certifications</h3>{{certificates}}</section>
<section id="achievements"><h3>Achievements</h3>{{achievements}}</section>
<section id="languages"><h3>Languages</h3>{{languages}}</section>
<section id="interests"><h3>Interests</h3>{{interests}}</section>
<section id="references"><h3>References</h3>{{references}}</section>
</div>`,
};
