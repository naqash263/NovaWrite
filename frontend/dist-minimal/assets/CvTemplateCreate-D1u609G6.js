import{d as S,c as C,r as n,j as e,a as k}from"./index-Bgvkk-Ti.js";import{B as c}from"./Button-f0ncnBbH.js";import{I as T}from"./Input-B9RkrZaw.js";const _=({currentStep:t,totalSteps:i})=>e.jsx("div",{className:"flex items-center justify-center mb-6",children:e.jsx("div",{className:"flex items-center space-x-4",children:Array.from({length:i},(s,r)=>e.jsxs("div",{className:"flex items-center",children:[e.jsx("div",{className:`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${r+1<t?"bg-green-500 text-white":r+1===t?"bg-blue-500 text-white":"bg-gray-300 text-gray-600"}`,children:r+1<t?"✓":r+1}),r<i-1&&e.jsx("div",{className:`w-12 h-1 mx-2 ${r+1<t?"bg-green-500":"bg-gray-300"}`})]},r))})}),A=({formData:t,setFormData:i})=>e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"bg-blue-50 border border-blue-200 rounded-lg p-4",children:[e.jsx("h4",{className:"text-lg font-semibold text-blue-800 mb-2",children:"📋 Step 1: Basic Information"}),e.jsx("p",{className:"text-blue-700 text-sm",children:"Let's start by defining the basic details of your CV template. This information will help users understand what your template is designed for."})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:"Template Name *"}),e.jsx(T,{type:"text",value:t.name,onChange:s=>i({...t,name:s.target.value}),placeholder:"e.g., Modern Professional, Executive Classic",required:!0}),e.jsx("p",{className:"text-xs text-gray-500 mt-1",children:"Choose a descriptive name that reflects the template's style"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:"Category *"}),e.jsxs("select",{value:t.category,onChange:s=>i({...t,category:s.target.value}),className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",required:!0,children:[e.jsx("option",{value:"general",children:"General - Suitable for most professions"}),e.jsx("option",{value:"executive",children:"Executive - For senior leadership roles"}),e.jsx("option",{value:"tech",children:"Tech - For technology professionals"}),e.jsx("option",{value:"creative",children:"Creative - For designers, artists, writers"}),e.jsx("option",{value:"minimal",children:"Minimal - Clean, simple design"}),e.jsx("option",{value:"professional",children:"Professional - Traditional business style"})]}),e.jsx("p",{className:"text-xs text-gray-500 mt-1",children:"Select the category that best fits your template's target audience"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:"Description"}),e.jsx("textarea",{value:t.description,onChange:s=>i({...t,description:s.target.value}),placeholder:"Describe your template's features, target audience, and unique characteristics...",className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",rows:4}),e.jsx("p",{className:"text-xs text-gray-500 mt-1",children:"Help users understand when to use this template"})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:"ATS Score (1-10) *"}),e.jsx("input",{type:"number",min:"1",max:"10",value:t.ats_score,onChange:s=>i({...t,ats_score:parseInt(s.target.value)}),className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",required:!0}),e.jsx("p",{className:"text-xs text-gray-500 mt-1",children:"Rate how ATS-friendly this template is (10 = perfect for ATS systems)"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:"Thumbnail Image"}),e.jsx("input",{type:"file",accept:"image/*",onChange:s=>i({...t,thumbnail:s.target.files?.[0]||null}),className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"}),e.jsx("p",{className:"text-xs text-gray-500 mt-1",children:"Upload a preview image of your template (optional)"})]})]}),e.jsxs("div",{className:"bg-green-50 border border-green-200 rounded-lg p-4",children:[e.jsx("h5",{className:"font-medium text-green-800 mb-2",children:"✅ What's Next?"}),e.jsx("p",{className:"text-green-700 text-sm",children:`Once you've filled in the basic information, click "Next" to proceed to Step 2 where you'll create the HTML/CSS template code.`})]})]}),E=({formData:t,setFormData:i})=>e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"bg-blue-50 border border-blue-200 rounded-lg p-4",children:[e.jsx("h4",{className:"text-lg font-semibold text-blue-800 mb-2",children:"💻 Step 2: HTML/CSS Template & Field Mappings"}),e.jsxs("p",{className:"text-blue-700 text-sm",children:["Create your template's HTML and CSS code using placeholders like ","{{fullName}}",", ","{{jobTitle}}"," etc. for dynamic content. All placeholders are automatically mapped to CV data fields."]})]}),e.jsxs("div",{className:"bg-yellow-50 border border-yellow-200 rounded-lg p-4",children:[e.jsx("h5",{className:"font-medium text-yellow-800 mb-2",children:"💡 Template Tips:"}),e.jsxs("ul",{className:"text-yellow-700 text-sm space-y-1",children:[e.jsx("li",{children:"• Use semantic HTML elements (header, section, article, etc.)"}),e.jsx("li",{children:"• Include CSS styles within <style> tags"}),e.jsxs("li",{children:["• Use placeholders like ","{{fullName}}",", ","{{jobTitle}}",", ","{{email}}"," for dynamic content"]}),e.jsx("li",{children:"• Keep the design clean and ATS-friendly"}),e.jsx("li",{children:"• Use responsive CSS for mobile compatibility"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:"HTML/CSS Template Code *"}),e.jsx("textarea",{value:t.html_content,onChange:s=>i({...t,html_content:s.target.value}),placeholder:`<div class="cv-template">
  <style>
    .cv-template { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; }
    .header { background: {{primaryColor}}; color: white; padding: 20px; }
    .name { font-size: 24px; font-weight: bold; }
    .job-title { font-size: 16px; margin-top: 5px; }
    
    /* Enhanced CSS classes for professional array formatting */
    .experience-card, .project-card, .certificate-item, .education-item, .achievement-item { 
      margin-bottom: 20px; 
      padding: 15px; 
      border-left: 4px solid {{primaryColor}}; 
      background: #fafafa; 
      border-radius: 0 8px 8px 0;
      transition: all 0.3s ease;
    }
    .experience-header, .project-header, .certificate-header, .education-header, .achievement-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    .item-title { font-weight: bold; font-size: 16px; color: #2c3e50; margin-bottom: 4px; }
    .item-subtitle { color: {{secondaryColor}}; font-size: 14px; font-weight: 500; margin-bottom: 4px; }
    .item-date { 
      color: #666; 
      font-size: 12px; 
      font-weight: 500;
      background: #e8f4f8;
      padding: 2px 8px;
      border-radius: 12px;
      white-space: nowrap;
    }
    .item-description { margin-top: 8px; font-size: 13px; line-height: 1.5; color: #555; }
    .tech-tags { margin: 8px 0; }
    .tech-tag { 
      background: {{primaryColor}}; 
      color: white; 
      padding: 3px 10px; 
      border-radius: 15px; 
      font-size: 11px; 
      margin-right: 6px; 
      display: inline-block;
      margin-bottom: 4px;
    }
    .project-link, .certificate-link { 
      color: {{primaryColor}}; 
      text-decoration: none; 
      font-size: 12px; 
      font-weight: 500;
      border-bottom: 1px solid transparent;
      transition: border-bottom 0.3s ease;
    }
    .project-link:hover, .certificate-link:hover {
      border-bottom-color: {{primaryColor}};
    }
    .language-item { 
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      margin-bottom: 8px; 
      padding: 8px 12px;
      background: #f8f9fa;
      border-radius: 6px;
    }
    .language-name { font-weight: 500; }
    .proficiency-level { 
      font-style: italic; 
      color: #666; 
      font-size: 12px;
      background: #e9ecef;
      padding: 2px 8px;
      border-radius: 10px;
    }
    .skills-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px;
    }
    .skill-category {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 6px;
      border-left: 3px solid {{primaryColor}};
    }
  </style>
  
  <div class="header">
    <div class="name">{{fullName}}</div>
    <div class="job-title">{{jobTitle}}</div>
    <div class="contact">
      <span>{{email}}</span> | <span>{{phoneNumber}}</span> | <span>{{address}}</span>
    </div>
  </div>
  
  <div class="content">
    <section>
      <h2>Professional Summary</h2>
      <p>{{professionalSummary}}</p>
    </section>
    
    <section>
      <h2>Work Experience</h2>
      {{workExperience}}
    </section>
    
    <section>
      <h2>Projects</h2>
      {{projects}}
    </section>
    
    <section>
      <h2>Education</h2>
      {{education}}
    </section>
    
    <section>
      <h2>Certificates</h2>
      {{certificates}}
    </section>
    
    <section>
      <h2>Languages</h2>
      {{languages}}
    </section>
    
    <section>
      <h2>Achievements</h2>
      {{achievements}}
    </section>
    
    <section>
      <h2>Skills</h2>
      {{skills}}
    </section>
  </div>
</div>`,className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm",rows:20,required:!0}),e.jsxs("div",{className:"text-xs text-gray-500 mt-1",children:[e.jsx("p",{className:"mb-2",children:"Write your complete HTML/CSS template code with placeholders for dynamic content"}),e.jsxs("div",{className:"bg-gray-50 p-3 rounded border",children:[e.jsx("p",{className:"font-semibold mb-2",children:"📝 Available Placeholders:"}),e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{children:[e.jsx("p",{className:"font-medium text-sm text-gray-800 mb-1",children:"👤 Personal Information (Single Values):"}),e.jsxs("div",{className:"flex flex-wrap gap-1 text-xs",children:[e.jsx("code",{className:"bg-blue-100 px-2 py-1 rounded",children:"{{fullName}}"}),e.jsx("code",{className:"bg-blue-100 px-2 py-1 rounded",children:"{{jobTitle}}"}),e.jsx("code",{className:"bg-blue-100 px-2 py-1 rounded",children:"{{email}}"}),e.jsx("code",{className:"bg-blue-100 px-2 py-1 rounded",children:"{{phoneNumber}}"}),e.jsx("code",{className:"bg-blue-100 px-2 py-1 rounded",children:"{{address}}"}),e.jsx("code",{className:"bg-blue-100 px-2 py-1 rounded",children:"{{professionalSummary}}"}),e.jsx("code",{className:"bg-blue-100 px-2 py-1 rounded",children:"{{skills}}"})]})]}),e.jsxs("div",{children:[e.jsx("p",{className:"font-medium text-sm text-gray-800 mb-1",children:"📋 Array Fields (Auto-formatted HTML):"}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"bg-white p-2 rounded border-l-4 border-green-400",children:[e.jsx("p",{className:"text-xs font-medium text-green-800",children:"{{workExperience}}"}),e.jsx("p",{className:"text-xs text-gray-600",children:"Generates professional work experience cards with job titles, companies, dates, and descriptions"})]}),e.jsxs("div",{className:"bg-white p-2 rounded border-l-4 border-green-400",children:[e.jsx("p",{className:"text-xs font-medium text-green-800",children:"{{projects}}"}),e.jsx("p",{className:"text-xs text-gray-600",children:"Creates project cards with tech tags, descriptions, links, and dates"})]}),e.jsxs("div",{className:"bg-white p-2 rounded border-l-4 border-green-400",children:[e.jsx("p",{className:"text-xs font-medium text-green-800",children:"{{education}}"}),e.jsx("p",{className:"text-xs text-gray-600",children:"Formats education entries with degrees, institutions, and graduation years"})]}),e.jsxs("div",{className:"bg-white p-2 rounded border-l-4 border-green-400",children:[e.jsx("p",{className:"text-xs font-medium text-green-800",children:"{{certificates}}"}),e.jsx("p",{className:"text-xs text-gray-600",children:"Creates certificate items with verification links and credential IDs"})]}),e.jsxs("div",{className:"bg-white p-2 rounded border-l-4 border-green-400",children:[e.jsx("p",{className:"text-xs font-medium text-green-800",children:"{{languages}}"}),e.jsx("p",{className:"text-xs text-gray-600",children:"Shows language proficiency levels in a clean format"})]}),e.jsxs("div",{className:"bg-white p-2 rounded border-l-4 border-green-400",children:[e.jsx("p",{className:"text-xs font-medium text-green-800",children:"{{achievements}}"}),e.jsx("p",{className:"text-xs text-gray-600",children:"Displays achievements with titles, descriptions, and dates"})]})]})]})]}),e.jsxs("div",{className:"mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded",children:[e.jsx("p",{className:"text-xs font-medium text-yellow-800 mb-1",children:"💡 Pro Tips:"}),e.jsxs("ul",{className:"text-xs text-yellow-700 space-y-1",children:[e.jsx("li",{children:"• Array fields automatically generate professional HTML - no manual formatting needed!"}),e.jsx("li",{children:"• Empty sections are automatically hidden from the final CV"}),e.jsxs("li",{children:["• Use CSS classes like ",e.jsx("code",{children:".experience-card"}),", ",e.jsx("code",{children:".project-card"})," for custom styling"]}),e.jsx("li",{children:"• All placeholders are case-sensitive and must use double curly braces"})]})]})]})]})]}),e.jsxs("div",{className:"bg-green-50 border border-green-200 rounded-lg p-4",children:[e.jsx("h5",{className:"font-medium text-green-800 mb-2",children:"🔗 Available Placeholders"}),e.jsx("p",{className:"text-green-700 text-sm mb-3",children:"All placeholders are automatically mapped to their corresponding CV data fields. No configuration needed!"}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("h6",{className:"font-medium text-gray-800 mb-2 text-sm",children:"👤 Personal Information"}),e.jsx("div",{className:"space-y-2",children:Object.entries(t.field_mappings).slice(0,5).map(([s,r])=>e.jsxs("div",{className:"flex items-center justify-between p-2 bg-gray-50 rounded border text-xs",children:[e.jsx("span",{className:"font-mono bg-blue-100 px-2 py-1 rounded",children:s}),e.jsx("span",{className:"text-gray-400 mx-1",children:"→"}),e.jsx("span",{className:"text-gray-700",children:r})]},s))})]}),e.jsxs("div",{children:[e.jsx("h6",{className:"font-medium text-gray-800 mb-2 text-sm",children:"💼 Professional Content"}),e.jsx("div",{className:"space-y-2",children:Object.entries(t.field_mappings).slice(5,10).map(([s,r])=>e.jsxs("div",{className:"flex items-center justify-between p-2 bg-gray-50 rounded border text-xs",children:[e.jsx("span",{className:"font-mono bg-blue-100 px-2 py-1 rounded",children:s}),e.jsx("span",{className:"text-gray-400 mx-1",children:"→"}),e.jsx("span",{className:"text-gray-700",children:r})]},s))})]})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4 mt-4",children:[e.jsxs("div",{children:[e.jsx("h6",{className:"font-medium text-gray-800 mb-2 text-sm",children:"📋 Additional Fields"}),e.jsx("div",{className:"space-y-2",children:Object.entries(t.field_mappings).slice(10,14).map(([s,r])=>e.jsxs("div",{className:"flex items-center justify-between p-2 bg-gray-50 rounded border text-xs",children:[e.jsx("span",{className:"font-mono bg-blue-100 px-2 py-1 rounded",children:s}),e.jsx("span",{className:"text-gray-400 mx-1",children:"→"}),e.jsx("span",{className:"text-gray-700",children:r})]},s))})]}),e.jsxs("div",{children:[e.jsx("h6",{className:"font-medium text-gray-800 mb-2 text-sm",children:"🎨 Styling Variables"}),e.jsx("div",{className:"space-y-2",children:Object.entries(t.field_mappings).slice(14).map(([s,r])=>e.jsxs("div",{className:"flex items-center justify-between p-2 bg-gray-50 rounded border text-xs",children:[e.jsx("span",{className:"font-mono bg-blue-100 px-2 py-1 rounded",children:s}),e.jsx("span",{className:"text-gray-400 mx-1",children:"→"}),e.jsx("span",{className:"text-gray-700",children:r})]},s))})]})]})]}),e.jsxs("div",{className:"bg-green-50 border border-green-200 rounded-lg p-4",children:[e.jsx("h5",{className:"font-medium text-green-800 mb-2",children:"✅ What's Next?"}),e.jsx("p",{className:"text-green-700 text-sm",children:'After writing your HTML/CSS code, click "Next" to preview your template in Step 3.'})]})]}),P=({formData:t})=>e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"bg-blue-50 border border-blue-200 rounded-lg p-4",children:[e.jsx("h4",{className:"text-lg font-semibold text-blue-800 mb-2",children:"👀 Step 3: Preview & Test"}),e.jsx("p",{className:"text-blue-700 text-sm",children:"Preview your template to see how it will look with actual CV data. This helps you verify that all placeholders are working correctly."})]}),t.html_content?e.jsxs("div",{className:"bg-gray-50 border border-gray-200 rounded-lg p-4",children:[e.jsx("h5",{className:"font-medium text-gray-800 mb-3",children:"Template Preview"}),e.jsx("div",{className:"bg-white border border-gray-300 rounded p-4 max-h-96 overflow-y-auto",children:e.jsx("div",{dangerouslySetInnerHTML:{__html:t.html_content}})}),e.jsx("p",{className:"text-gray-600 text-xs mt-2",children:"This is a preview of your template. The placeholders will be replaced with actual CV data when used."})]}):e.jsxs("div",{className:"bg-red-50 border border-red-200 rounded-lg p-4",children:[e.jsx("h5",{className:"font-medium text-red-800 mb-2",children:"⚠️ No Template Code"}),e.jsx("p",{className:"text-red-700 text-sm",children:"Please go back to Step 2 and add your HTML/CSS template code to see the preview."})]}),e.jsxs("div",{className:"bg-green-50 border border-green-200 rounded-lg p-4",children:[e.jsx("h5",{className:"font-medium text-green-800 mb-2",children:"✅ What's Next?"}),e.jsx("p",{className:"text-green-700 text-sm",children:`If your preview looks good, click "Next" to proceed to the final step where you'll review and save your template.`})]})]}),z=({formData:t})=>e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"bg-blue-50 border border-blue-200 rounded-lg p-4",children:[e.jsx("h4",{className:"text-lg font-semibold text-blue-800 mb-2",children:"🎯 Step 4: Final Review & Save"}),e.jsx("p",{className:"text-blue-700 text-sm",children:"Review all your template details before saving. Make sure everything looks correct!"})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:[e.jsxs("div",{className:"space-y-4",children:[e.jsx("h5",{className:"font-medium text-gray-800",children:"Template Details"}),e.jsxs("div",{className:"bg-gray-50 p-4 rounded-lg space-y-2",children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Name:"})," ",t.name]}),e.jsxs("div",{children:[e.jsx("strong",{children:"Category:"})," ",t.category]}),e.jsxs("div",{children:[e.jsx("strong",{children:"ATS Score:"})," ",t.ats_score,"/10"]}),e.jsxs("div",{children:[e.jsx("strong",{children:"Description:"})," ",t.description||"No description provided"]})]})]}),e.jsxs("div",{className:"space-y-4",children:[e.jsx("h5",{className:"font-medium text-gray-800",children:"Template Code"}),e.jsx("div",{className:"bg-gray-50 p-4 rounded-lg",children:e.jsx("div",{className:"text-sm text-gray-600",children:t.html_content?e.jsxs("div",{children:[e.jsxs("div",{className:"font-mono text-xs bg-white p-2 rounded border max-h-32 overflow-y-auto",children:[t.html_content.substring(0,200),"..."]}),e.jsxs("p",{className:"mt-2 text-xs",children:["Template code length: ",t.html_content.length," characters"]})]}):e.jsx("p",{className:"text-red-600",children:"No template code provided"})})})]})]}),e.jsxs("div",{className:"bg-green-50 border border-green-200 rounded-lg p-4",children:[e.jsx("h5",{className:"font-medium text-green-800 mb-2",children:"✅ Ready to Save"}),e.jsx("p",{className:"text-green-700 text-sm",children:'Click "Save Template" to create your new CV template. You can always edit it later from the templates list.'})]})]});function V(){const{user:t}=S(),i=C(),[s,r]=n.useState(1),[m]=n.useState(4),[a,x]=n.useState({name:"",description:"",category:"general",ats_score:8,html_content:`<div class="cv-template">
  <style>
    .cv-template { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; }
    .header { background: {{primaryColor}}; color: white; padding: 20px; }
    .name { font-size: 24px; font-weight: bold; }
    .job-title { font-size: 16px; margin-top: 5px; }
  </style>
  
  <div class="header">
    <div class="name">{{fullName}}</div>
    <div class="job-title">{{jobTitle}}</div>
    <div class="contact">
      <span>{{email}}</span> | <span>{{phoneNumber}}</span> | <span>{{address}}</span>
    </div>
  </div>
  
  <div class="content">
    <section>
      <h2>Professional Summary</h2>
      <p>{{professionalSummary}}</p>
    </section>
    
    <section>
      <h2>Work Experience</h2>
      {{workExperience}}
    </section>
    
    <section>
      <h2>Education</h2>
      {{education}}
    </section>
    
    <section>
      <h2>Skills</h2>
      {{skills}}
    </section>
  </div>
</div>`,json_config:{layout:"single-column",sections:["header","summary","experience","education","skills"],features:["responsive","ats-friendly","print-ready"]},customizable_options:["primaryColor","secondaryColor","fontFamily","fontSize"],thumbnail:null,field_mappings:{"{{fullName}}":"fullName","{{jobTitle}}":"jobTitle","{{email}}":"email","{{phoneNumber}}":"phoneNumber","{{address}}":"address","{{professionalSummary}}":"professionalSummary","{{workExperience}}":"workExperience","{{education}}":"education","{{skills}}":"skills","{{projects}}":"projects","{{certificates}}":"certificates","{{languages}}":"languages","{{interests}}":"interests","{{references}}":"references","{{primaryColor}}":"primaryColor","{{secondaryColor}}":"secondaryColor","{{fontFamily}}":"fontFamily","{{fontSize}}":"fontSize"}}),[p,o]=n.useState(""),[h,g]=n.useState(""),[u,b]=n.useState(!1),f=()=>{s<m&&r(s+1)},y=()=>{s>1&&r(s-1)},j=()=>{i("/admin/cv-templates")},v=async()=>{o(""),g(""),b(!0);try{const l=new FormData;l.append("name",a.name),l.append("description",a.description),l.append("category",a.category),l.append("ats_score",a.ats_score.toString()),l.append("html_content",a.html_content),l.append("json_config",JSON.stringify(a.json_config)),l.append("customizable_options",JSON.stringify(a.customizable_options)),l.append("field_mappings",JSON.stringify(a.field_mappings)),a.thumbnail&&l.append("thumbnail",a.thumbnail);const d=(await k.post("/admin/cv-templates-temp",l,{headers:{"Content-Type":"multipart/form-data"}})).data;if(d.success)g("Template created successfully!"),setTimeout(()=>{i("/admin/cv-templates")},2e3);else if(o(d.message||"Failed to save template"),d.errors){console.error("Validation errors:",d.errors);const N=Object.values(d.errors).flat().join(`
`);o(w=>w+`
`+N)}}catch(l){console.error("Error saving template:",l),o("Failed to save template")}finally{b(!1)}};return!t||t.role!=="admin"?e.jsx("div",{className:"min-h-screen bg-gray-50 flex items-center justify-center",children:e.jsxs("div",{className:"text-center",children:[e.jsx("h1",{className:"text-2xl font-bold text-gray-900 mb-4",children:"Access Denied"}),e.jsx("p",{className:"text-gray-600",children:"You need admin privileges to access this page."})]})}):e.jsx("div",{className:"min-h-screen bg-gray-50",children:e.jsxs("div",{className:"max-w-4xl mx-auto py-8 px-4",children:[e.jsxs("div",{className:"bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6",children:[e.jsxs("div",{className:"flex items-center justify-between mb-4",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold text-gray-900",children:"Create New CV Template"}),e.jsx("p",{className:"text-gray-600 mt-1",children:"Design a custom CV template for your users"})]}),e.jsx(c,{onClick:j,variant:"outline",className:"flex items-center gap-2",children:"← Back to Templates"})]}),e.jsx(_,{currentStep:s,totalSteps:m})]}),e.jsx("div",{className:"bg-white rounded-lg shadow-sm border border-gray-200 p-6",children:e.jsxs("div",{className:"space-y-6",children:[p&&e.jsx("div",{className:"bg-red-50 border border-red-200 rounded-lg p-4",children:e.jsx("div",{className:"flex",children:e.jsxs("div",{className:"ml-3",children:[e.jsx("h3",{className:"text-sm font-medium text-red-800",children:"Error"}),e.jsx("div",{className:"mt-2 text-sm text-red-700",children:p})]})})}),h&&e.jsx("div",{className:"bg-green-50 border border-green-200 rounded-lg p-4",children:e.jsx("div",{className:"flex",children:e.jsxs("div",{className:"ml-3",children:[e.jsx("h3",{className:"text-sm font-medium text-green-800",children:"Success"}),e.jsx("div",{className:"mt-2 text-sm text-green-700",children:h})]})})}),s===1&&e.jsx(A,{formData:a,setFormData:x}),s===2&&e.jsx(E,{formData:a,setFormData:x}),s===3&&e.jsx(P,{formData:a}),s===4&&e.jsx(z,{formData:a}),e.jsxs("div",{className:"flex justify-between pt-6 border-t border-gray-200",children:[e.jsx("div",{children:s>1&&e.jsx(c,{type:"button",onClick:y,variant:"outline",className:"flex items-center gap-2",children:"← Previous"})}),e.jsxs("div",{className:"flex gap-3",children:[e.jsx(c,{type:"button",onClick:j,variant:"outline",children:"Cancel"}),s<m?e.jsx(c,{type:"button",onClick:f,className:"flex items-center gap-2",children:"Next →"}):e.jsx(c,{type:"button",onClick:v,disabled:u,className:"flex items-center gap-2",children:u?"Saving...":"Save Template"})]})]})]})})]})})}export{V as default};
