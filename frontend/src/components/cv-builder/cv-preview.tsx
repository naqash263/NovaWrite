import type { CVData } from "./cv-form";

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
  template?: any; // Template from API
};

// Dynamic CV Preview Component
export const CvPreview = ({ data, style, template }: CvPreviewProps) => {
  // Debug logging
  console.log('CvPreview received template:', template);
  console.log('Template html_content:', template?.html_content);
  
  // If no template provided, render a basic template
  if (!template) {
    return (
      <div className="cv-preview-container bg-white p-8 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">CV Preview</h2>
          <p className="text-gray-600">Template not loaded. Please select a template.</p>
        </div>
      </div>
    );
  }

  // Apply customizations to the template HTML
  let templateHTML = template.html_content || '';
  
  // Debug logging
  console.log('Template HTML length:', templateHTML.length);
  console.log('Template HTML preview:', templateHTML.substring(0, 200));
  
  // Replace customization placeholders
  templateHTML = templateHTML.replace(/\{\{primaryColor\}\}/g, style.primaryColor);
  templateHTML = templateHTML.replace(/\{\{secondaryColor\}\}/g, style.secondaryColor);
  templateHTML = templateHTML.replace(/\{\{fontFamily\}\}/g, style.fontFamily);
  templateHTML = templateHTML.replace(/\{\{fontSize\}\}/g, style.fontSize.toString());

  // Replace CV data placeholders
  templateHTML = templateHTML.replace(/\{\{fullName\}\}/g, data.fullName || '');
  templateHTML = templateHTML.replace(/\{\{jobTitle\}\}/g, data.jobTitle || '');
  templateHTML = templateHTML.replace(/\{\{email\}\}/g, data.email || '');
  templateHTML = templateHTML.replace(/\{\{phoneNumber\}\}/g, data.phoneNumber || '');
  templateHTML = templateHTML.replace(/\{\{address\}\}/g, data.address || '');
  templateHTML = templateHTML.replace(/\{\{professionalSummary\}\}/g, data.professionalSummary || '');
  
  // Handle arrays (work experience, education, etc.)
  if (data.workExperience && data.workExperience.length > 0) {
    const workExpHTML = data.workExperience.map(exp => 
      `<div class="work-item">
        <h4>${exp.jobTitle} - ${exp.company}</h4>
        <p class="date">${exp.startDate} - ${exp.endDate}</p>
        <p>${exp.description}</p>
      </div>`
    ).join('');
    templateHTML = templateHTML.replace(/\{\{workExperience\}\}/g, workExpHTML);
  }

  if (data.education && data.education.length > 0) {
    const educationHTML = data.education.map(edu => 
      `<div class="education-item">
        <h4>${edu.degree}</h4>
        <p>${edu.institution} - ${edu.graduationYear}</p>
      </div>`
    ).join('');
    templateHTML = templateHTML.replace(/\{\{education\}\}/g, educationHTML);
  }

  if (data.skills) {
    templateHTML = templateHTML.replace(/\{\{skills\}\}/g, data.skills);
  }
  
  return (
    <div 
      className="cv-preview-container"
      dangerouslySetInnerHTML={{ __html: templateHTML }}
      data-cv-preview
    />
  );
};