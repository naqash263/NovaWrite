import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../api/axios';

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
    
    /* Available CSS classes for styling dynamic content */
    .experience-card, .project-card, .certificate-item { margin-bottom: 15px; padding: 10px; border-left: 3px solid {{primaryColor}}; }
    .item-title { font-weight: bold; font-size: 16px; margin-bottom: 5px; }
    .item-subtitle { color: {{secondaryColor}}; font-size: 14px; margin-bottom: 3px; }
    .item-date { color: #666; font-size: 12px; }
    .item-description { margin-top: 5px; font-size: 14px; line-height: 1.4; }
    .tech-tags { margin: 5px 0; }
    .tech-tag { background: #f0f0f0; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-right: 5px; }
    .project-link, .certificate-link { color: {{primaryColor}}; text-decoration: none; font-size: 12px; }
    .language-item { display: flex; justify-content: space-between; margin-bottom: 5px; }
    .proficiency-level { font-style: italic; color: #666; }
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
          <p className="font-semibold mb-2">📝 Available Placeholders:</p>
          
          <div className="space-y-3">
            <div>
              <p className="font-medium text-sm text-gray-800 mb-1">👤 Personal Information (Single Values):</p>
              <div className="flex flex-wrap gap-1 text-xs">
                <code className="bg-blue-100 px-2 py-1 rounded">{"{{fullName}}"}</code>
                <code className="bg-blue-100 px-2 py-1 rounded">{"{{jobTitle}}"}</code>
                <code className="bg-blue-100 px-2 py-1 rounded">{"{{email}}"}</code>
                <code className="bg-blue-100 px-2 py-1 rounded">{"{{phoneNumber}}"}</code>
                <code className="bg-blue-100 px-2 py-1 rounded">{"{{address}}"}</code>
                <code className="bg-blue-100 px-2 py-1 rounded">{"{{professionalSummary}}"}</code>
                <code className="bg-blue-100 px-2 py-1 rounded">{"{{skills}}"}</code>
              </div>
            </div>
            
            <div>
              <p className="font-medium text-sm text-gray-800 mb-1">📋 Array Fields (Auto-formatted HTML):</p>
              <div className="space-y-2">
                <div className="bg-white p-2 rounded border-l-4 border-green-400">
                  <p className="text-xs font-medium text-green-800">{"{{workExperience}}"}</p>
                  <p className="text-xs text-gray-600">Generates professional work experience cards with job titles, companies, dates, and descriptions</p>
                </div>
                <div className="bg-white p-2 rounded border-l-4 border-green-400">
                  <p className="text-xs font-medium text-green-800">{"{{projects}}"}</p>
                  <p className="text-xs text-gray-600">Creates project cards with tech tags, descriptions, links, and dates</p>
                </div>
                <div className="bg-white p-2 rounded border-l-4 border-green-400">
                  <p className="text-xs font-medium text-green-800">{"{{education}}"}</p>
                  <p className="text-xs text-gray-600">Formats education entries with degrees, institutions, and graduation years</p>
                </div>
                <div className="bg-white p-2 rounded border-l-4 border-green-400">
                  <p className="text-xs font-medium text-green-800">{"{{certificates}}"}</p>
                  <p className="text-xs text-gray-600">Creates certificate items with verification links and credential IDs</p>
                </div>
                <div className="bg-white p-2 rounded border-l-4 border-green-400">
                  <p className="text-xs font-medium text-green-800">{"{{languages}}"}</p>
                  <p className="text-xs text-gray-600">Shows language proficiency levels in a clean format</p>
                </div>
                <div className="bg-white p-2 rounded border-l-4 border-green-400">
                  <p className="text-xs font-medium text-green-800">{"{{achievements}}"}</p>
                  <p className="text-xs text-gray-600">Displays achievements with titles, descriptions, and dates</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs font-medium text-yellow-800 mb-1">💡 Pro Tips:</p>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• Array fields automatically generate professional HTML - no manual formatting needed!</li>
              <li>• Empty sections are automatically hidden from the final CV</li>
              <li>• Use CSS classes like <code>.experience-card</code>, <code>.project-card</code> for custom styling</li>
              <li>• All placeholders are case-sensitive and must use double curly braces</li>
            </ul>
          </div>
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
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h5 className="font-medium text-gray-800 mb-3">Template Preview</h5>
        <div className="bg-white border border-gray-300 rounded p-4 max-h-96 overflow-y-auto">
          <div dangerouslySetInnerHTML={{ __html: formData.html_content }} />
        </div>
        <p className="text-gray-600 text-xs mt-2">
          This is a preview of your template. The placeholders will be replaced with actual CV data when used.
        </p>
      </div>
    ) : (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h5 className="font-medium text-red-800 mb-2">⚠️ No Template Code</h5>
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

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h5 className="font-medium text-gray-800">Template Details</h5>
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div><strong>Name:</strong> {formData.name}</div>
          <div><strong>Category:</strong> {formData.category}</div>
          <div><strong>ATS Score:</strong> {formData.ats_score}/10</div>
          <div><strong>Description:</strong> {formData.description || 'No description provided'}</div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h5 className="font-medium text-gray-800">Template Code</h5>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">
            {formData.html_content ? (
              <div>
                <div className="font-mono text-xs bg-white p-2 rounded border max-h-32 overflow-y-auto">
                  {formData.html_content.substring(0, 200)}...
                </div>
                <p className="mt-2 text-xs">Template code length: {formData.html_content.length} characters</p>
              </div>
            ) : (
              <p className="text-red-600">No template code provided</p>
            )}
          </div>
        </div>
      </div>
    </div>

    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h5 className="font-medium text-green-800 mb-2">✅ Ready to Save</h5>
      <p className="text-green-700 text-sm">
        Click "Save Template" to create your new CV template. You can always edit it later from the templates list.
      </p>
    </div>
  </div>
);

export default function CvTemplateCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Step-by-step wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps] = useState(4);
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
      features: ['responsive', 'ats-friendly', 'print-ready']
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleCancel = () => {
    navigate('/admin/cv-templates');
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('ats_score', formData.ats_score.toString());
      formDataToSend.append('html_content', formData.html_content);
      formDataToSend.append('json_config', JSON.stringify(formData.json_config));
      formDataToSend.append('customizable_options', JSON.stringify(formData.customizable_options));
      formDataToSend.append('field_mappings', JSON.stringify(formData.field_mappings));
      
      if (formData.thumbnail) {
        formDataToSend.append('thumbnail', formData.thumbnail);
      }

        const response = await apiClient.post('/admin/cv-templates-temp', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const result = response.data;

      if (result.success) {
        setSuccess('Template created successfully!');
        setTimeout(() => {
          navigate('/admin/cv-templates');
        }, 2000);
      } else {
        setError(result.message || 'Failed to save template');
        if (result.errors) {
          console.error('Validation errors:', result.errors);
          // Display specific validation errors
          const errorMessages = Object.values(result.errors).flat().join('\n');
          setError(prev => prev + '\n' + errorMessages);
        }
      }
    } catch (error) {
      console.error('Error saving template:', error);
      setError('Failed to save template');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New CV Template</h1>
              <p className="text-gray-600 mt-1">Design a custom CV template for your users</p>
            </div>
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex items-center gap-2"
            >
              ← Back to Templates
            </Button>
          </div>

          {/* Step Indicator */}
          <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-6">
            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Success</h3>
                    <div className="mt-2 text-sm text-green-700">{success}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Step Content */}
            {currentStep === 1 && <Step1BasicInfo formData={formData} setFormData={setFormData} />}
            {currentStep === 2 && <Step2HTMLContent formData={formData} setFormData={setFormData} />}
            {currentStep === 3 && <Step3Preview formData={formData} />}
            {currentStep === 4 && <Step4Review formData={formData} />}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <div>
                {currentStep > 1 && (
                  <Button
                    type="button"
                    onClick={handlePrevStep}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    ← Previous
                  </Button>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={handleCancel}
                  variant="outline"
                >
                  Cancel
                </Button>
                
                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="flex items-center gap-2"
                  >
                    Next →
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Template'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
