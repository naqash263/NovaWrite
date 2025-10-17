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

// Format work experience with professional styling
const formatWorkExperience = (experiences: any[]) => {
  return experiences.map(exp => `
    <div class="experience-card">
      <div class="experience-header">
        <h4 class="item-title">${exp.jobTitle}</h4>
        <span class="item-date">${exp.startDate} - ${exp.endDate || 'Present'}</span>
      </div>
      <div class="item-subtitle">${exp.company}</div>
      <p class="item-description">${exp.description || ''}</p>
    </div>
  `).join('');
};

// Format projects with cards, tech tags, and links
const formatProjects = (projects: any[]) => {
  return projects.map(project => `
    <div class="project-card">
      <h4 class="item-title">${project.name}</h4>
      ${project.technologies ? `<div class="tech-tags">${project.technologies.split(',').map((tech: string) => 
        `<span class="tech-tag">${tech.trim()}</span>`
      ).join('')}</div>` : ''}
      <p class="item-description">${project.description || ''}</p>
      ${project.url ? `<a href="${project.url}" class="project-link" target="_blank">View Project →</a>` : ''}
      ${project.startDate ? `<span class="item-date">${project.startDate}${project.endDate ? ` - ${project.endDate}` : ''}</span>` : ''}
    </div>
  `).join('');
};

// Format education entries
const formatEducation = (education: any[]) => {
  return education.map(edu => `
    <div class="education-item">
      <h4 class="item-title">${edu.degree}</h4>
      <div class="item-subtitle">${edu.institution}</div>
      <span class="item-date">${edu.graduationYear}</span>
    </div>
  `).join('');
};

// Format certificates with badges
const formatCertificates = (certificates: any[]) => {
  return certificates.map(cert => `
    <div class="certificate-item">
      <h4 class="item-title">${cert.name}</h4>
      <div class="item-subtitle">${cert.issuer}</div>
      <span class="item-date">${cert.date}</span>
      ${cert.credentialId ? `<div class="credential-id">ID: ${cert.credentialId}</div>` : ''}
      ${cert.url ? `<a href="${cert.url}" class="certificate-link" target="_blank">Verify →</a>` : ''}
    </div>
  `).join('');
};

// Format languages with proficiency
const formatLanguages = (languages: any[]) => {
  return languages.map(lang => `
    <div class="language-item">
      <span class="language-name">${lang.language}</span>
      <span class="proficiency-level">${lang.proficiency}</span>
    </div>
  `).join('');
};

// Format achievements
const formatAchievements = (achievements: any[]) => {
  return achievements.map(achievement => `
    <div class="achievement-item">
      <h4 class="item-title">${achievement.title}</h4>
      <p class="item-description">${achievement.description || ''}</p>
      ${achievement.date ? `<span class="item-date">${achievement.date}</span>` : ''}
    </div>
  `).join('');
};

// Hide entire section if placeholder is empty
const hideEmptySections = (html: string) => {
  // Find and remove sections containing only empty placeholders
  // Pattern: Find <section> or <div class="section"> tags that contain only whitespace after placeholder replacement
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Find all section-like elements
  const sections = doc.querySelectorAll('section, .section, [class*="section"]');
  
  sections.forEach(section => {
    const content = section.textContent?.trim() || '';
    // If section is empty or contains only the section title without content
    if (!content || content.length < 10) {
      section.remove();
    }
  });
  
  return doc.body.innerHTML;
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
  templateHTML = templateHTML.replace(/\{\{fullName\}\}/g, (data.fullName || ''));
  templateHTML = templateHTML.replace(/\{\{jobTitle\}\}/g, (data.jobTitle || ''));
  templateHTML = templateHTML.replace(/\{\{email\}\}/g, (data.email || ''));
  templateHTML = templateHTML.replace(/\{\{phoneNumber\}\}/g, (data.phoneNumber || ''));
  templateHTML = templateHTML.replace(/\{\{address\}\}/g, (data.address || ''));
  templateHTML = templateHTML.replace(/\{\{professionalSummary\}\}/g, (data.professionalSummary || ''));
  
  // Handle all array data types
  if (data.workExperience && data.workExperience.length > 0) {
    templateHTML = templateHTML.replace(/\{\{workExperience\}\}/g, formatWorkExperience(data.workExperience));
  } else {
    templateHTML = templateHTML.replace(/\{\{workExperience\}\}/g, '<!-- no-work-experience -->');
  }

  if (data.projects && data.projects.length > 0) {
    templateHTML = templateHTML.replace(/\{\{projects\}\}/g, formatProjects(data.projects));
  } else {
    templateHTML = templateHTML.replace(/\{\{projects\}\}/g, '<!-- no-projects -->');
  }

  if (data.education && data.education.length > 0) {
    templateHTML = templateHTML.replace(/\{\{education\}\}/g, formatEducation(data.education));
  } else {
    templateHTML = templateHTML.replace(/\{\{education\}\}/g, '<!-- no-education -->');
  }

  if (data.certificates && data.certificates.length > 0) {
    templateHTML = templateHTML.replace(/\{\{certificates\}\}/g, formatCertificates(data.certificates));
  } else {
    templateHTML = templateHTML.replace(/\{\{certificates\}\}/g, '<!-- no-certificates -->');
  }

  if (data.languages && data.languages.length > 0) {
    templateHTML = templateHTML.replace(/\{\{languages\}\}/g, formatLanguages(data.languages));
  } else {
    templateHTML = templateHTML.replace(/\{\{languages\}\}/g, '<!-- no-languages -->');
  }

  if (data.achievements && data.achievements.length > 0) {
    templateHTML = templateHTML.replace(/\{\{achievements\}\}/g, formatAchievements(data.achievements));
  } else {
    templateHTML = templateHTML.replace(/\{\{achievements\}\}/g, '<!-- no-achievements -->');
  }

  // Skills remain as text
  if (data.skills) {
    templateHTML = templateHTML.replace(/\{\{skills\}\}/g, (data.skills || ''));
  } else {
    templateHTML = templateHTML.replace(/\{\{skills\}\}/g, '<!-- no-skills -->');
  }

  // Hide empty sections
  templateHTML = hideEmptySections(templateHTML);
  
  return (
    <div 
      className="cv-preview-container"
      dangerouslySetInnerHTML={{ __html: templateHTML }}
      data-cv-preview
    />
  );
};