import type { CVData } from "./cv-form";
import { renderTemplateHtml, type CvTemplateLike } from "./cv-render";
import type { CvLayout } from "./cv-sections";

// Define CVStyle type
export interface CVStyle {
  templateName: string;
  primaryColor: string;
  secondaryColor: string;
  fontSize: number;
  fontFamily: string;
}

type CvPreviewProps = {
  data: CVData;
  style: CVStyle;
  template?: CvTemplateLike | null; // Template from API (falls back to the built-in template)
  layout?: CvLayout | null; // Section order and hidden sections
};

// Dynamic CV Preview Component
export const CvPreview = ({ data, style, template, layout }: CvPreviewProps) => {
  const templateHTML = renderTemplateHtml(data, style, template, layout);
  return (
    <div
      id="cv-preview"
      className="cv-preview-container"
      style={{ width: '100%', maxWidth: '100%', margin: '0', overflow: 'hidden', position: 'relative' }}
      dangerouslySetInnerHTML={{ __html: templateHTML }}
      data-cv-preview
    />
  );
};
