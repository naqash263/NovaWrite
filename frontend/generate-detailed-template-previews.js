import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templates = [
  'Classic', 'Modern', 'Minimal', 'Professional', 'Creative', 
  'Elegant', 'Tech', 'Corporate', 'Academic', 'Startup', 'ATS Optimized'
];

const dummyData = {
  fullName: "Naqash Thaheem",
  jobTitle: "Systems Analyst & Automation Specialist",
  email: "naqash263@gmail.com",
  phoneNumber: "+971 50 123 4567",
  address: "Ajman, U.A.E.",
  professionalSummary: "Experienced Systems Analyst with 5+ years in automation, data analysis, and system optimization. Proven track record in implementing efficient solutions and improving operational workflows.",
  workExperience: [
    {
      company: "Tech Solutions Inc.",
      jobTitle: "Senior Systems Analyst",
      startDate: "2022-01",
      endDate: "Present",
      description: "Led automation projects reducing manual work by 40%. Implemented data analysis tools improving decision-making processes.",
      location: "Dubai, UAE"
    },
    {
      company: "Digital Innovations Ltd.",
      jobTitle: "Systems Analyst",
      startDate: "2020-06",
      endDate: "2021-12",
      description: "Developed workflow automation systems. Collaborated with cross-functional teams to optimize business processes.",
      location: "Abu Dhabi, UAE"
    }
  ],
  education: [
    {
      institution: "University of Technology",
      degree: "Bachelor of Computer Science",
      startDate: "2016-09",
      endDate: "2020-06",
      description: "Specialized in Software Engineering and Data Analysis",
      location: "UAE",
      graduationYear: "2020"
    }
  ],
  skills: "JavaScript, Python, SQL, Data Analysis, Process Automation, System Design, Project Management, Agile Methodologies, Database Management, API Integration, Cloud Computing, Problem Solving",
  projects: [
    {
      name: "Workflow Automation System",
      description: "Designed and implemented automated workflow system reducing processing time by 60%",
      technologies: "Python, JavaScript, SQL Server",
      startDate: "2022-03",
      endDate: "2022-08"
    }
  ],
  certificates: [
    {
      name: "AWS Certified Solutions Architect",
      issuer: "Amazon Web Services",
      date: "2023-05"
    }
  ],
  languages: [
    { language: "English", proficiency: "Native" },
    { language: "Arabic", proficiency: "Fluent" },
    { language: "Hindi", proficiency: "Conversational" },
    { language: "Urdu", proficiency: "Fluent" }
  ],
  interests: [
    { category: "Technology", items: "AI/ML, Blockchain, IoT" },
    { category: "Sports", items: "Football, Cricket, Swimming" }
  ],
  references: [
    {
      name: "Ahmed Al-Rashid",
      position: "IT Director",
      company: "Tech Solutions Inc.",
      email: "ahmed@techsolutions.ae",
      phone: "+971 50 987 6543"
    }
  ]
};

const templateStyles = {
  'Classic': { primaryColor: '#2962FF', secondaryColor: '#FFFFFF', fontFamily: 'Inter, sans-serif' },
  'Modern': { primaryColor: '#333333', secondaryColor: '#FFFFFF', fontFamily: 'Roboto, sans-serif' },
  'Minimal': { primaryColor: '#1a1a1a', secondaryColor: '#FFFFFF', fontFamily: 'Inter, sans-serif' },
  'Professional': { primaryColor: '#2C3E50', secondaryColor: '#FFFFFF', fontFamily: 'Arial, sans-serif' },
  'Creative': { primaryColor: '#E74C3C', secondaryColor: '#FFFFFF', fontFamily: 'Montserrat, sans-serif' },
  'Elegant': { primaryColor: '#8E44AD', secondaryColor: '#FFFFFF', fontFamily: 'Georgia, serif' },
  'Tech': { primaryColor: '#27AE60', secondaryColor: '#FFFFFF', fontFamily: 'Consolas, monospace' },
  'Corporate': { primaryColor: '#34495E', secondaryColor: '#FFFFFF', fontFamily: 'Helvetica, sans-serif' },
  'Academic': { primaryColor: '#8B4513', secondaryColor: '#FFFFFF', fontFamily: 'Times New Roman, serif' },
  'Startup': { primaryColor: '#F39C12', secondaryColor: '#FFFFFF', fontFamily: 'Open Sans, sans-serif' },
  'ATS Optimized': { primaryColor: '#000000', secondaryColor: '#FFFFFF', fontFamily: 'Arial, sans-serif' }
};

function generateTemplateHTML(template, data, style) {
  const sectionTitleStyle = `color: ${style.primaryColor}; border-color: ${style.primaryColor}; font-size: 14px`;
  
  if (template === 'Classic') {
    return `
      <div class="max-w-[210mm] min-h-[297mm] max-h-[594mm] p-6 space-y-3" style="font-family: ${style.fontFamily}">
        <header class="text-center">
          <h1 class="text-3xl font-bold" style="color: ${style.primaryColor}; font-size: 24px">${data.fullName}</h1>
          <p class="text-lg mt-1" style="color: ${style.primaryColor}; font-size: 16px">${data.jobTitle}</p>
        </header>
        <div class="flex justify-center flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <span>${data.email}</span>
          <span>${data.phoneNumber}</span>
          <span>${data.address}</span>
        </div>
        <section>
          <h2 class="text-base font-bold uppercase tracking-wider border-b-2 pb-1" style="${sectionTitleStyle}">Summary</h2>
          <div class="mt-1">
            <p class="text-gray-700 text-sm leading-tight">${data.professionalSummary}</p>
          </div>
        </section>
        <section>
          <h2 class="text-base font-bold uppercase tracking-wider border-b-2 pb-1" style="${sectionTitleStyle}">Experience</h2>
          <div class="mt-1">
            ${data.workExperience.map(exp => `
              <div class="mt-2">
                <div class="flex justify-between items-baseline">
                  <h3 class="font-semibold text-sm">${exp.jobTitle}</h3>
                  <p class="text-xs text-gray-500">${exp.startDate} - ${exp.endDate || 'Present'}</p>
                </div>
                <p class="text-xs italic text-gray-600">${exp.company}</p>
                <p class="text-xs text-gray-700 mt-1">${exp.description}</p>
              </div>
            `).join('')}
          </div>
        </section>
        <section>
          <h2 class="text-base font-bold uppercase tracking-wider border-b-2 pb-1" style="${sectionTitleStyle}">Skills</h2>
          <div class="mt-1">
            <div class="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-sm">
              ${data.skills.split(',').map(skill => `
                <div class="flex items-center">
                  <span class="mr-2 text-gray-500">•</span>
                  <span>${skill.trim()}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </section>
      </div>
    `;
  } else if (template === 'Modern') {
    return `
      <div class="max-w-[210mm] min-h-[297mm] max-h-[594mm] p-6 space-y-3" style="font-family: ${style.fontFamily}">
        <header class="flex items-center space-x-4" style="background-color: ${style.primaryColor}; color: ${style.secondaryColor}; padding: 1rem;">
          <div class="flex-1">
            <h1 class="text-3xl font-bold" style="color: ${style.secondaryColor}; font-size: 24px">${data.fullName}</h1>
            <p class="text-lg mt-1" style="color: ${style.secondaryColor}; font-size: 16px">${data.jobTitle}</p>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-2">
              <span>${data.email}</span>
              <span>${data.phoneNumber}</span>
              <span>${data.address}</span>
            </div>
          </div>
        </header>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-3">
            <section>
              <h2 class="text-base font-bold uppercase tracking-wider border-b-2 pb-1" style="${sectionTitleStyle}">Professional Summary</h2>
              <div class="mt-1">
                <p class="text-gray-700 text-sm leading-tight">${data.professionalSummary}</p>
              </div>
            </section>
            <section>
              <h2 class="text-base font-bold uppercase tracking-wider border-b-2 pb-1" style="${sectionTitleStyle}">Work Experience</h2>
              <div class="mt-1">
                ${data.workExperience.map(exp => `
                  <div class="mt-2">
                    <div class="flex justify-between items-baseline">
                      <h3 class="font-semibold text-sm">${exp.jobTitle}</h3>
                      <p class="text-xs text-gray-500">${exp.startDate} - ${exp.endDate || 'Present'}</p>
                    </div>
                    <p class="text-xs italic text-gray-600">${exp.company}</p>
                    <p class="text-xs text-gray-700 mt-1">${exp.description}</p>
                  </div>
                `).join('')}
              </div>
            </section>
          </div>
          <div class="space-y-3">
            <section>
              <h2 class="text-base font-bold uppercase tracking-wider border-b-2 pb-1" style="${sectionTitleStyle}">Education</h2>
              <div class="mt-1">
                ${data.education.map(edu => `
                  <div>
                    <h3 class="font-semibold text-sm">${edu.degree}</h3>
                    <p class="text-xs italic text-gray-600">${edu.institution}</p>
                    <p class="text-xs text-gray-500">${edu.graduationYear}</p>
                  </div>
                `).join('')}
              </div>
            </section>
            <section>
              <h2 class="text-base font-bold uppercase tracking-wider border-b-2 pb-1" style="${sectionTitleStyle}">Skills</h2>
              <div class="mt-1">
                <div class="space-y-1">
                  ${data.skills.split(',').map(skill => `
                    <div class="text-xs">
                      <span>${skill.trim()}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    `;
  } else if (template === 'ATS Optimized') {
    return `
      <div class="max-w-[210mm] min-h-[297mm] max-h-[594mm] p-6 space-y-3" style="font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.15">
        <header class="text-center border-b-2 border-black pb-3">
          <h1 class="text-2xl font-bold uppercase mb-1">${data.fullName}</h1>
          <p class="text-lg font-semibold mb-2">${data.jobTitle}</p>
          <div class="text-xs">
            <span>${data.email} | </span>
            <span>${data.phoneNumber} | </span>
            <span>${data.address}</span>
          </div>
        </header>
        <section class="mt-3">
          <h2 class="text-base font-bold uppercase border-b border-gray-400 pb-1 mb-2">PROFESSIONAL SUMMARY</h2>
          <p class="text-xs">${data.professionalSummary}</p>
        </section>
        <section class="mt-3">
          <h2 class="text-base font-bold uppercase border-b border-gray-400 pb-1 mb-2">WORK EXPERIENCE</h2>
          ${data.workExperience.map(exp => `
            <div class="mb-2">
              <div class="flex justify-between items-baseline">
                <h3 class="font-bold text-xs">${exp.jobTitle}</h3>
                <span class="text-xs">${exp.startDate} - ${exp.endDate || 'Present'}</span>
              </div>
              <p class="text-xs font-semibold italic">${exp.company}</p>
              <p class="text-xs mt-1">${exp.description}</p>
            </div>
          `).join('')}
        </section>
        <section class="mt-3">
          <h2 class="text-base font-bold uppercase border-b border-gray-400 pb-1 mb-2">SKILLS</h2>
          <div class="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-xs">
            ${data.skills.split(',').map(skill => `
              <div class="flex items-center">
                <span class="mr-2">•</span>
                <span>${skill.trim()}</span>
              </div>
            `).join('')}
          </div>
        </section>
      </div>
    `;
  } else if (template === 'Creative') {
    return `
      <div class="max-w-[210mm] min-h-[297mm] max-h-[594mm] p-6 space-y-3" style="font-family: ${style.fontFamily}">
        <header class="text-center relative">
          <div class="absolute inset-0 bg-gradient-to-r from-red-100 to-pink-100 rounded-lg"></div>
          <div class="relative p-6">
            <h1 class="text-3xl font-bold" style="color: ${style.primaryColor}; font-size: 24px">${data.fullName}</h1>
            <p class="text-lg mt-1" style="color: ${style.primaryColor}; font-size: 16px">${data.jobTitle}</p>
            <div class="flex justify-center flex-wrap items-center gap-x-6 gap-y-2 text-xs mt-2">
              <span>${data.email}</span>
              <span>${data.phoneNumber}</span>
              <span>${data.address}</span>
            </div>
          </div>
        </header>
        <section>
          <h2 class="text-base font-bold uppercase tracking-wider border-b-2 pb-1" style="${sectionTitleStyle}">About Me</h2>
          <div class="mt-1">
            <p class="text-gray-700 text-sm leading-tight">${data.professionalSummary}</p>
          </div>
        </section>
        <section>
          <h2 class="text-base font-bold uppercase tracking-wider border-b-2 pb-1" style="${sectionTitleStyle}">Experience</h2>
          <div class="mt-1">
            ${data.workExperience.map(exp => `
              <div class="mt-2 p-3 bg-gray-50 rounded-lg">
                <div class="flex justify-between items-baseline">
                  <h3 class="font-semibold text-sm">${exp.jobTitle}</h3>
                  <p class="text-xs text-gray-500">${exp.startDate} - ${exp.endDate || 'Present'}</p>
                </div>
                <p class="text-xs italic text-gray-600">${exp.company}</p>
                <p class="text-xs text-gray-700 mt-1">${exp.description}</p>
              </div>
            `).join('')}
          </div>
        </section>
        <section>
          <h2 class="text-base font-bold uppercase tracking-wider border-b-2 pb-1" style="${sectionTitleStyle}">Skills</h2>
          <div class="mt-1">
            <div class="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-sm">
              ${data.skills.split(',').map(skill => `
                <div class="flex items-center">
                  <span class="mr-2 text-gray-500">•</span>
                  <span>${skill.trim()}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </section>
      </div>
    `;
  } else if (template === 'Tech') {
    return `
      <div class="max-w-[210mm] min-h-[297mm] max-h-[594mm] p-6 space-y-3" style="font-family: ${style.fontFamily}">
        <header class="text-center border-b border-gray-300 pb-4">
          <h1 class="text-3xl font-bold" style="color: ${style.primaryColor}; font-size: 24px">${data.fullName}</h1>
          <p class="text-lg mt-1" style="color: ${style.primaryColor}; font-size: 16px">${data.jobTitle}</p>
          <div class="flex justify-center flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-2">
            <span>${data.email}</span>
            <span>${data.phoneNumber}</span>
            <span>${data.address}</span>
          </div>
        </header>
        <section>
          <h2 class="text-base font-bold uppercase tracking-wider border-b-2 pb-1" style="${sectionTitleStyle}">Summary</h2>
          <div class="mt-1">
            <p class="text-gray-700 text-sm leading-tight">${data.professionalSummary}</p>
          </div>
        </section>
        <section>
          <h2 class="text-base font-bold uppercase tracking-wider border-b-2 pb-1" style="${sectionTitleStyle}">Experience</h2>
          <div class="mt-1">
            ${data.workExperience.map(exp => `
              <div class="mt-2">
                <div class="flex justify-between items-baseline">
                  <h3 class="font-semibold text-sm">${exp.jobTitle}</h3>
                  <p class="text-xs text-gray-500">${exp.startDate} - ${exp.endDate || 'Present'}</p>
                </div>
                <p class="text-xs italic text-gray-600">${exp.company}</p>
                <p class="text-xs text-gray-700 mt-1">${exp.description}</p>
              </div>
            `).join('')}
          </div>
        </section>
        <section>
          <h2 class="text-base font-bold uppercase tracking-wider border-b-2 pb-1" style="${sectionTitleStyle}">Skills</h2>
          <div class="mt-1">
            <div class="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-sm">
              ${data.skills.split(',').map(skill => `
                <div class="flex items-center">
                  <span class="mr-2 text-gray-500">•</span>
                  <span>${skill.trim()}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </section>
      </div>
    `;
  } else {
    // Default/Minimal template
    return `
      <div class="max-w-[210mm] min-h-[297mm] max-h-[594mm] p-6 space-y-3" style="font-family: ${style.fontFamily}">
        <header class="text-center border-b border-gray-300 pb-4">
          <h1 class="text-3xl font-bold" style="color: ${style.primaryColor}; font-size: 24px">${data.fullName}</h1>
          <p class="text-lg mt-1" style="color: ${style.primaryColor}; font-size: 16px">${data.jobTitle}</p>
          <div class="flex justify-center flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-2">
            <span>${data.email}</span>
            <span>${data.phoneNumber}</span>
            <span>${data.address}</span>
          </div>
        </header>
        <section>
          <h2 class="text-base font-bold uppercase tracking-wider border-b-2 pb-1" style="${sectionTitleStyle}">Summary</h2>
          <div class="mt-1">
            <p class="text-gray-700 text-sm leading-tight">${data.professionalSummary}</p>
          </div>
        </section>
        <section>
          <h2 class="text-base font-bold uppercase tracking-wider border-b-2 pb-1" style="${sectionTitleStyle}">Experience</h2>
          <div class="mt-1">
            ${data.workExperience.map(exp => `
              <div class="mt-2">
                <div class="flex justify-between items-baseline">
                  <h3 class="font-semibold text-sm">${exp.jobTitle}</h3>
                  <p class="text-xs text-gray-500">${exp.startDate} - ${exp.endDate || 'Present'}</p>
                </div>
                <p class="text-xs italic text-gray-600">${exp.company}</p>
                <p class="text-xs text-gray-700 mt-1">${exp.description}</p>
              </div>
            `).join('')}
          </div>
        </section>
        <section>
          <h2 class="text-base font-bold uppercase tracking-wider border-b-2 pb-1" style="${sectionTitleStyle}">Skills</h2>
          <div class="mt-1">
            <div class="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-sm">
              ${data.skills.split(',').map(skill => `
                <div class="flex items-center">
                  <span class="mr-2 text-gray-500">•</span>
                  <span>${skill.trim()}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </section>
      </div>
    `;
  }
}

async function generateTemplatePreviews() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set viewport to A4 size (210mm x 297mm at 96 DPI)
  await page.setViewportSize({ width: 794, height: 1123 }); // A4 at 96 DPI
  
  for (const templateName of templates) {
    console.log(`Generating preview for ${templateName}...`);
    
    const style = templateStyles[templateName];
    
    // Create HTML content for the template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>CV Template Preview - ${templateName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @page { size: A4; margin: 0; }
        body { margin: 0; padding: 0; }
        .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
    </style>
</head>
<body>
    <div id="cv-preview"></div>
    <script type="module">
        // Import the CV preview component (simplified for preview generation)
        const data = ${JSON.stringify(dummyData)};
        const style = ${JSON.stringify(style)};
        
        // Render the template based on the template name
        const template = '${templateName}';
        const container = document.getElementById('cv-preview');
        
        // This is a simplified version - in production, you'd import the actual React component
        // For now, we'll create a basic HTML structure that matches the template
        container.innerHTML = generateTemplateHTML(template, data, style);
        
        ${generateTemplateHTML.toString()}
    </script>
</body>
</html>
    `;
    
    // Set the HTML content
    await page.setContent(htmlContent);
    
    // Wait for the content to render
    await page.waitForTimeout(1000);
    
    // Take a screenshot of the CV preview
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 794, height: 1123 } // A4 size
    });
    
    // Save the screenshot
    const filename = `template-${templateName.toLowerCase().replace(/\s+/g, '-')}.png`;
    const filepath = path.join(__dirname, 'public', 'images', 'cv-templates', filename);
    fs.writeFileSync(filepath, screenshot);
    
    console.log(`✓ Generated ${filename}`);
  }
  
  await browser.close();
  console.log('All template previews generated successfully!');
}

generateTemplatePreviews().catch(console.error);

