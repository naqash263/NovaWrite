import React, { useState, useEffect, useRef } from 'react';
import { defaultCVData, type CVData } from '../../components/cv-builder/cv-form';
import { CvPreview } from '../../components/cv-builder/cv-preview';
import { escapeHtml, renderTemplateHtml } from '../../components/cv-builder/cv-render';
import { type CVStyle } from '../../components/cv-builder/template-customizer';
import { useToast } from '../../hooks/use-toast';
import CVExportOptions from '../../components/cv-builder/CVExportOptions';
import { API_CONFIG } from '../../config/api';
import apiClient from '../../api/axios';
import jsPDF from 'jspdf';
import CareerToolLayout from '../../components/career/CareerToolLayout';
import { builtinTemplate } from '../../components/cv-builder/builtin-template';
import { buildCvDocx } from '../../components/cv-builder/cv-docx';
import AdPlacement from '../../components/AdPlacement';


// Custom File Input Component
const FileInput = ({ onFileSelect, isProcessing, buttonText, accept = ".pdf,.doc,.docx,.txt" }: {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  buttonText: string;
  accept?: string;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear previous selection
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={isProcessing}
        className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Processing...
          </>
        ) : (
          <>
            <span className="mr-2">📁</span>
            {buttonText}
          </>
        )}
      </button>
    </div>
  );
};

// CV Upload Step Component
const CVUploadStep = ({ onExtractionComplete }: { onExtractionComplete: (extractedData: any) => void }) => {
  const { addToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionResult, setExtractionResult] = useState<any>(null);

  const handleFileUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      addToast({ type: 'error', title: 'File too large', description: 'Please upload a CV smaller than 10 MB.' });
      return;
    }
    setIsProcessing(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Call real AI extraction API
      const response = await fetch('/api/cv-ai/extract', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'CV extraction failed');
      }
      
      if (!result.success) {
        throw new Error(result.message || 'CV extraction failed');
      }
      
      // Transform API response to match our CV data structure
      const extractedData = {
        fullName: result.data.fullName || '',
        jobTitle: result.data.jobTitle || '',
        email: result.data.email || '',
        phoneNumber: result.data.phoneNumber || '',
        address: result.data.address || '',
        professionalSummary: result.data.professionalSummary || '',
        workExperience: result.data.workExperience || [],
        education: result.data.education || [],
        skills: Array.isArray(result.data.skills) ? result.data.skills.join(', ') : result.data.skills || '',
        projects: result.data.projects || [],
        languages: result.data.languages || [],
        interests: result.data.interests || [],
        references: result.data.references || [],
        certificates: result.data.certifications || [],
        achievements: result.data.achievements || []
      };
      
      setExtractionResult(extractedData);
      onExtractionComplete(extractedData);
    } catch (error) {
      console.error('CV extraction failed:', error);
      // Show error message to user
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addToast({ type: 'error', title: 'CV extraction failed', description: errorMessage });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">Upload Your CV</h2>
        <p className="text-base sm:text-lg text-gray-600">Upload your existing CV and we'll extract the information automatically using AI</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        {!extractionResult ? (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📄</span>
        </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Your CV File</h3>
              <p className="text-gray-600 mb-6">Supports PDF, DOC, DOCX, and TXT files up to 10MB</p>
          </div>
          
            <FileInput
              onFileSelect={handleFileUpload}
              isProcessing={isProcessing}
              buttonText="Choose CV File"
              accept=".pdf,.doc,.docx,.txt"
            />

            {isProcessing && (
              <div className="mt-6">
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600">AI is analyzing your CV...</span>
        </div>
                <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
          </div>
        )}
        </div>
        ) : (
        <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
          </div>
            <h3 className="text-xl font-semibold text-green-900 mb-2">CV Successfully Analyzed!</h3>
            <p className="text-gray-600 mb-6">We've extracted your information. Click "Next" to review and edit your CV.</p>
            
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h4 className="font-semibold text-gray-900 mb-2">Extracted Information:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
                <li>• Name: {extractionResult.fullName}</li>
                <li>• Job Title: {extractionResult.jobTitle}</li>
                <li>• Email: {extractionResult.email}</li>
                <li>• Experience: {extractionResult.workExperience?.length || 0} positions</li>
                <li>• Education: {extractionResult.education?.length || 0} entries</li>
                <li>• Skills: {String(extractionResult.skills || '').split(',').filter((s: string) => s.trim()).length} skills</li>
            </ul>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

// Job Tailoring Step Component
const JobTailoringStep = ({ onTailoringComplete }: { onTailoringComplete: (tailoredData: any) => void }) => {
  const { addToast } = useToast();
  const [jobDescription, setJobDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [tailoringResult, setTailoringResult] = useState<any>(null);

  const handleJobTailoring = async () => {
    if (!jobDescription.trim()) return;
    
    setIsProcessing(true);
    
    try {
      // Create base CV data for tailoring
      const baseCvData = {
        fullName: "",
        jobTitle: "",
        email: "",
        phoneNumber: "",
        address: "",
        professionalSummary: "",
        workExperience: [],
        education: [],
        skills: "",
        projects: [],
        languages: [],
        interests: [],
        references: [],
        certificates: [],
        achievements: []
      };
      
      // Call real AI tailoring API
      const response = await fetch('/api/cv-ai/tailor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          cv_data: baseCvData,
          job_description: jobDescription
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'CV tailoring failed');
      }
      
      if (!result.success) {
        throw new Error(result.message || 'CV tailoring failed');
      }
      
      // Transform API response to match our CV data structure
      const tailoredData = {
        fullName: result.data.fullName || '',
        jobTitle: result.data.jobTitle || '',
        email: result.data.email || '',
        phoneNumber: result.data.phoneNumber || '',
        address: result.data.address || '',
        professionalSummary: result.data.professionalSummary || '',
        workExperience: result.data.workExperience || [],
        education: result.data.education || [],
        skills: Array.isArray(result.data.skills) ? result.data.skills.join(', ') : result.data.skills || '',
        projects: result.data.projects || [],
        languages: result.data.languages || [],
        interests: result.data.interests || [],
        references: result.data.references || [],
        certificates: result.data.certifications || [],
        achievements: result.data.achievements || []
      };
      
      setTailoringResult(tailoredData);
      onTailoringComplete(tailoredData);
    } catch (error) {
      console.error('Job tailoring failed:', error);
      // Show error message to user
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addToast({ type: 'error', title: 'CV tailoring failed', description: errorMessage });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">Tailor Your CV to Job</h2>
        <p className="text-base sm:text-lg text-gray-600">Paste the job description and we'll optimize your CV for that specific role</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        {!tailoringResult ? (
            <div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description *
              </label>
              <textarea aria-label="Job Description"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the complete job description here..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={8}
              />
              <p className="text-sm text-gray-500 mt-2">
                Include the full job description with requirements, responsibilities, and qualifications
              </p>
            </div>

              <div className="text-center">
              <button
                onClick={handleJobTailoring}
                disabled={!jobDescription.trim() || isProcessing}
                className="inline-flex items-center px-8 py-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    AI is tailoring your CV...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🎯</span>
                    Tailor My CV
                  </>
                )}
              </button>
            </div>

            {isProcessing && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">Analyzing job requirements and optimizing your CV...</p>
                </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h3 className="text-xl font-semibold text-green-900 mb-2">CV Successfully Tailored!</h3>
            <p className="text-gray-600 mb-6">We've optimized your CV for this specific job. Click "Next" to review and edit your tailored CV.</p>
            
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h4 className="font-semibold text-gray-900 mb-2">Tailoring Results:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Optimized professional summary for the role</li>
                <li>• Highlighted relevant skills and experience</li>
                <li>• Adjusted job descriptions to match requirements</li>
                <li>• Enhanced keywords for ATS compatibility</li>
                <li>• Structured content for maximum impact</li>
              </ul>
            </div>
          </div>
          )}
      </div>
    </div>
  );
};

// AI Features Selection Component
const CREATION_MODES = [
  { mode: 'manual', icon: '✏️', title: 'Create Manually', text: 'Start from scratch with the step-by-step guide and live preview.', badge: 'Full control', tone: 'bg-purple-50 text-purple-800' },
  { mode: 'ai-upload', icon: '📄', title: 'Upload Existing CV', text: 'Upload your current CV (PDF, Word or TXT) and AI extracts the details.', badge: 'AI-powered', tone: 'bg-blue-50 text-blue-800' },
  { mode: 'ai-tailor', icon: '🎯', title: 'Tailor to Job', text: 'Paste a job description and AI drafts a CV focused on that role.', badge: 'AI-optimized', tone: 'bg-green-50 text-green-800' },
] as const;

const AIFeaturesSelection = ({ onSelectMode }: { onSelectMode: (mode: 'ai-upload' | 'ai-tailor' | 'manual') => void }) => {
  return (
    <div className="max-w-4xl mx-auto p-1 sm:p-6">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">How would you like to create your CV?</h2>
        <p className="text-base sm:text-lg text-gray-600">Choose the option that works best for you</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {CREATION_MODES.map((option) => (
          <button
            key={option.mode}
            type="button"
            onClick={() => onSelectMode(option.mode)}
            className="group rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm transition-shadow duration-200 hover:border-blue-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:p-8"
          >
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl sm:mb-4 sm:h-16 sm:w-16 sm:text-2xl" aria-hidden="true">
              {option.icon}
            </span>
            <span className="mb-1 block text-lg font-semibold text-gray-900 sm:mb-2 sm:text-xl">{option.title}</span>
            <span className="mb-3 block text-sm text-gray-600 sm:mb-4 sm:text-base">{option.text}</span>
            <span className={`inline-block rounded-lg px-3 py-1 text-xs font-medium sm:text-sm ${option.tone}`}>{option.badge}</span>
          </button>
        ))}
      </div>
    </div>
  );
};




// Step Navigation Component
const StepNavigation = ({ 
  currentStep, 
  totalSteps, 
  onNext, 
  onPrevious, 
  onFinish,
  isNextDisabled = false 
}: { 
  currentStep: number, 
  totalSteps: number, 
  onNext: () => void, 
  onPrevious: () => void,
  onFinish: () => void,
  isNextDisabled?: boolean 
}) => {
  // const progressPercentage = (currentStep / totalSteps) * 100;
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="bg-white border-t border-gray-200 px-3 sm:px-4 py-3 sm:py-4 md:py-6 sticky bottom-0 z-10 shadow-lg">
      <div className="max-w-6xl mx-auto">
        {/* Mobile Progress Bar */}
        <div className="mb-3 sm:mb-2 sm:hidden">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs text-gray-600">
              <span className="font-medium">Step {currentStep}/{totalSteps}</span>
            </div>
            <div className="text-xs text-blue-600 font-medium">
              {Math.round((currentStep / totalSteps) * 100)}%
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Minimal Progress Summary - DESKTOP ONLY */}
        <div className="mb-2 hidden sm:block">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs text-gray-600">
              <span className="font-medium">Step {currentStep}/{totalSteps}</span>
              <span className="mx-1 text-blue-600">•</span>
              <span className="text-blue-600 font-medium">{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <div className="text-xs text-gray-500">
              {isLastStep ? 'Ready!' : `${totalSteps - currentStep} remaining`}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center gap-2">
          {/* Mobile View: Simplified Navigation */}
          <div className="sm:hidden flex justify-between w-full gap-3">
        <button
          onClick={onPrevious}
              disabled={isFirstStep}
              className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200 ${
                isFirstStep
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 active:bg-gray-300'
          }`}
              aria-label="Previous step"
        >
              <span className="text-lg">←</span>
        </button>

            {/* Mobile Next/Download Button */}
            {isLastStep ? (
              <button
                onClick={onFinish}
                className="flex-1 h-11 flex items-center justify-center rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white active:from-green-700 active:to-green-800 transition-all duration-200 shadow-md font-medium"
                aria-label="Download CV"
              >
                <span className="mr-2">📄</span>
                <span>Download</span>
              </button>
            ) : (
              <button
                onClick={onNext}
                disabled={isNextDisabled}
                className={`flex-1 h-11 flex items-center justify-center rounded-lg transition-all duration-200 ${
                  isNextDisabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white active:from-blue-700 active:to-blue-800 shadow-md font-medium'
                }`}
                aria-label="Next step"
              >
                <span>Next</span>
                <span className="ml-2">→</span>
              </button>
            )}
          </div>
          
          {/* Desktop View: Show text and arrow */}
          <div className="hidden sm:block">
            <button
              onClick={onPrevious}
              disabled={isFirstStep}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                isFirstStep
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
              }`}
            >
              <span className="text-lg">←</span>
              <span>Previous</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 hidden sm:flex">
            {/* Step Dots Indicator - Hide on mobile */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i + 1}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    i + 1 <= currentStep
                      ? 'bg-blue-600'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          
          {/* Desktop View: Show text and icon for Download/Next */}
          <div className="hidden sm:block">
            {isLastStep ? (
            <button
              onClick={onFinish}
                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
                <span className="text-lg">📄</span>
              <span>Download CV</span>
            </button>
          ) : (
            <button
              onClick={onNext}
              disabled={isNextDisabled}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                isNextDisabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl'
              }`}
            >
              <span>Next</span>
                <span className="text-lg">→</span>
            </button>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Individual Step Components
const PersonalInfoStep = ({ data, onDataChange, onProfilePictureUpload }: { data: CVData, onDataChange: (data: CVData) => void, onProfilePictureUpload: (event: React.ChangeEvent<HTMLInputElement>) => void }) => {
  return (
    <div className="max-w-4xl mx-auto p-1 sm:p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Let's start with your basic information</h2>
        <p className="text-base sm:text-lg text-gray-600">This information will appear at the top of your CV</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Full Name *</label>
            <input aria-label="Full Name"
              type="text"
              value={data.fullName}
              onChange={(e) => onDataChange({ ...data, fullName: e.target.value })}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Job Title</label>
            <input aria-label="Job Title"
              type="text"
              value={data.jobTitle}
              onChange={(e) => onDataChange({ ...data, jobTitle: e.target.value })}
              placeholder="e.g., Software Engineer"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Email *</label>
            <input aria-label="Email"
              type="email"
              value={data.email}
              onChange={(e) => onDataChange({ ...data, email: e.target.value })}
              placeholder="your.email@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Phone Number</label>
            <input aria-label="Phone Number"
              type="tel"
              value={data.phoneNumber}
              onChange={(e) => onDataChange({ ...data, phoneNumber: e.target.value })}
              placeholder="+1 (555) 123-4567"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Address</label>
            <input aria-label="Address"
              type="text"
              value={data.address}
              onChange={(e) => onDataChange({ ...data, address: e.target.value })}
              placeholder="123 Main St, City, State 12345"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div className="md:col-span-2 space-y-4">
            <label className="block text-sm font-semibold text-gray-700">Profile Picture</label>
            
            {/* URL Input */}
            <div className="space-y-2">
              <label className="block text-sm text-gray-600">Or enter image URL:</label>
            <input aria-label="Or enter image URL"
              type="url"
              value={data.profilePictureUrl}
              onChange={(e) => onDataChange({ ...data, profilePictureUrl: e.target.value })}
              placeholder="https://example.com/your-photo.jpg"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <label className="block text-sm text-gray-600">Or upload image file:</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onProfilePictureUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="profile-picture-upload"
                />
                <label
                  htmlFor="profile-picture-upload"
                  className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                >
                  <div className="text-center">
                    <svg className="mx-auto h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Preview */}
            {data.profilePictureUrl && (
              <div className="mt-4">
                <label className="block text-sm text-gray-600 mb-2">Preview:</label>
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-300">
                  <img
                    src={data.profilePictureUrl}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500">Optional: Add a professional headshot</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryStep = ({ data, onDataChange }: { data: CVData, onDataChange: (data: CVData) => void }) => {
  return (
    <div className="max-w-4xl mx-auto p-1 sm:p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Tell us about yourself</h2>
        <p className="text-base sm:text-lg text-gray-600">Write a compelling professional summary that highlights your key strengths</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8">
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-700">Professional Summary</label>
          <textarea aria-label="Professional Summary"
            value={data.professionalSummary}
            onChange={(e) => onDataChange({ ...data, professionalSummary: e.target.value })}
            placeholder="Write a brief summary of your professional background and career objectives..."
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
          />
          <p className="text-sm text-gray-500">
            {(data.professionalSummary || '').length} characters (recommended: 150-300 characters)
          </p>
        </div>
      </div>
    </div>
  );
};

const ExperienceStep = ({ data, onDataChange }: { data: CVData, onDataChange: (data: CVData) => void }) => {
  const addExperience = () => {
    const newExp = {
      jobTitle: "",
      company: "",
      startDate: "",
      endDate: "",
      description: ""
    };
    onDataChange({
      ...data,
      workExperience: [...data.workExperience, newExp]
    });
  };

  const updateExperience = (index: number, field: string, value: string) => {
    const updated = [...data.workExperience];
    updated[index] = { ...updated[index], [field]: value };
    onDataChange({ ...data, workExperience: updated });
  };

  const removeExperience = (index: number) => {
    const updated = data.workExperience.filter((_, i) => i !== index);
    onDataChange({ ...data, workExperience: updated });
  };

  return (
    <div className="max-w-4xl mx-auto p-1 sm:p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Your work experience</h2>
        <p className="text-base sm:text-lg text-gray-600">List your most relevant work experience, starting with the most recent</p>
      </div>

      <div className="space-y-6">
        {data.workExperience.map((exp, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Experience {index + 1}</h3>
              {data.workExperience.length > 1 && (
                <button
                  onClick={() => removeExperience(index)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Job Title *</label>
                <input aria-label="Job Title"
                  type="text"
                  value={exp.jobTitle}
                  onChange={(e) => updateExperience(index, 'jobTitle', e.target.value)}
                  placeholder="e.g., Software Engineer"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Company *</label>
                <input aria-label="Company"
                  type="text"
                  value={exp.company}
                  onChange={(e) => updateExperience(index, 'company', e.target.value)}
                  placeholder="e.g., Tech Corp"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Start Date *</label>
                <input aria-label="Start Date"
                  type="month"
                  value={exp.startDate}
                  onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">End Date</label>
                <input aria-label="End Date"
                  type="month"
                  value={exp.endDate}
                  onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                  placeholder="Leave empty if current"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Description</label>
                <textarea aria-label="Description"
                  value={exp.description}
                  onChange={(e) => updateExperience(index, 'description', e.target.value)}
                  placeholder="Describe your responsibilities and achievements..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                />
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addExperience}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <span>+</span>
          <span>Add Another Experience</span>
        </button>
      </div>
    </div>
  );
};

const EducationStep = ({ data, onDataChange }: { data: CVData, onDataChange: (data: CVData) => void }) => {
  const addEducation = () => {
    const newEdu = {
      degree: "",
      institution: "",
      graduationYear: ""
    };
    onDataChange({
      ...data,
      education: [...data.education, newEdu]
    });
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const updated = [...data.education];
    updated[index] = { ...updated[index], [field]: value };
    onDataChange({ ...data, education: updated });
  };

  const removeEducation = (index: number) => {
    const updated = data.education.filter((_, i) => i !== index);
    onDataChange({ ...data, education: updated });
  };

  return (
    <div className="max-w-4xl mx-auto p-1 sm:p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Your education</h2>
        <p className="text-base sm:text-lg text-gray-600">Include your academic qualifications and certifications</p>
      </div>

      <div className="space-y-6">
        {data.education.map((edu, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Education {index + 1}</h3>
              {data.education.length > 1 && (
                <button
                  onClick={() => removeEducation(index)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Degree *</label>
                <input aria-label="Degree"
                  type="text"
                  value={edu.degree}
                  onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                  placeholder="e.g., Bachelor of Science"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Institution *</label>
                <input aria-label="Institution"
                  type="text"
                  value={edu.institution}
                  onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                  placeholder="e.g., University Name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Graduation Year *</label>
                <input aria-label="Graduation Year"
                  type="number"
                  value={edu.graduationYear}
                  onChange={(e) => updateEducation(index, 'graduationYear', e.target.value)}
                  placeholder="2020"
                  min="1950"
                  max="2030"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addEducation}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <span>+</span>
          <span>Add Another Education</span>
        </button>
      </div>
    </div>
  );
};

const SkillsAndProjectsStep = ({ data, onDataChange }: { data: CVData, onDataChange: (data: CVData) => void }) => {
  const addProject = () => {
    const newProject = {
      name: "",
      description: "",
      technologies: "",
      url: "",
      startDate: "",
      endDate: "",
    };
    onDataChange({
      ...data,
      projects: [...data.projects, newProject],
    });
  };

  const removeProject = (index: number) => {
    const updatedProjects = data.projects.filter((_, i) => i !== index);
    onDataChange({
      ...data,
      projects: updatedProjects,
    });
  };

  const updateProject = (index: number, field: keyof typeof data.projects[0], value: string) => {
    const updatedProjects = data.projects.map((project, i) =>
      i === index ? { ...project, [field]: value } : project
    );
    onDataChange({
      ...data,
      projects: updatedProjects,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-1 sm:p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Skills & Projects</h2>
        <p className="text-gray-600">Showcase your technical skills and portfolio projects</p>
      </div>

      <div className="space-y-8">
        {/* Skills Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">🛠️ Technical Skills</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills
            </label>
          <textarea aria-label="Skills"
            value={data.skills}
            onChange={(e) => onDataChange({ ...data, skills: e.target.value })}
              placeholder="e.g., JavaScript, React, Node.js, Python, SQL, Git, Docker, AWS"
            rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        </div>

        {/* Projects Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">🚀 Portfolio Projects</h3>
          </div>

          <div className="space-y-6">
            {data.projects.map((project, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Project {index + 1}</h4>
                  {data.projects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeProject(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Name *
                    </label>
                    <input aria-label="Project Name"
                      type="text"
                      value={project.name}
                      onChange={(e) => updateProject(index, "name", e.target.value)}
                      placeholder="e.g., E-commerce Platform"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Technologies Used
                    </label>
                    <input aria-label="Technologies Used"
                      type="text"
                      value={project.technologies}
                      onChange={(e) => updateProject(index, "technologies", e.target.value)}
                      placeholder="e.g., React, Node.js, MongoDB"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input aria-label="Start Date"
                      type="text"
                      value={project.startDate}
                      onChange={(e) => updateProject(index, "startDate", e.target.value)}
                      placeholder="e.g., Jan 2023"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input aria-label="End Date"
                      type="text"
                      value={project.endDate}
                      onChange={(e) => updateProject(index, "endDate", e.target.value)}
                      placeholder="e.g., Mar 2023 or Present"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project URL
                    </label>
                    <input aria-label="Project URL"
                      type="url"
                      value={project.url}
                      onChange={(e) => updateProject(index, "url", e.target.value)}
                      placeholder="e.g., https://github.com/username/project"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea aria-label="Description"
                      value={project.description}
                      onChange={(e) => updateProject(index, "description", e.target.value)}
                      placeholder="Describe what the project does, your role, and key achievements"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addProject}
              className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              + Add Another Project
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Tips for Skills & Projects</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• List skills relevant to your target role</li>
          <li>• Include both technical and soft skills</li>
          <li>• Showcase projects that demonstrate your abilities</li>
          <li>• Quantify your achievements where possible</li>
          <li>• Include links to live demos or GitHub repositories</li>
        </ul>
      </div>
    </div>
  );
};


const LanguagesAndInterestsStep = ({ data, onDataChange }: { data: CVData, onDataChange: (data: CVData) => void }) => {
  // Ensure languages and interests arrays exist
  const languages = data.languages || [];
  const interests = data.interests || [];

  const addLanguage = () => {
    const newLanguage = {
      language: "",
      proficiency: "Intermediate" as const,
    };
    onDataChange({
      ...data,
      languages: [...languages, newLanguage],
    });
  };

  const removeLanguage = (index: number) => {
    const updatedLanguages = languages.filter((_, i) => i !== index);
    onDataChange({
      ...data,
      languages: updatedLanguages,
    });
  };

  const updateLanguage = (index: number, field: keyof typeof languages[0], value: string) => {
    const updatedLanguages = languages.map((lang, i) =>
      i === index ? { ...lang, [field]: value } : lang
    );
    onDataChange({
      ...data,
      languages: updatedLanguages,
    });
  };

  const addInterest = () => {
    const newInterest = {
      category: "",
      items: "",
    };
    onDataChange({
      ...data,
      interests: [...interests, newInterest],
    });
  };

  const removeInterest = (index: number) => {
    const updatedInterests = interests.filter((_, i) => i !== index);
    onDataChange({
      ...data,
      interests: updatedInterests,
    });
  };

  const updateInterest = (index: number, field: keyof typeof interests[0], value: string) => {
    const updatedInterests = interests.map((interest, i) =>
      i === index ? { ...interest, [field]: value } : interest
    );
    onDataChange({
      ...data,
      interests: updatedInterests,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-1 sm:p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Languages & Interests</h2>
        <p className="text-gray-600">Add your language skills and personal interests</p>
      </div>

      <div className="space-y-8">
        {/* Languages Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">🌍 Languages</h3>
          <div className="space-y-6">
            {languages.map((language, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Language {index + 1}</h4>
                  {languages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLanguage(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language *
                    </label>
                    <input aria-label="Language"
                      type="text"
                      value={language.language}
                      onChange={(e) => updateLanguage(index, "language", e.target.value)}
                      placeholder="e.g., English, Spanish, French"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proficiency Level *
                    </label>
                    <select aria-label="Proficiency Level"
                      value={language.proficiency}
                      onChange={(e) => updateLanguage(index, "proficiency", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Fluent">Fluent</option>
                      <option value="Native">Native</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addLanguage}
              className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              + Add Another Language
            </button>
          </div>
        </div>

        {/* Interests Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">🎨 Interests & Hobbies</h3>
          <div className="space-y-6">
            {interests.map((interest, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Interest Category {index + 1}</h4>
                  {interests.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInterest(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <input aria-label="Category"
                      type="text"
                      value={interest.category}
                      onChange={(e) => updateInterest(index, "category", e.target.value)}
                      placeholder="e.g., Sports, Music, Technology, Travel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Items *
                    </label>
                    <textarea aria-label="Items"
                      value={interest.items}
                      onChange={(e) => updateInterest(index, "items", e.target.value)}
                      placeholder="e.g., Football, Basketball, Guitar, Piano, Photography, Hiking"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addInterest}
              className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              + Add Another Interest Category
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Tips for Languages & Interests</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Be honest about your language proficiency level</li>
          <li>• Include interests that show your personality</li>
          <li>• Mention activities that demonstrate relevant skills</li>
          <li>• Consider how interests might relate to the job</li>
          <li>• Include both spoken and written proficiency if different</li>
        </ul>
      </div>
    </div>
  );
};



const ReferencesStep = ({ data, onDataChange }: { data: CVData, onDataChange: (data: CVData) => void }) => {
  const addReference = () => {
    const newReference = {
      name: "",
      position: "",
      company: "",
      email: "",
      phone: "",
    };
    onDataChange({
      ...data,
      references: [...data.references, newReference],
    });
  };

  const removeReference = (index: number) => {
    const updatedReferences = data.references.filter((_, i) => i !== index);
    onDataChange({
      ...data,
      references: updatedReferences,
    });
  };

  const updateReference = (index: number, field: keyof typeof data.references[0], value: string) => {
    const updatedReferences = data.references.map((reference, i) =>
      i === index ? { ...reference, [field]: value } : reference
    );
    onDataChange({
      ...data,
      references: updatedReferences,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-1 sm:p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">References</h2>
        <p className="text-gray-600">Add professional references who can vouch for your work</p>
      </div>

      <div className="space-y-6">
        {data.references.map((reference, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reference {index + 1}</h3>
              {data.references.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeReference(index)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input aria-label="Full Name"
                  type="text"
                  value={reference.name}
                  onChange={(e) => updateReference(index, "name", e.target.value)}
                  placeholder="e.g., John Smith"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position *
                </label>
                <input aria-label="Position"
                  type="text"
                  value={reference.position}
                  onChange={(e) => updateReference(index, "position", e.target.value)}
                  placeholder="e.g., Senior Manager"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company *
                </label>
                <input aria-label="Company"
                  type="text"
                  value={reference.company}
                  onChange={(e) => updateReference(index, "company", e.target.value)}
                  placeholder="e.g., Tech Corp"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input aria-label="Email"
                  type="email"
                  value={reference.email}
                  onChange={(e) => updateReference(index, "email", e.target.value)}
                  placeholder="e.g., john@techcorp.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone (Optional)
                </label>
                <input aria-label="Phone (Optional)"
                  type="tel"
                  value={reference.phone}
                  onChange={(e) => updateReference(index, "phone", e.target.value)}
                  placeholder="e.g., +1-555-0123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addReference}
          className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
        >
          + Add Another Reference
        </button>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Tips for References</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Ask permission before listing someone as a reference</li>
          <li>• Choose references who can speak to your relevant skills</li>
          <li>• Include a mix of supervisors, colleagues, and clients</li>
          <li>• Keep contact information up to date</li>
        </ul>
      </div>
    </div>
  );
};

const CertificationsAndAchievementsStep = ({ data, onDataChange }: { data: CVData, onDataChange: (data: CVData) => void }) => {
  const addCertificate = () => {
    const newCertificate = {
      name: "",
      issuer: "",
      date: "",
      credentialId: "",
      url: ""
    };
    onDataChange({ ...data, certificates: [...(data.certificates || []), newCertificate] });
  };

  const removeCertificate = (index: number) => {
    const updatedCertificates = (data.certificates || []).filter((_, i) => i !== index);
    onDataChange({ ...data, certificates: updatedCertificates });
  };

  const updateCertificate = (index: number, field: string, value: string) => {
    const updatedCertificates = (data.certificates || []).map((cert, i) => 
      i === index ? { ...cert, [field]: value } : cert
    );
    onDataChange({ ...data, certificates: updatedCertificates });
  };

  const addAchievement = () => {
    const newAchievement = {
      title: "",
      description: "",
      date: "",
    };
    onDataChange({
      ...data,
      achievements: [...(data.achievements || []), newAchievement],
    });
  };

  const removeAchievement = (index: number) => {
    const updatedAchievements = (data.achievements || []).filter((_, i) => i !== index);
    onDataChange({
      ...data,
      achievements: updatedAchievements,
    });
  };

  const updateAchievement = (index: number, field: keyof typeof data.achievements[0], value: string) => {
    const updatedAchievements = (data.achievements || []).map((achievement, i) =>
      i === index ? { ...achievement, [field]: value } : achievement
    );
    onDataChange({
      ...data,
      achievements: updatedAchievements,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-1 sm:p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Certifications & Achievements</h2>
        <p className="text-gray-600">Showcase your professional certifications and accomplishments</p>
      </div>

      <div className="space-y-8">
        {/* Certifications Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">🏆 Professional Certifications</h3>
          <div className="space-y-6">
            {(data.certificates || []).map((certificate, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Certificate {index + 1}</h4>
                  {(data.certificates || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCertificate(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Certificate Name *
                    </label>
                    <input aria-label="Certificate Name"
                      type="text"
                      value={certificate.name}
                      onChange={(e) => updateCertificate(index, "name", e.target.value)}
                      placeholder="e.g., AWS Certified Developer"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Issuing Organization *
                    </label>
                    <input aria-label="Issuing Organization"
                      type="text"
                      value={certificate.issuer}
                      onChange={(e) => updateCertificate(index, "issuer", e.target.value)}
                      placeholder="e.g., Amazon Web Services"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date Obtained *
                    </label>
                    <input aria-label="Date Obtained"
                      type="text"
                      value={certificate.date}
                      onChange={(e) => updateCertificate(index, "date", e.target.value)}
                      placeholder="e.g., March 2023"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Credential ID
                    </label>
                    <input aria-label="Credential ID"
                      type="text"
                      value={certificate.credentialId}
                      onChange={(e) => updateCertificate(index, "credentialId", e.target.value)}
                      placeholder="e.g., AWS-123456789"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verification URL
                    </label>
                    <input aria-label="Verification URL"
                      type="url"
                      value={certificate.url}
                      onChange={(e) => updateCertificate(index, "url", e.target.value)}
                      placeholder="e.g., https://aws.amazon.com/verification"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addCertificate}
              className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              + Add Another Certificate
            </button>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">🎯 Professional Achievements</h3>
          <div className="space-y-6">
            {(data.achievements || []).map((achievement, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Achievement {index + 1}</h4>
                  {(data.achievements || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAchievement(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Achievement Title *
                    </label>
                    <input aria-label="Achievement Title"
                      type="text"
                      value={achievement.title}
                      onChange={(e) => updateAchievement(index, "title", e.target.value)}
                      placeholder="e.g., Employee of the Year, Best Innovation Award"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea aria-label="Description"
                      value={achievement.description}
                      onChange={(e) => updateAchievement(index, "description", e.target.value)}
                      placeholder="Describe what you achieved and why it's significant"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date (Optional)
                    </label>
                    <input aria-label="Date (Optional)"
                      type="text"
                      value={achievement.date}
                      onChange={(e) => updateAchievement(index, "date", e.target.value)}
                      placeholder="e.g., 2023, Q2 2023, March 2023"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addAchievement}
              className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              + Add Another Achievement
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Tips for Certifications & Achievements</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Include only relevant and recent certifications</li>
          <li>• Quantify your achievements with specific numbers</li>
          <li>• Focus on accomplishments that demonstrate your value</li>
          <li>• Include both professional and academic achievements</li>
          <li>• Provide verification URLs when available</li>
        </ul>
      </div>
    </div>
  );
};

const TemplateStep = ({ style, onStyleChange, data, templates, templatesLoading, onTemplateSelect, selectedTemplate }: { 
  style: CVStyle, 
  onStyleChange: (style: CVStyle) => void, 
  data: CVData,
  templates: any[],
  templatesLoading: boolean,
  onTemplateSelect: (template: any) => void,
  selectedTemplate: any
}) => {
  const [previewMode, setPreviewMode] = useState<'grid' | 'preview'>('grid');
  
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id.toString() === templateId);
    if (template) {
      onStyleChange({
        ...style,
        templateName: template.name || templateId,
      });
      onTemplateSelect(template);
      // Automatically switch to preview mode to show live preview
      setPreviewMode('preview');
    }
  };


  if (templatesLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-1 sm:p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Choose Your ATS-Friendly Template</h2>
        <p className="text-base sm:text-lg text-gray-600">Select a proven template that passes Applicant Tracking Systems</p>
        
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <button
            onClick={() => setPreviewMode('grid')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              previewMode === 'grid' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📋 Template Gallery
          </button>
          <button
            onClick={() => setPreviewMode('preview')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              previewMode === 'preview' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            👁️ Live Preview
          </button>
        </div>
        
        {/* ATS-Friendly Template Info */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 text-left">
          <h3 className="font-semibold text-green-900 mb-2">What makes a template ATS-friendly</h3>
          <p className="text-sm text-green-800">
            Applicant tracking systems read text, not design. A single column, standard section headings (Experience, Education, Skills)
            and real text instead of images make your CV easiest to parse. The built-in Classic ATS template follows these rules.
          </p>
        </div>
      </div>

      {previewMode === 'grid' ? (
        <div className="space-y-8">
          {/* ATS-Friendly Template Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Template gallery</h3>
            
            {templates.length === 0 ? (
              <div className="text-center py-16">
                <div className="mb-6">
                  <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
        </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">CV Templates Coming Soon!</h3>
                <p className="text-lg text-gray-600 mb-4">We're working on bringing you amazing professional CV templates.</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                  <h4 className="font-semibold text-blue-900 mb-2">🚀 What to expect:</h4>
                  <ul className="text-sm text-blue-800 text-left space-y-2">
                    <li>✓ ATS-optimized templates (score 8-10/10)</li>
                    <li>✓ Multiple professional categories (Executive, Tech, Creative, etc.)</li>
                    <li>✓ Fully customizable colors, fonts, and layouts</li>
                    <li>✓ One-click PDF export</li>
                    <li>✓ Mobile-friendly design</li>
                  </ul>
      </div>
                <p className="mt-6 text-sm text-gray-500">
                  Contact the admin to add CV templates to get started!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                <div 
                  key={template.id}
                  className={`relative rounded-lg border-2 overflow-hidden cursor-pointer transition-all hover:shadow-xl ${
                    selectedTemplate?.id === template.id 
                      ? 'border-blue-600 ring-2 ring-blue-300' 
                      : 'border-gray-200 hover:border-blue-400'
                  }`}
                  onClick={() => handleTemplateSelect(template.id.toString())}
                >
                  {/* Template Preview */}
                  <div className="aspect-[3/4] bg-gray-50 overflow-hidden relative">
                    {template.thumbnail ? (
                      <img
                        src={template.thumbnail.startsWith('http') ? template.thumbnail : API_CONFIG.getStorageUrl(template.thumbnail)}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-blue-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                            <span className="text-2xl">📄</span>
                          </div>
                          <p className="text-sm text-gray-600">Preview</p>
                        </div>
                      </div>
                    )}
                    
                    {/* ATS Score Badge */}
                    {typeof template.ats_score === 'number' && (
                    <div className="absolute top-3 right-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        template.ats_score >= 8 ? 'bg-green-100 text-green-800' :
                        template.ats_score >= 6 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        ATS {template.ats_score}/10
                      </span>
                    </div>
                    )}
                  </div>
                  
                  <div className="p-4 bg-white">
                    <div className="mb-3">
                      <h4 className="font-semibold text-gray-900">{template.name}</h4>
                      {template.is_default && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{template.description || 'Professional CV template'}</p>
                    
                    <div className="mb-3">
                      <h5 className="text-xs font-semibold text-gray-700 mb-1">Category:</h5>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {template.category}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <h5 className="text-xs font-semibold text-gray-700 mb-1">Customizable:</h5>
                      <div className="flex flex-wrap gap-1">
                        {(template.customizable_options || []).map((option: string, i: number) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {option}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      aria-pressed={selectedTemplate?.id === template.id}
                      aria-label={`${selectedTemplate?.id === template.id ? 'Selected' : 'Select'} template: ${template.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTemplateSelect(template.id.toString());
                      }}
                      className="mt-2 w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      {selectedTemplate?.id === template.id ? 'Selected' : 'Select Template'}
                    </button>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>
          
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-6">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-sm text-gray-500">
                    Template: <span className="font-medium">{selectedTemplate ? style.templateName : 'Select a template'}</span>
                  </div>
                  {selectedTemplate && (
                    <button
                      onClick={() => setPreviewMode('grid')}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      Change Template
                    </button>
                  )}
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="max-h-[800px] overflow-y-auto">
                  <CvPreview data={data} style={style} template={selectedTemplate} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PreviewStep = ({ data, style, onDownload, selectedTemplate }: { data: CVData, style: CVStyle, onDownload: (format?: string, options?: any) => void, selectedTemplate: any }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: string, options?: any) => {
    setIsExporting(true);
    try {
      await onDownload(format, options);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <CVExportOptions
      data={data}
      style={style}
      template={selectedTemplate}
      onExport={handleExport}
      isExporting={isExporting}
    />
  );
};

type ExportOptions = { pageSize?: string; margins?: string; includePageNumbers?: boolean; includeWatermark?: boolean };

// Reads builder progress saved in localStorage (synchronously, so a reload resumes
// exactly where the user left off, also under React StrictMode).
const readSaved = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};
const shouldLoadSaved = () => {
  try {
    return localStorage.getItem('cv-builder-load-saved') !== 'false';
  } catch {
    return false;
  }
};

export default function CVBuilder() {
  const [cvData, setCvData] = useState<CVData>(() => {
    const saved = shouldLoadSaved() ? readSaved<Partial<CVData>>('cv-builder-data') : null;
    return saved && typeof saved === 'object' ? { ...defaultCVData, ...saved } : defaultCVData;
  });
  const [cvStyle, setCvStyle] = useState<CVStyle>(() => {
    const fallback: CVStyle = {
      templateName: 'jobscan-executive',
      primaryColor: '#000000',
      secondaryColor: '#FFFFFF',
      fontFamily: 'Arial, sans-serif',
      fontSize: 11,
    };
    const saved = shouldLoadSaved() ? readSaved<Partial<CVStyle>>('cv-builder-style') : null;
    return saved && typeof saved === 'object' ? { ...fallback, ...saved } : fallback;
  });
  // 0 = choose how to start, 1-8 = data entry, 9 = template, 10 = export
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = Number(readSaved<number>('cv-builder-step'));
    return Number.isInteger(saved) && saved >= 0 && saved <= 10 ? saved : 0;
  });
  const [creationMode, setCreationMode] = useState<'ai-upload' | 'ai-tailor' | 'manual' | null>(null);
  const [hasProcessedData, setHasProcessedData] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(() => {
    const saved = readSaved<number[]>('cv-builder-completed-steps');
    return new Set(Array.isArray(saved) ? saved : []);
  });
  const [templates, setTemplates] = useState<any[]>([builtinTemplate]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(builtinTemplate);
  const [livePreviewOpen, setLivePreviewOpen] = useState(() => typeof window === 'undefined' || !window.matchMedia || window.matchMedia('(min-width: 1024px)').matches);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { addToast } = useToast();

  const totalSteps = 10;

  // Helper function to change step with scroll behavior
  const changeStep = (newStep: number) => {
    setCurrentStep(newStep);
    
    // Scroll to top of step content on mobile
    setTimeout(() => {
      const stepContent = document.querySelector('.step-content');
      if (stepContent) {
        stepContent.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      } else {
        // Fallback: scroll to top of page
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  // Handle profile picture upload using client-side FileReader (no backend upload)
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type - restrict to common web formats only
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      addToast({
        type: 'error',
        title: 'Invalid File Type',
        description: 'Please select a JPG, PNG, GIF, WebP, or AVIF image file'
      });
      return;
    }

    // Validate file size (1MB limit for data URLs to prevent encoding issues)
    if (file.size > 2 * 1024 * 1024) {
      addToast({
        type: 'error',
        title: 'File Too Large',
        description: 'Image file must be smaller than 2MB for data URL encoding'
      });
      return;
    }

    try {
      // Use FileReader to convert image to data URL
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          try {
            // Get data URL
            const dataUrl = e.target.result as string;
            
            // Validate the data URL format
            if (!dataUrl.startsWith('data:image/')) {
              throw new Error('Invalid data URL format');
            }
            
            // Test JSON encoding to ensure it can be stored properly
            const testObject = { url: dataUrl };
            JSON.stringify(testObject);
            
            // Update the profile picture URL with data URL
            setCvData(prev => ({ ...prev, profilePictureUrl: dataUrl }));
            
            // Save to localStorage immediately to test JSON encoding
            const currentData = localStorage.getItem('cv-builder-data');
            if (currentData) {
              try {
                const parsedData = JSON.parse(currentData);
                parsedData.profilePictureUrl = dataUrl;
                localStorage.setItem('cv-builder-data', JSON.stringify(parsedData));
              } catch (storageError) {
                console.error('Error updating localStorage with profile picture:', storageError);
                throw new Error('Failed to store profile picture data');
              }
            }
            
            addToast({
              type: 'success',
              title: 'Profile Picture Added',
              description: 'Your profile picture has been added successfully.'
            });
          } catch (jsonError) {
            console.error('Error with data URL encoding:', jsonError);
            addToast({
              type: 'error',
              title: 'Encoding Error',
              description: 'The image contains invalid characters. Please try a different image.'
            });
          }
        }
      };
      
      reader.onerror = () => {
        throw new Error('Failed to read file');
      };
      
      // Read the file as a data URL
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing profile picture:', error);
      addToast({
        type: 'error',
        title: 'Upload Failed',
        description: 'Failed to process profile picture. Please try again.'
      });
    }
  };


  // Load admin-managed templates from the API; the built-in template is always available.
  useEffect(() => {
    let cancelled = false;
    const loadTemplates = async () => {
      try {
        const response = await apiClient.get('/cv-templates');
        const data = response.data;
        const apiTemplates: any[] = data?.success && Array.isArray(data.data) ? data.data.filter((t: any) => t?.html_content) : [];
        if (cancelled || apiTemplates.length === 0) return;
        setTemplates([builtinTemplate, ...apiTemplates]);
        let savedId: string | null = null;
        try {
          savedId = localStorage.getItem('cv-builder-template-id');
        } catch {
          savedId = null;
        }
        const saved = savedId ? [builtinTemplate, ...apiTemplates].find((t: any) => String(t.id) === savedId) : null;
        const initial = saved || apiTemplates.find((t: any) => t.is_default) || apiTemplates[0];
        if (initial) {
          setSelectedTemplate(initial);
          setCvStyle((prev) => ({ ...prev, templateName: initial.name || String(initial.id) }));
        }
      } catch (error) {
        console.warn('CV templates could not be loaded; using the built-in template.', error);
      } finally {
        if (!cancelled) setTemplatesLoading(false);
      }
    };

    loadTemplates();
    return () => {
      cancelled = true;
    };
  }, []);

  // Remember the template the user picks between visits.
  const chooseTemplate = (template: any) => {
    setSelectedTemplate(template);
    try {
      if (template?.id !== undefined) localStorage.setItem('cv-builder-template-id', String(template.id));
    } catch {
      /* storage unavailable */
    }
  };

  // Function to mark a step as completed
  const markStepCompleted = (step: number) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  };


  // Auto-save functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
      localStorage.setItem('cv-builder-data', JSON.stringify(cvData));
      } catch (error) {
        console.error('Error saving CV data to localStorage:', error);
        
        // Try to save a sanitized version
        try {
          const sanitizedData = sanitizeCvData(cvData);
          localStorage.setItem('cv-builder-data', JSON.stringify(sanitizedData));
          
          // Update state with sanitized data
          setCvData(sanitizedData);
        } catch (sanitizeError) {
          console.error('Failed to save even sanitized data:', sanitizeError);
          addToast({
            type: 'error',
            title: 'Save Error',
            description: 'Failed to save your CV data. Please try removing the profile picture.',
            duration: 5000
          });
        }
      }
      localStorage.setItem('cv-builder-style', JSON.stringify(cvStyle));
      localStorage.setItem('cv-builder-completed-steps', JSON.stringify(Array.from(completedSteps)));
    }, 1000);

    return () => clearTimeout(timer);
  }, [cvData, cvStyle, completedSteps]);

  // Save current step
  useEffect(() => {
    try {
      localStorage.setItem('cv-builder-step', currentStep.toString());
    } catch {
      /* storage unavailable */
    }
  }, [currentStep]);

  // Auto-advance to step 1 when creation mode is selected
  useEffect(() => {
    if (creationMode && currentStep === 0) {
      changeStep(1);
    }
  }, [creationMode, currentStep]);

  // Reset processed data flag and clear CV data when creation mode changes
  useEffect(() => {
    setHasProcessedData(false);
    // Clear CV data when switching to upload or tailor modes
    if (creationMode === 'ai-upload' || creationMode === 'ai-tailor') {
      setCvData({
        fullName: '',
        jobTitle: '',
        email: '',
        phoneNumber: '',
        address: '',
        profilePictureUrl: '',
        professionalSummary: '',
        workExperience: [],
        education: [],
        skills: "",
        projects: [],
        languages: [],
        interests: [],
        references: [],
        certificates: [],
        achievements: []
      });
    }
  }, [creationMode]);

  // Handle CV extraction completion
  const handleCVExtractionComplete = (extractedData: any) => {
    // Update CV data with extracted information
    setCvData(prevData => ({
      ...prevData,
      ...extractedData
    }));
    
    // Mark that data has been processed
    setHasProcessedData(true);
    
    // Mark step as completed and advance to Personal Info step (step 1)
    markStepCompleted(1);
    changeStep(1);
    
    addToast({
      type: 'success',
      title: 'CV Extracted Successfully',
      description: 'Your CV information has been extracted and populated. Please review and edit the details in the Personal Info step.',
      duration: 5000
    });
  };

  // Handle job tailoring completion
  const handleJobTailoringComplete = (tailoredData: any) => {
    // Update CV data with tailored information
    setCvData(prevData => ({
      ...prevData,
      ...tailoredData
    }));
    
    // Mark that data has been processed
    setHasProcessedData(true);
    
    // Mark step as completed and advance to Personal Info step (step 1)
    markStepCompleted(1);
    changeStep(1);
    
    addToast({
      type: 'success',
      title: 'CV Tailored Successfully',
      description: 'Your CV has been optimized for the job. Please review and edit the tailored content in the Personal Info step.',
      duration: 5000
    });
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      // Mark current step as completed before moving to next
      markStepCompleted(currentStep);
      changeStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      changeStep(currentStep - 1);
    }
  };

  const handleClear = () => {
    setShowClearConfirm(true);
  };

  const confirmClear = () => {
    // Reset all state to defaults
    setCvData(defaultCVData);
    setCvStyle({
      templateName: 'jobscan-executive',
      primaryColor: '#000000',
      secondaryColor: '#FFFFFF',
      fontFamily: 'Arial, sans-serif',
      fontSize: 11,
    });
    changeStep(0);
    setCreationMode(null);
    setHasProcessedData(false);
    setCompletedSteps(new Set());
    
    // Clear localStorage
    localStorage.removeItem('cv-builder-data');
    
    // Close modal
    setShowClearConfirm(false);
    
    addToast({
      type: 'success',
      title: 'Reset Complete',
      description: 'You can now start creating your CV from the beginning.',
      duration: 3000
    });
  };

  // Sanitize CV data to prevent JSON encoding issues
  const sanitizeCvData = (data: any): any => {
    // Create a deep copy to avoid modifying the original
    const sanitized = JSON.parse(JSON.stringify({ ...data }));
    
    // Check if profilePictureUrl is causing issues
    if (sanitized.profilePictureUrl && typeof sanitized.profilePictureUrl === 'string') {
      try {
        // Test if it can be properly JSON encoded
        const test = { url: sanitized.profilePictureUrl };
        JSON.stringify(test);
      } catch (error) {
        // If there's an error, remove the problematic field
        console.warn('Removed invalid profilePictureUrl due to JSON encoding issues');
        sanitized.profilePictureUrl = '';
      }
    }
    
    return sanitized;
  };

  const handleFinish = async (format: string = 'pdf', options: any = {}) => {
    try {
      // Sanitize CV data before exporting to prevent JSON encoding issues
      try {
        // Test if the current data can be properly JSON encoded
        JSON.stringify(cvData);
      } catch (jsonError) {
        console.warn('CV data has JSON encoding issues, sanitizing...', jsonError);
        const sanitizedData = sanitizeCvData(cvData);
        setCvData(sanitizedData);
        
        // Allow time for the component to re-render with sanitized data
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Handle different export formats
      switch (format) {
        case 'pdf':
          await exportAsPDF(options);
          break;
        case 'docx':
          await exportAsDOCX(options);
          break;
        case 'html':
          await exportAsHTML(options);
          break;
        case 'txt':
          await exportAsTXT(options);
          break;
      default:
          await exportAsPDF(options);
      }
    } catch (error) {
      console.error('Export error:', error);
      addToast({
        type: 'error',
        title: 'Export Failed',
        description: 'Failed to export CV. Please try again.',
        duration: 5000
      });
    }
  };


  // Safe file name: keep letters, numbers, spaces, dots and dashes.
  const exportFileBase = () =>
    (cvData.fullName || 'CV')
      .replace(/[^\p{L}\p{N} ._-]+/gu, ' ')
      .trim()
      .replace(/\s+/g, '_') || 'CV';

  const exportAsPDF = async (options: ExportOptions = {}): Promise<void> => {
    try {
      const previewElement = document.querySelector('[data-cv-preview]');
      const templateHTML = previewElement ? previewElement.innerHTML : renderTemplateHtml(cvData, cvStyle, selectedTemplate);

      const pageSize = (options.pageSize || 'A4').toLowerCase() as 'a4' | 'letter' | 'legal';
      const marginMm = options.margins === 'narrow' ? 12.7 : options.margins === 'wide' ? 38.1 : 25.4;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: pageSize, putOnlyUsedFonts: true, compress: true });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentWidth = pageWidth - marginMm * 2;
      // Lay the template out at the printable width in CSS pixels (96 dpi) so 1px = 1px on paper.
      const renderWidthPx = Math.round((contentWidth / 25.4) * 96);

      const container = document.createElement('div');
      container.style.cssText = `width:${renderWidthPx}px;background:#fff;color:#1f2937;font-family:Arial, sans-serif;`;
      container.innerHTML = templateHTML;

      await pdf.html(container, {
        x: 0,
        y: 0,
        margin: [marginMm, marginMm, marginMm, marginMm],
        width: contentWidth,
        windowWidth: renderWidthPx,
        autoPaging: 'text',
        html2canvas: { useCORS: true, backgroundColor: '#ffffff', logging: false },
      });

      // html2canvas can leave its overlay behind; remove it so the page stays clickable.
      document.querySelectorAll('.html2pdf__overlay').forEach((overlay) => overlay.remove());

      const pages = pdf.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(120);
        if (options.includePageNumbers) pdf.text(`Page ${i} of ${pages}`, pageWidth - marginMm, pageHeight - 6, { align: 'right' });
        if (options.includeWatermark) pdf.text("Created with Naqash Thaheem's CV Builder", marginMm, pageHeight - 6);
      }

      pdf.save(`${exportFileBase()}_Resume.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      addToast({
        type: 'error',
        title: 'PDF Export Failed',
        description: 'Failed to export as PDF. Please try again or download the Word version.',
        duration: 5000
      });
      throw error; // Re-throw to ensure the Promise is rejected
    }
  };

  const exportAsTXT = async (_options: any): Promise<void> => {
    try {
      // Get the preview element that contains the rendered template
      const previewElement = document.querySelector('[data-cv-preview]');
      if (!previewElement) {
        throw new Error('CV preview element not found');
      }
      
      // Get the rendered template HTML from the preview element
      const templateHTML = previewElement.innerHTML;
      
      // Convert HTML to plain text while preserving structure
      // Create a temporary div to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = templateHTML;
      
      // Function to convert HTML to plain text with proper formatting
      const htmlToText = (element: Element): string => {
        let text = '';
        
        // Handle different element types
        if (element.nodeType === Node.TEXT_NODE) {
          return element.textContent || '';
        }
        
        if (element.nodeType === Node.ELEMENT_NODE) {
          const tagName = element.tagName.toLowerCase();
          
          // Add line breaks for block elements
          if (['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'section', 'article'].includes(tagName)) {
            text += '\n';
          }
          
          // Add extra line breaks for headings
          if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
            text += '\n';
          }
          
          // Process child nodes
          for (const child of element.childNodes) {
            text += htmlToText(child as Element);
          }
          
          // Add line breaks after block elements
          if (['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'section', 'article'].includes(tagName)) {
            text += '\n';
          }
        }
        
        return text;
      };
      
      // Convert the template HTML to plain text
      let txtContent = htmlToText(tempDiv);
      
      // Clean up the text
      txtContent = txtContent
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
        .replace(/^\s+|\s+$/g, '') // Trim whitespace
        .replace(/\n\s+/g, '\n') // Remove leading spaces from lines
        .replace(/\s+\n/g, '\n'); // Remove trailing spaces from lines
      
      // Add a header to indicate this is a CV
      txtContent = `CURRICULUM VITAE\n${'='.repeat(50)}\n\n${txtContent}`;
      
      // Create and download the file
      const blob = new Blob([txtContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportFileBase()}_Resume.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating TXT:', error);
      addToast({
        type: 'error',
        title: 'Export Failed',
        description: 'Failed to export as TXT. Please try again.',
        duration: 5000
      });
      throw error; // Re-throw to ensure the Promise is rejected
    }
  };

  const exportAsDOCX = async (_options: any): Promise<void> => {
    try {
      const blob = await buildCvDocx(cvData, cvStyle.primaryColor, { pageSize: _options?.pageSize, margins: _options?.margins });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportFileBase()}_Resume.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Error generating DOCX:', error);
      addToast({
        type: 'error',
        title: 'Export Failed',
        description: 'Failed to export as Word. Please try again.',
        duration: 5000
      });
      throw error;
    }
  };

  const exportAsHTML = async (_options: any): Promise<void> => {
    try {
      // Get the preview element that contains the rendered template
      const previewElement = document.querySelector('[data-cv-preview]');
      if (!previewElement) {
        throw new Error('CV preview element not found');
      }
      
      // Get the already-processed template HTML from the preview element
      const templateHTML = previewElement.innerHTML;
      
      // Create HTML document with the template HTML
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${escapeHtml(cvData.fullName || 'CV')} - Resume</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .cv-template {
              max-width: 800px;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          ${templateHTML}
        </body>
        </html>
      `;
      
      // Create and download the HTML file
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportFileBase()}_Resume.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating HTML:', error);
      addToast({
        type: 'error',
        title: 'Export Failed',
        description: 'Failed to export as HTML. Please try again.',
        duration: 5000
      });
      throw error; // Re-throw to ensure the Promise is rejected
    }
  };

  const handleDownload = async (format?: string, options?: any) => {
    if (!format) return;
    
    try {
      switch (format) {
        case 'pdf':
          await exportAsPDF(options);
          break;
        case 'docx':
          await exportAsDOCX(options);
          break;
        case 'html':
          await exportAsHTML(options);
          break;
        case 'txt':
          await exportAsTXT(options);
          break;
        default:
          console.warn('Unknown export format:', format);
      }
    } catch (error) {
      console.error('Export failed:', error);
      addToast({
        type: 'error',
        title: 'Export Failed',
        description: 'Failed to export CV. Please try again.',
        duration: 5000
      });
    }
  };

  // Live preview beside the form for the data-entry steps (not while uploading/tailoring).
  const showLivePreview =
    currentStep >= 1 && currentStep <= 8 && !(currentStep === 1 && (creationMode === 'ai-upload' || creationMode === 'ai-tailor') && !hasProcessedData);

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <AIFeaturesSelection onSelectMode={setCreationMode} />;
      case 1:
        // Show different content based on creation mode and whether data has been processed
        if (creationMode === 'ai-upload' && !hasProcessedData) {
          return <CVUploadStep onExtractionComplete={handleCVExtractionComplete} />;
        } else if (creationMode === 'ai-tailor' && !hasProcessedData) {
          return <JobTailoringStep onTailoringComplete={handleJobTailoringComplete} />;
        } else {
          return <PersonalInfoStep data={cvData} onDataChange={setCvData} onProfilePictureUpload={handleProfilePictureUpload} />;
        }
      case 2:
        return <SummaryStep data={cvData} onDataChange={setCvData} />;
      case 3:
        return <ExperienceStep data={cvData} onDataChange={setCvData} />;
      case 4:
        return <EducationStep data={cvData} onDataChange={setCvData} />;
      case 5:
        return <SkillsAndProjectsStep data={cvData} onDataChange={setCvData} />;
      case 6:
        return <LanguagesAndInterestsStep data={cvData} onDataChange={setCvData} />;
      case 7:
        return <ReferencesStep data={cvData} onDataChange={setCvData} />;
      case 8:
        return <CertificationsAndAchievementsStep data={cvData} onDataChange={setCvData} />;
      case 9:
        return <TemplateStep 
          style={cvStyle} 
          onStyleChange={setCvStyle} 
          data={cvData} 
          templates={templates} 
          templatesLoading={templatesLoading} 
          onTemplateSelect={chooseTemplate} 
          selectedTemplate={selectedTemplate} 
        />;
      case 10:
        return <PreviewStep 
          data={cvData} 
          style={cvStyle} 
          onDownload={handleDownload} 
          selectedTemplate={selectedTemplate} 
        />;
      default:
        return <div>Step not found</div>;
    }
  };

  return (
    <CareerToolLayout slug="cv-builder">
      <div>
        {/* Ad Placement - Top */}
        <AdPlacement position="content-top" className="mb-6" />

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Clear Button - Top Right */}
          <div className="flex justify-end items-center p-3 sm:p-4 md:p-6 pb-0">
              <button
              onClick={handleClear}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 border border-blue-200"
              aria-label="Start from beginning"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Start from Beginning</span>
              <span className="sm:hidden">Reset</span>
              </button>
      </div>

          <div className="p-3 sm:p-4 md:p-6 pt-2 sm:pt-3 md:pt-4">
            <div
              className={`mb-4 sm:mb-6 md:mb-8 step-content ${
                showLivePreview && livePreviewOpen ? 'grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,460px)]' : ''
              }`}
            >
              <div className="min-w-0">{renderStepContent()}</div>
              {showLivePreview && (
                <aside aria-labelledby="cv-live-preview-heading" className="min-w-0 xl:sticky xl:top-4 xl:self-start">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <h2 id="cv-live-preview-heading" className="text-lg font-semibold text-gray-900">
                        Live preview
                      </h2>
                      <button
                        type="button"
                        onClick={() => setLivePreviewOpen((open) => !open)}
                        aria-expanded={livePreviewOpen}
                        aria-controls="cv-live-preview"
                        className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {livePreviewOpen ? 'Hide preview' : 'Show preview'}
                      </button>
                    </div>
                    {livePreviewOpen && (
                      <div id="cv-live-preview" data-testid="cv-live-preview" className="max-h-[75vh] overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                        <CvPreview data={cvData} style={cvStyle} template={selectedTemplate} />
                      </div>
                    )}
                    {livePreviewOpen && (
                      <p className="mt-2 text-xs text-gray-500">
                        Template: {selectedTemplate?.name || 'Classic ATS'}. Change it in step 9. Empty sections are hidden automatically.
                      </p>
                    )}
                  </div>
                </aside>
              )}
            </div>

        {/* Ad Placement - Middle (between content and navigation) */}
        <AdPlacement position="content-middle" className="mb-6" />

        {currentStep > 0 && <StepNavigation
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onFinish={handleFinish}
            />}
          </div>
        </div>

        {/* Ad Placement - Bottom */}
        <AdPlacement position="content-bottom" className="mt-8" />

        {/* Clear Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-3" onClick={() => setShowClearConfirm(false)}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 sm:p-6">
                {/* Icon */}
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 bg-blue-100 rounded-full">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>

                {/* Title */}
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 text-center mb-2">
                  Start from Beginning?
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm text-gray-600 text-center mb-4 sm:mb-6 px-2">
                  This will reset your CV builder and take you back to the start. Your current progress will be cleared.
                </p>

                {/* Buttons */}
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmClear}
                    className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </CareerToolLayout>
  );
}
