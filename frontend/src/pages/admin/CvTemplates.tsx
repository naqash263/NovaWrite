import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../api/axios';
import { API_CONFIG } from '../../config/api';

interface CvTemplate {
  id: number;
  name: string;
  description: string | null;
  thumbnail: string | null;
  category: string;
  ats_score: number;
  is_active: boolean;
  is_default: boolean;
  customizable_options: string[] | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
}

interface CvTemplateFormData {
  name: string;
  description: string;
  category: string;
  ats_score: number;
  html_content: string;
  json_config: any;
  customizable_options: string[];
  thumbnail: File | null;
  field_mappings: Record<string, string>;
}

// Step Components
const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
  <div className="flex items-center justify-center mb-6">
    <div className="flex items-center space-x-4">
      {Array.from({ length: totalSteps }, (_, index) => (
        <div key={index} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            index + 1 < currentStep 
              ? 'bg-green-500 text-white' 
              : index + 1 === currentStep 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-300 text-gray-600'
          }`}>
            {index + 1 < currentStep ? '✓' : index + 1}
          </div>
          {index < totalSteps - 1 && (
            <div className={`w-12 h-1 mx-2 ${
              index + 1 < currentStep ? 'bg-green-500' : 'bg-gray-300'
            }`} />
          )}
        </div>
      ))}
    </div>
  </div>
);

const Step1BasicInfo = ({ formData, setFormData }: { formData: CvTemplateFormData; setFormData: (data: CvTemplateFormData) => void }) => (
  <div className="space-y-6">
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="text-lg font-semibold text-blue-800 mb-2">📋 Step 1: Basic Information</h4>
      <p className="text-blue-700 text-sm">
        Let's start by defining the basic details of your CV template. This information will help users understand what your template is designed for.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Template Name *
        </label>
        <Input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="e.g., Modern Professional, Executive Classic"
          required
        />
        <p className="text-xs text-gray-500 mt-1">Choose a descriptive name that reflects the template's style</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category *
        </label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({...formData, category: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="general">General - Suitable for most professions</option>
          <option value="executive">Executive - For senior leadership roles</option>
          <option value="tech">Tech - For technology professionals</option>
          <option value="creative">Creative - For designers, artists, writers</option>
          <option value="minimal">Minimal - Clean, simple design</option>
          <option value="professional">Professional - Traditional business style</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">Select the category that best fits your template's target audience</p>
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Description
      </label>
      <textarea
        value={formData.description}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
        placeholder="Describe your template's features, target audience, and unique characteristics..."
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={4}
      />
      <p className="text-xs text-gray-500 mt-1">Help users understand when to use this template</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ATS Score (1-10) *
        </label>
        <input
          type="number"
          min="1"
          max="10"
          value={formData.ats_score}
          onChange={(e) => setFormData({...formData, ats_score: parseInt(e.target.value)})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <p className="text-xs text-gray-500 mt-1">Rate how ATS-friendly this template is (10 = perfect for ATS systems)</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Thumbnail Image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFormData({...formData, thumbnail: e.target.files?.[0] || null})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">Upload a preview image of your template (optional)</p>
      </div>
    </div>

    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h5 className="font-medium text-green-800 mb-2">✅ What's Next?</h5>
      <p className="text-green-700 text-sm">
        Once you've filled in the basic information, click "Next" to proceed to Step 2 where you'll create the HTML/CSS template code.
      </p>
    </div>
  </div>
);

const Step2HTMLContent = ({ formData, setFormData }: { formData: CvTemplateFormData; setFormData: (data: CvTemplateFormData) => void }) => (
  <div className="space-y-6">
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="text-lg font-semibold text-blue-800 mb-2">💻 Step 2: HTML/CSS Template & Field Mappings</h4>
      <p className="text-blue-700 text-sm">
        Create your template's HTML and CSS code using placeholders like {'{{fullName}}'}, {'{{jobTitle}}'} etc. for dynamic content. All placeholders are automatically mapped to CV data fields.
      </p>
    </div>

    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h5 className="font-medium text-yellow-800 mb-2">💡 Template Tips:</h5>
      <ul className="text-yellow-700 text-sm space-y-1">
        <li>• Use semantic HTML elements (header, section, article, etc.)</li>
        <li>• Include CSS styles within &lt;style&gt; tags</li>
        <li>• Use placeholders like {'{{fullName}}'}, {'{{jobTitle}}'}, {'{{email}}'} for dynamic content</li>
        <li>• Keep the design clean and ATS-friendly</li>
        <li>• Use responsive CSS for mobile compatibility</li>
      </ul>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        HTML/CSS Template Code *
      </label>
      <textarea
        value={formData.html_content}
        onChange={(e) => setFormData({...formData, html_content: e.target.value})}
        placeholder={`<div class="cv-template">
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
</div>`}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        rows={20}
        required
      />
      <div className="text-xs text-gray-500 mt-1">
        <p className="mb-2">Write your complete HTML/CSS template code with placeholders for dynamic content</p>
        <div className="bg-gray-50 p-3 rounded border">
          <p className="font-semibold mb-1">Available Placeholders:</p>
          <ul className="text-xs space-y-1">
            <li><code>{"{{fullName}}"}</code>, <code>{"{{jobTitle}}"}</code>, <code>{"{{email}}"}</code>, <code>{"{{phoneNumber}}"}</code>, <code>{"{{address}}"}</code></li>
            <li><code>{"{{professionalSummary}}"}</code> - Professional summary text</li>
            <li><code>{"{{workExperience}}"}</code> - Generates formatted work experience cards</li>
            <li><code>{"{{projects}}"}</code> - Generates project cards with tech tags and links</li>
            <li><code>{"{{education}}"}</code> - Generates education entries</li>
            <li><code>{"{{certificates}}"}</code> - Generates certificate items with verification links</li>
            <li><code>{"{{languages}}"}</code> - Generates language proficiency list</li>
            <li><code>{"{{achievements}}"}</code> - Generates achievement entries</li>
            <li><code>{"{{skills}}"}</code> - Plain text skills</li>
          </ul>
          <p className="mt-2 text-xs">Empty sections are automatically hidden. Use the CSS classes shown in the example for styling.</p>
        </div>
      </div>
    </div>

    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h5 className="font-medium text-green-800 mb-2">🔗 Available Placeholders</h5>
      <p className="text-green-700 text-sm mb-3">
        All placeholders are automatically mapped to their corresponding CV data fields. No configuration needed!
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h6 className="font-medium text-gray-800 mb-2 text-sm">👤 Personal Information</h6>
          <div className="space-y-2">
            {Object.entries(formData.field_mappings).slice(0, 5).map(([placeholder, field]) => (
              <div key={placeholder} className="flex items-center justify-between p-2 bg-gray-50 rounded border text-xs">
                <span className="font-mono bg-blue-100 px-2 py-1 rounded">{placeholder}</span>
                <span className="text-gray-400 mx-1">→</span>
                <span className="text-gray-700">{field}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h6 className="font-medium text-gray-800 mb-2 text-sm">💼 Professional Content</h6>
          <div className="space-y-2">
            {Object.entries(formData.field_mappings).slice(5, 10).map(([placeholder, field]) => (
              <div key={placeholder} className="flex items-center justify-between p-2 bg-gray-50 rounded border text-xs">
                <span className="font-mono bg-blue-100 px-2 py-1 rounded">{placeholder}</span>
                <span className="text-gray-400 mx-1">→</span>
                <span className="text-gray-700">{field}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <h6 className="font-medium text-gray-800 mb-2 text-sm">📋 Additional Fields</h6>
          <div className="space-y-2">
            {Object.entries(formData.field_mappings).slice(10, 14).map(([placeholder, field]) => (
              <div key={placeholder} className="flex items-center justify-between p-2 bg-gray-50 rounded border text-xs">
                <span className="font-mono bg-blue-100 px-2 py-1 rounded">{placeholder}</span>
                <span className="text-gray-400 mx-1">→</span>
                <span className="text-gray-700">{field}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h6 className="font-medium text-gray-800 mb-2 text-sm">🎨 Styling Variables</h6>
          <div className="space-y-2">
            {Object.entries(formData.field_mappings).slice(14).map(([placeholder, field]) => (
              <div key={placeholder} className="flex items-center justify-between p-2 bg-gray-50 rounded border text-xs">
                <span className="font-mono bg-blue-100 px-2 py-1 rounded">{placeholder}</span>
                <span className="text-gray-400 mx-1">→</span>
                <span className="text-gray-700">{field}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h5 className="font-medium text-green-800 mb-2">✅ What's Next?</h5>
      <p className="text-green-700 text-sm">
        After writing your HTML/CSS code, click "Next" to preview your template in Step 3.
      </p>
    </div>
  </div>
);

const Step3Preview = ({ formData }: { formData: CvTemplateFormData }) => (
  <div className="space-y-6">
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="text-lg font-semibold text-blue-800 mb-2">👀 Step 3: Preview & Test</h4>
      <p className="text-blue-700 text-sm">
        Preview your template to see how it will look with actual CV data. This helps you verify that all placeholders are working correctly.
      </p>
    </div>

    {formData.html_content ? (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 className="font-medium text-green-800 mb-2">✅ Template Preview</h5>
          <p className="text-green-700 text-sm">
            Your template is ready for preview! The HTML content will be rendered below with sample data.
          </p>
        </div>
        
        <div className="border border-gray-300 rounded-lg p-4">
          <h5 className="font-medium mb-3 flex items-center">
            🖼️ Live Preview
          </h5>
          <div className="bg-white border rounded p-4 max-h-96 overflow-y-auto">
            <div dangerouslySetInnerHTML={{ __html: formData.html_content }} />
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h5 className="font-medium text-yellow-800 mb-2">⚠️ Preview Note</h5>
          <p className="text-yellow-700 text-sm">
            This preview shows your template structure. In the actual CV builder, placeholders like {'{{fullName}}'} will be replaced with real user data.
          </p>
        </div>
      </div>
    ) : (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h5 className="font-medium text-red-800 mb-2">❌ No HTML Content</h5>
        <p className="text-red-700 text-sm">
          Please go back to Step 2 and add your HTML/CSS template code to see the preview.
        </p>
      </div>
    )}

    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h5 className="font-medium text-green-800 mb-2">✅ What's Next?</h5>
      <p className="text-green-700 text-sm">
        If your preview looks good, click "Next" to proceed to the final step where you'll review and save your template.
      </p>
    </div>
  </div>
);

const Step4Review = ({ formData }: { formData: CvTemplateFormData }) => (
  <div className="space-y-6">
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="text-lg font-semibold text-blue-800 mb-2">🎯 Step 4: Final Review & Save</h4>
      <p className="text-blue-700 text-sm">
        Review all your template details before saving. Make sure everything looks correct!
      </p>
    </div>

    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h5 className="font-medium text-blue-800 mb-3">📋 Template Summary</h5>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Name:</span>
            <span className="text-sm text-gray-900">{formData.name || 'Not provided'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Category:</span>
            <span className="text-sm text-gray-900 capitalize">{formData.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">ATS Score:</span>
            <span className="text-sm text-gray-900">{formData.ats_score}/10</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Description:</span>
            <span className="text-sm text-gray-900">{formData.description ? 'Provided' : 'Not provided'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">HTML Content:</span>
            <span className="text-sm text-gray-900">{formData.html_content ? `${formData.html_content.length} characters` : 'Not provided'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Thumbnail:</span>
            <span className="text-sm text-gray-900">{formData.thumbnail ? 'Uploaded' : 'Not uploaded'}</span>
          </div>
        </div>
      </div>
    </div>

    {formData.html_content && (
      <div className="border border-gray-300 rounded-lg p-4">
        <h5 className="font-medium mb-3 flex items-center">
          🖼️ Final Preview
        </h5>
        <div className="bg-white border rounded p-4 max-h-64 overflow-y-auto">
          <div dangerouslySetInnerHTML={{ __html: formData.html_content }} />
        </div>
      </div>
    )}

    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h5 className="font-medium text-green-800 mb-2">🎉 Ready to Save!</h5>
      <p className="text-green-700 text-sm">
        Your template is ready! Click "Save Template" to create your new CV template. Users will be able to select and use this template in the CV builder.
      </p>
    </div>

    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h5 className="font-medium text-yellow-800 mb-2">💡 After Saving</h5>
      <p className="text-yellow-700 text-sm">
        Once saved, your template will appear in the CV builder for users to select. You can always edit it later from the templates list.
      </p>
    </div>
  </div>
);

export default function CvTemplates() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<CvTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CvTemplate | null>(null);
  
  // Step-by-step wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps] = useState(4);
  const [isWizardMode, setIsWizardMode] = useState(false);
  const [formData, setFormData] = useState<CvTemplateFormData>({
    name: '',
    description: '',
    category: 'general',
    ats_score: 8,
    html_content: `<div class="cv-template">
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
</div>`,
    json_config: {
      layout: 'single-column',
      sections: ['header', 'summary', 'experience', 'education', 'skills'],
      features: ['ATS-optimized', 'Clean layout']
    },
    customizable_options: ['primaryColor', 'secondaryColor', 'fontFamily', 'fontSize'],
    thumbnail: null,
    field_mappings: {
      '{{fullName}}': 'fullName',
      '{{jobTitle}}': 'jobTitle',
      '{{email}}': 'email',
      '{{phoneNumber}}': 'phoneNumber',
      '{{address}}': 'address',
      '{{professionalSummary}}': 'professionalSummary',
      '{{workExperience}}': 'workExperience',
      '{{education}}': 'education',
      '{{skills}}': 'skills',
      '{{projects}}': 'projects',
      '{{certificates}}': 'certificates',
      '{{languages}}': 'languages',
      '{{interests}}': 'interests',
      '{{references}}': 'references',
      '{{primaryColor}}': 'primaryColor',
      '{{secondaryColor}}': 'secondaryColor',
      '{{fontFamily}}': 'fontFamily',
      '{{fontSize}}': 'fontSize'
    },
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (user?.role === 'admin') {
      loadTemplates();
    }
  }, [user]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (activeFilter !== 'all') params.append('is_active', activeFilter === 'active' ? 'true' : 'false');

      console.log('Loading templates...');
      const response = await apiClient.get(`/admin/cv-templates?${params}`);
      const data = response.data;
      
      console.log('Templates response:', data);
      
      if (data.success) {
        const templatesData = data.data.data || data.data;
        console.log('Templates loaded:', templatesData);
        setTemplates(templatesData);
      } else {
        console.error('Failed to load templates:', data.message);
        setError(data.message || 'Failed to load templates');
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [searchTerm, categoryFilter, activeFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted!', { editingTemplate, formData });
    setError('');
    setSuccess('');

    try {
      console.log('Form data being sent:', formData);
      
      // Validate required fields before sending
      if (!formData.name.trim()) {
        setError('Template name is required');
        return;
      }
      if (!formData.category.trim()) {
        setError('Category is required');
        return;
      }
      if (!formData.html_content.trim()) {
        setError('HTML content is required');
        return;
      }
      
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('category', formData.category.trim());
      formDataToSend.append('ats_score', formData.ats_score.toString());
      formDataToSend.append('html_content', formData.html_content.trim());
      formDataToSend.append('json_config', JSON.stringify(formData.json_config || {}));
      formDataToSend.append('customizable_options', JSON.stringify(formData.customizable_options || []));
      formDataToSend.append('field_mappings', JSON.stringify(formData.field_mappings || {}));
      
      // Debug: Log what's being sent
      console.log('FormData contents:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(key, value);
      }
      
      // Only append thumbnail if it's actually a file
      if (formData.thumbnail && formData.thumbnail instanceof File) {
        console.log('Adding thumbnail file:', formData.thumbnail.name, formData.thumbnail.size);
        formDataToSend.append('thumbnail', formData.thumbnail);
      } else {
        console.log('No thumbnail file to upload');
      }

      let response;
      if (editingTemplate) {
        console.log('Updating template:', editingTemplate.id);
        // Laravel doesn't handle multipart/form-data with PUT well, so use POST with _method
        formDataToSend.append('_method', 'PUT');
        response = await apiClient.post(`/admin/cv-templates/${editingTemplate.id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log('Update response:', response.data);
        console.log('Updated template data:', response.data.data);
        console.log('Thumbnail URL:', response.data.data?.thumbnail);
      } else {
        console.log('Creating new template');
        response = await apiClient.post('/admin/cv-templates', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log('Create response:', response.data);
      }

      if (response.data.success || response.data.template) {
        setSuccess(editingTemplate ? 'Template updated successfully' : 'Template created successfully');
        setShowAddModal(false);
        setEditingTemplate(null);
        resetForm();
        loadTemplates();
      } else {
        setError(response.data.message || 'Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      if (error.response?.data?.errors) {
        console.error('Validation errors:', error.response.data.errors);
        // Log each error field separately for debugging
        Object.entries(error.response.data.errors).forEach(([field, messages]) => {
          console.error(`Field ${field}:`, messages);
        });
        const errorMessages = Object.values(error.response.data.errors).flat();
        setError(`Validation failed: ${errorMessages.join(', ')}`);
      } else {
        setError('Failed to save template');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'general',
      ats_score: 8,
      html_content: '',
      json_config: {},
      customizable_options: ['primaryColor', 'secondaryColor', 'fontFamily', 'fontSize'],
      thumbnail: null,
      field_mappings: {
        '{{fullName}}': 'fullName',
        '{{jobTitle}}': 'jobTitle',
        '{{email}}': 'email',
        '{{phoneNumber}}': 'phoneNumber',
        '{{address}}': 'address',
        '{{professionalSummary}}': 'professionalSummary',
        '{{workExperience}}': 'workExperience',
        '{{education}}': 'education',
        '{{skills}}': 'skills',
        '{{projects}}': 'projects',
        '{{certificates}}': 'certificates',
        '{{languages}}': 'languages',
        '{{interests}}': 'interests',
        '{{references}}': 'references',
        '{{primaryColor}}': 'primaryColor',
        '{{secondaryColor}}': 'secondaryColor',
        '{{fontFamily}}': 'fontFamily',
        '{{fontSize}}': 'fontSize'
      },
    });
  };

  const handleAddNew = () => {
    navigate('/admin/cv-templates/create');
  };

  // Step navigation functions
  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancelWizard = () => {
    setIsWizardMode(false);
    setCurrentStep(1);
    setShowAddModal(false);
  };

  const handleEdit = async (template: CvTemplate) => {
    try {
      setLoading(true);
      setEditingTemplate(template);
      
      // Load full template details including HTML content
      const response = await apiClient.get(`/admin/cv-templates/${template.id}`);
      
      if (response.data.success) {
        const fullTemplate = response.data.data;
        
        setFormData({
          name: fullTemplate.name,
          description: fullTemplate.description || '',
          category: fullTemplate.category,
          ats_score: fullTemplate.ats_score,
          html_content: fullTemplate.html_content || '',
          json_config: fullTemplate.json_config || {},
          customizable_options: fullTemplate.customizable_options || ['primaryColor', 'secondaryColor', 'fontFamily', 'fontSize'],
          thumbnail: null, // File input - will be null until user selects new file
          field_mappings: fullTemplate.field_mappings || {
            '{{fullName}}': 'fullName',
            '{{jobTitle}}': 'jobTitle',
            '{{email}}': 'email',
            '{{phoneNumber}}': 'phoneNumber',
            '{{address}}': 'address',
            '{{professionalSummary}}': 'professionalSummary',
            '{{workExperience}}': 'workExperience',
            '{{education}}': 'education',
            '{{skills}}': 'skills',
            '{{projects}}': 'projects',
            '{{certificates}}': 'certificates',
            '{{languages}}': 'languages',
            '{{interests}}': 'interests',
            '{{references}}': 'references',
            '{{primaryColor}}': 'primaryColor',
            '{{secondaryColor}}': 'secondaryColor',
            '{{fontFamily}}': 'fontFamily',
            '{{fontSize}}': 'fontSize'
          },
        });
      } else {
        // Fallback to basic template data if API call fails
        setFormData({
          name: template.name,
          description: template.description || '',
          category: template.category,
          ats_score: template.ats_score,
          html_content: '',
          json_config: {},
          customizable_options: template.customizable_options || ['primaryColor', 'secondaryColor', 'fontFamily', 'fontSize'],
          thumbnail: null,
          field_mappings: {
            '{{fullName}}': 'fullName',
            '{{jobTitle}}': 'jobTitle',
            '{{email}}': 'email',
            '{{phoneNumber}}': 'phoneNumber',
            '{{address}}': 'address',
            '{{professionalSummary}}': 'professionalSummary',
            '{{workExperience}}': 'workExperience',
            '{{education}}': 'education',
            '{{skills}}': 'skills',
            '{{projects}}': 'projects',
            '{{certificates}}': 'certificates',
            '{{languages}}': 'languages',
            '{{interests}}': 'interests',
            '{{references}}': 'references',
            '{{primaryColor}}': 'primaryColor',
            '{{secondaryColor}}': 'secondaryColor',
            '{{fontFamily}}': 'fontFamily',
            '{{fontSize}}': 'fontSize'
          },
        });
      }
      
      setIsWizardMode(false); // Edit mode uses single modal
      setShowAddModal(true);
    } catch (error) {
      console.error('Error loading template details:', error);
      setError('Failed to load template details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await apiClient.delete(`/admin/cv-templates/${id}`);

      if (response.data.success) {
        setSuccess('Template deleted successfully');
        loadTemplates();
      } else {
        setError(response.data.message || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      setError('Failed to delete template');
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const response = await apiClient.post(`/admin/cv-templates/${id}/toggle`);

      if (response.data.success) {
        setSuccess('Template status updated successfully');
        loadTemplates();
      } else {
        setError(response.data.message || 'Failed to update template status');
      }
    } catch (error) {
      console.error('Error toggling template:', error);
      setError('Failed to update template status');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      const response = await apiClient.post(`/admin/cv-templates/${id}/set-default`);

      if (response.data.success) {
        setSuccess('Default template updated successfully');
        loadTemplates();
      } else {
        setError(response.data.message || 'Failed to set default template');
      }
    } catch (error) {
      console.error('Error setting default template:', error);
      setError('Failed to set default template');
    }
  };

  const categories = ['general', 'executive', 'tech', 'creative', 'minimal', 'professional'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading CV Templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CV Template Management</h1>
          <p className="mt-2 text-gray-600">Create and manage CV templates for users</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button
              onClick={handleAddNew}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add New Template
            </Button>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Debug Info:</strong> Templates loaded: {templates.length} | 
            User role: {user?.role} | 
            Loading: {loading ? 'Yes' : 'No'}
          </p>
        </div>

        {/* Templates Table */}
        {templates.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || categoryFilter !== 'all' || activeFilter !== 'all' 
                  ? 'Try adjusting your search filters.' 
                  : 'Get started by creating a new template.'}
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Template
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Template
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ATS Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-80">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.map((template) => (
                  <tr key={template.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {template.thumbnail && (
                          <img
                            className="h-10 w-10 rounded-lg object-cover mr-3"
                            src={template.thumbnail.startsWith('http') ? template.thumbnail : API_CONFIG.getStorageUrl(template.thumbnail)}
                            alt={template.name}
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {template.name}
                            {template.is_default && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{template.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {template.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {template.ats_score}/10
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        template.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {template.creator?.name || 'Unknown'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-1">
                        {/* Edit Button - Always Visible */}
                        <button
                          onClick={() => handleEdit(template)}
                          className="inline-flex items-center px-2 py-1 text-xs border border-blue-500 text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                          title="Edit Template"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        
                        {/* Delete Button - Always Visible */}
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="inline-flex items-center px-2 py-1 text-xs border border-red-500 text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all duration-200"
                          title="Delete Template"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                        
                        {/* Toggle Button */}
                        <button
                          onClick={() => handleToggle(template.id)}
                          className={`inline-flex items-center px-2 py-1 text-xs border rounded hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-500 transition-all duration-200 ${
                            template.is_active 
                              ? 'border-orange-500 text-white bg-orange-600 hover:bg-orange-700' 
                              : 'border-green-500 text-white bg-green-600 hover:bg-green-700'
                          }`}
                          title={template.is_active ? 'Deactivate Template' : 'Activate Template'}
                        >
                          {template.is_active ? 'Off' : 'On'}
                        </button>
                        
                        {/* Set Default Button - Only for non-default templates */}
                        {!template.is_default && (
                          <button
                            onClick={() => handleSetDefault(template.id)}
                            className="inline-flex items-center px-2 py-1 text-xs border border-purple-500 text-white bg-purple-600 rounded hover:bg-purple-700 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all duration-200"
                            title="Set as Default Template"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Default
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}



        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingTemplate ? 'Edit Template' : (isWizardMode ? `Add New Template - Step ${currentStep} of ${totalSteps}` : 'Add New Template')}
                </h3>
                
                {isWizardMode && <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Step-based content */}
                  {isWizardMode ? (
                    <>
                      {currentStep === 1 && <Step1BasicInfo formData={formData} setFormData={setFormData} />}
                      {currentStep === 2 && <Step2HTMLContent formData={formData} setFormData={setFormData} />}
                      {currentStep === 3 && <Step3Preview formData={formData} />}
                      {currentStep === 4 && <Step4Review formData={formData} />}
                    </>
                  ) : (
                    /* Original single-modal content for editing */
                    <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Template Name *
                      </label>
                      <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="general">General</option>
                        <option value="executive">Executive</option>
                        <option value="tech">Tech</option>
                        <option value="creative">Creative</option>
                        <option value="minimal">Minimal</option>
                        <option value="professional">Professional</option>
                      </select>
                    </div>

                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ATS Score (1-10) *
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.ats_score}
                        onChange={(e) => setFormData({...formData, ats_score: parseInt(e.target.value)})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thumbnail
                      </label>
                      {editingTemplate && editingTemplate.thumbnail && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-600 mb-2">Current thumbnail:</p>
                          <img 
                            src={editingTemplate.thumbnail.startsWith('http') ? editingTemplate.thumbnail : API_CONFIG.getStorageUrl(editingTemplate.thumbnail)}
                            alt="Current thumbnail"
                            className="w-20 h-20 object-cover rounded border"
                          />
                        </div>
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFormData({...formData, thumbnail: e.target.files?.[0] || null})}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {editingTemplate ? 'Select a new image to replace current thumbnail' : 'Select an image for the template thumbnail'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      HTML Content *
                    </label>
                    <textarea
                      value={formData.html_content}
                      onChange={(e) => setFormData({...formData, html_content: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      rows={10}
                      placeholder="Enter HTML/CSS template code..."
                      required
                    />
                  </div>

                  {/* Field Mapping Section */}
                  <div className="border-t pt-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Field Mappings</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Map template placeholders to CV data fields. Use these placeholders in your HTML template.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Personal Information */}
                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-800">Personal Information</h5>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{'{{fullName}}'}</span>
                            <span className="text-sm text-gray-500">→</span>
                            <span className="text-sm text-blue-600">Full Name</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{'{{jobTitle}}'}</span>
                            <span className="text-sm text-gray-500">→</span>
                            <span className="text-sm text-blue-600">Job Title</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{'{{email}}'}</span>
                            <span className="text-sm text-gray-500">→</span>
                            <span className="text-sm text-blue-600">Email</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{'{{phoneNumber}}'}</span>
                            <span className="text-sm text-gray-500">→</span>
                            <span className="text-sm text-blue-600">Phone</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{'{{address}}'}</span>
                            <span className="text-sm text-gray-500">→</span>
                            <span className="text-sm text-blue-600">Address</span>
                          </div>
                        </div>
                      </div>

                      {/* Professional Content */}
                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-800">Professional Content</h5>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{'{{professionalSummary}}'}</span>
                            <span className="text-sm text-gray-500">→</span>
                            <span className="text-sm text-blue-600">Summary</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{'{{workExperience}}'}</span>
                            <span className="text-sm text-gray-500">→</span>
                            <span className="text-sm text-blue-600">Work Experience</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{'{{education}}'}</span>
                            <span className="text-sm text-gray-500">→</span>
                            <span className="text-sm text-blue-600">Education</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{'{{skills}}'}</span>
                            <span className="text-sm text-gray-500">→</span>
                            <span className="text-sm text-blue-600">Skills</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{'{{projects}}'}</span>
                            <span className="text-sm text-gray-500">→</span>
                            <span className="text-sm text-blue-600">Projects</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Fields */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-800">Additional Fields</h5>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{'{{certificates}}'}</span>
                            <span className="text-sm text-gray-500">→</span>
                            <span className="text-sm text-blue-600">Certificates</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{'{{languages}}'}</span>
                            <span className="text-sm text-gray-500">→</span>
                            <span className="text-sm text-blue-600">Languages</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{'{{interests}}'}</span>
                            <span className="text-sm text-gray-500">→</span>
                            <span className="text-sm text-blue-600">Interests</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{'{{references}}'}</span>
                            <span className="text-sm text-gray-500">→</span>
                            <span className="text-sm text-blue-600">References</span>
                          </div>
                        </div>
                      </div>

                      {/* Styling Variables */}
                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-800">Styling Variables</h5>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{'{{primaryColor}}'}</span>
                            <span className="text-sm text-gray-500">→</span>
                            <span className="text-sm text-blue-600">Primary Color</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{'{{secondaryColor}}'}</span>
                            <span className="text-sm text-gray-500">→</span>
                            <span className="text-sm text-blue-600">Secondary Color</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{'{{fontFamily}}'}</span>
                            <span className="text-sm text-gray-500">→</span>
                            <span className="text-sm text-blue-600">Font Family</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{'{{fontSize}}'}</span>
                            <span className="text-sm text-gray-500">→</span>
                            <span className="text-sm text-blue-600">Font Size</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Example Usage */}
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h5 className="font-medium text-blue-900 mb-2">Example Usage in HTML:</h5>
                      <pre className="text-sm text-blue-800 font-mono">
{`<div class="cv-header">
  <h1>{{fullName}}</h1>
  <p class="job-title">{{jobTitle}}</p>
  <div class="contact">
    <span>{{email}}</span>
    <span>{{phoneNumber}}</span>
    <span>{{address}}</span>
  </div>
</div>
<div class="summary">
  <h2>Professional Summary</h2>
  <p>{{professionalSummary}}</p>
</div>`}
                      </pre>
                    </div>
                  </div>

                  </>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-4 border-t">
                    <div>
                      {isWizardMode ? (
                        <Button
                          type="button"
                          onClick={handleCancelWizard}
                          className="bg-gray-300 hover:bg-gray-400 text-gray-700"
                        >
                          Cancel Wizard
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => {
                            setShowAddModal(false);
                            setEditingTemplate(null);
                            resetForm();
                          }}
                          className="bg-gray-300 hover:bg-gray-400 text-gray-700"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      {isWizardMode && currentStep > 1 && (
                        <Button
                          type="button"
                          onClick={handlePrevStep}
                          className="bg-gray-500 hover:bg-gray-600 text-white"
                        >
                          Previous
                        </Button>
                      )}
                      
                      {isWizardMode && currentStep < totalSteps ? (
                        <Button
                          type="button"
                          onClick={handleNextStep}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Next
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {editingTemplate ? 'Update Template' : 'Save Template'}
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
