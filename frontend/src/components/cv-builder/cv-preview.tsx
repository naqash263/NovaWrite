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
        <h4 class="item-title">${exp.jobTitle || 'Position Title'}</h4>
        <span class="item-date">${exp.startDate || 'Start Date'} - ${exp.endDate || 'Present'}</span>
      </div>
      <div class="item-subtitle">${exp.company || 'Company Name'}</div>
      <p class="item-description">${exp.description || ''}</p>
    </div>
  `).join('');
};

// Format projects with cards, tech tags, and links
const formatProjects = (projects: any[]) => {
  return projects.map(project => `
    <div class="project-card">
      <div class="project-header">
        <h4 class="item-title">${project.name || 'Project Name'}</h4>
        ${project.startDate ? `<span class="item-date">${project.startDate}${project.endDate ? ` - ${project.endDate}` : ''}</span>` : ''}
      </div>
      ${project.technologies ? `<div class="tech-tags">${project.technologies.split(',').map((tech: string) => 
        `<span class="tech-tag">${tech.trim()}</span>`
      ).join('')}</div>` : ''}
      <p class="item-description">${project.description || ''}</p>
      ${project.url ? `<a href="${project.url}" class="project-link" target="_blank">View Project →</a>` : ''}
    </div>
  `).join('');
};

// Format education entries
const formatEducation = (education: any[]) => {
  return education.map(edu => `
    <div class="education-item">
      <div class="education-header">
        <h4 class="item-title">${edu.degree || 'Degree'}</h4>
        <span class="item-date">${edu.graduationYear || 'Year'}</span>
      </div>
      <div class="item-subtitle">${edu.institution || 'Institution'}</div>
    </div>
  `).join('');
};

// Format certificates with badges
const formatCertificates = (certificates: any[]) => {
  return certificates.map(cert => `
    <div class="certificate-item">
      <div class="certificate-header">
        <h4 class="item-title">${cert.name || 'Certificate Name'}</h4>
        <span class="item-date">${cert.date || 'Date'}</span>
      </div>
      <div class="item-subtitle">${cert.issuer || 'Issuing Organization'}</div>
      ${cert.credentialId ? `<div class="credential-id" style="font-size: 11px; color: #666; margin-top: 4px;">ID: ${cert.credentialId}</div>` : ''}
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
      <div class="achievement-header">
        <h4 class="item-title">${achievement.title || 'Achievement Title'}</h4>
        ${achievement.date ? `<span class="item-date">${achievement.date}</span>` : ''}
      </div>
      <p class="item-description">${achievement.description || ''}</p>
    </div>
  `).join('');
};

// Format interests
const formatInterests = (interests: any[]) => {
  return interests.map(interest => `
    <div class="interest-item">
      <span class="interest-name">${interest.name || interest}</span>
    </div>
  `).join('');
};

// Format references
const formatReferences = (references: any[]) => {
  return references.map(ref => `
    <div class="reference-item">
      <h4 class="item-title">${ref.name || 'Reference Name'}</h4>
      <div class="item-subtitle">${ref.position || ref.title || ''}</div>
      <div class="item-subtitle">${ref.company || ref.organization || ''}</div>
      <div class="contact-info">
        ${ref.email ? `<span class="contact-item">Email: ${ref.email}</span>` : ''}
        ${ref.phone ? `<span class="contact-item">Phone: ${ref.phone}</span>` : ''}
      </div>
    </div>
  `).join('');
};

// Hide entire section if placeholder is empty
const hideEmptySections = (html: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Find all section-like elements
  const sections = doc.querySelectorAll('section, .section, [class*="section"]');
  
  sections.forEach(section => {
    // Get the section title element
    const sectionTitle = section.querySelector('.section-title, h2, h3, [class*="title"]');
    const sectionTitleText = sectionTitle?.textContent?.trim() || '';
    
    // Get all content except the title
    const sectionContent = section.cloneNode(true) as Element;
    if (sectionTitle && sectionContent.contains(sectionTitle)) {
      sectionContent.removeChild(sectionTitle);
    }
    const contentText = sectionContent.textContent?.trim() || '';
    
    // Check if section has meaningful content (more than just whitespace or empty placeholders)
    const hasContent = contentText && 
      contentText.length > 5 && 
      !contentText.match(/^\s*$/) &&
      !contentText.includes('<!-- no-') &&
      !contentText.includes('{{') &&
      contentText !== sectionTitleText;
    
    // If no meaningful content, remove the entire section
    if (!hasContent) {
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

  if (data.interests && data.interests.length > 0) {
    templateHTML = templateHTML.replace(/\{\{interests\}\}/g, formatInterests(data.interests));
  } else {
    templateHTML = templateHTML.replace(/\{\{interests\}\}/g, '<!-- no-interests -->');
  }

  if (data.references && data.references.length > 0) {
    templateHTML = templateHTML.replace(/\{\{references\}\}/g, formatReferences(data.references));
  } else {
    templateHTML = templateHTML.replace(/\{\{references\}\}/g, '<!-- no-references -->');
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
      id="cv-preview"
      className="cv-preview-container"
      dangerouslySetInnerHTML={{ __html: templateHTML }}
      data-cv-preview
    />
  );
};