import type { CVData } from "./cv-form";
import { renderTemplateHtml, type CvTemplateLike } from "./cv-render";

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
};

// Dynamic CV Preview Component
export const CvPreview = ({ data, style, template }: CvPreviewProps) => {
  const templateHTML = renderTemplateHtml(data, style, template);
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
