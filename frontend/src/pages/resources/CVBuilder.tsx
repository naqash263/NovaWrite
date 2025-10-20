import React, { useState, useEffect, useRef } from 'react';
import { useSEO } from '../../utils/seo';
import { defaultCVData, type CVData } from '../../components/cv-builder/cv-form';
import { CvPreview } from '../../components/cv-builder/cv-preview';
import { TemplateCustomizer, type CVStyle } from '../../components/cv-builder/template-customizer';
import { ToastContainer, useToast } from '../../hooks/use-toast';
import { uploadFileForProcessing, validateFile } from '../../utils/fileProcessor';
import CVExportOptions from '../../components/cv-builder/CVExportOptions';
import { API_CONFIG } from '../../config/api';
import apiClient from '../../api/axios';

// Add custom CSS for mobile optimizations
const MobileOptimizationStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    /* Hide scrollbars but maintain functionality */
    .no-scrollbar {
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;  /* Firefox */
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;  /* Chrome, Safari and Opera */
    }
  `}} />
);

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
      // Clear any existing file choosers
      const existingInputs = document.querySelectorAll('input[type="file"]');
      existingInputs.forEach(input => {
        if (input !== fileInputRef.current) {
          (input as HTMLInputElement).value = '';
        }
      });
      
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

// AI Features Selection Component
const AIFeaturesSelection = ({ onSelectMode }: { onSelectMode: (mode: 'ai-upload' | 'ai-tailor' | 'manual') => void }) => {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">How would you like to create your CV?</h2>
        <p className="text-base sm:text-lg text-gray-600">Choose the option that works best for you</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* AI Upload Option */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8 hover:shadow-md transition-shadow duration-200 cursor-pointer group"
             onClick={() => onSelectMode('ai-upload')}>
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-blue-200 transition-colors duration-200">
              <span className="text-xl sm:text-2xl">📄</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">Upload Existing CV</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Upload your current CV and we'll extract the information automatically</p>
            <div className="bg-blue-50 rounded-lg p-2 sm:p-3">
              <p className="text-xs sm:text-sm text-blue-800 font-medium">AI-Powered</p>
              <p className="text-xs text-blue-600">Supports PDF and Word documents</p>
            </div>
          </div>
        </div>

        {/* AI Tailor Option */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8 hover:shadow-md transition-shadow duration-200 cursor-pointer group"
             onClick={() => onSelectMode('ai-tailor')}>
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-green-200 transition-colors duration-200">
              <span className="text-xl sm:text-2xl">🎯</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">Tailor to Job</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Paste a job description and we'll optimize your CV for that role</p>
            <div className="bg-green-50 rounded-lg p-2 sm:p-3">
              <p className="text-xs sm:text-sm text-green-800 font-medium">AI-Optimized</p>
              <p className="text-xs text-green-600">Perfect match for job requirements</p>
            </div>
          </div>
        </div>

        {/* Manual Option */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8 hover:shadow-md transition-shadow duration-200 cursor-pointer group"
             onClick={() => onSelectMode('manual')}>
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-purple-200 transition-colors duration-200">
              <span className="text-xl sm:text-2xl">✏️</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">Create Manually</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Start from scratch with our step-by-step guide</p>
            <div className="bg-purple-50 rounded-lg p-2 sm:p-3">
              <p className="text-xs sm:text-sm text-purple-800 font-medium">Full Control</p>
              <p className="text-xs text-purple-600">Complete customization</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// AI Upload Step
const AIUploadStep = ({ onDataChange, onNext }: { onDataChange: (data: CVData) => void, onNext: () => void }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiStats, setApiStats] = useState({ availableRequests: 0, totalRequests: 0 });
  const [userApiKey, setUserApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [extractedData, setExtractedData] = useState<CVData | null>(null);
  const [showDataPreview, setShowDataPreview] = useState(false);
  const { addToast } = useToast();

  // Load API stats on mount
  React.useEffect(() => {
    loadApiStats();
  }, []);

  const loadApiStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // User not logged in, use public stats
        const response = await fetch('/api/cv-ai/stats');
        const data = await response.json();
        if (data.success) {
          setApiStats({
            availableRequests: data.data.available_requests,
            totalRequests: data.data.total_requests
          });
        }
        return;
      }

      // User is logged in, try to get user-specific stats
      try {
      const response = await fetch('/api/user-api-keys/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setApiStats({
          availableRequests: data.data.available_requests,
          totalRequests: data.data.total_requests
        });
        }
      } catch (authError) {
        // If user-specific stats fail, fall back to public stats
        console.warn('Failed to load user-specific API stats, falling back to public stats:', authError);
        const response = await fetch('/api/cv-ai/stats');
        const data = await response.json();
        if (data.success) {
          setApiStats({
            availableRequests: data.data.available_requests,
            totalRequests: data.data.total_requests
          });
        }
      }
    } catch (error) {
      console.error('Failed to load API stats:', error);
    }
  };

  const handleAddApiKey = async () => {
    if (!userApiKey.trim()) {
      addToast({
        type: 'warning',
        title: 'API Key Required',
        description: 'Please enter your Gemini API key.'
      });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      addToast({
        type: 'info',
        title: 'Login Required',
        description: 'Please log in to add your API key and get unlimited CV processing.',
        duration: 6000
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/user-api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          api_key: userApiKey,
          name: 'User API Key'
        })
      });

      const result = await response.json();

      if (result.success) {
        setUserApiKey('');
        setShowApiKeyInput(false);
        loadApiStats(); // Refresh stats
        addToast({
          type: 'success',
          title: 'API Key Added Successfully!',
          description: 'Your API key has been added and you now have unlimited CV processing.'
        });
      } else {
        addToast({
          type: 'error',
          title: 'Failed to Add API Key',
          description: result.message || 'Please check your API key and try again.'
        });
      }
    } catch (error) {
      console.error('Failed to add API key:', error);
      addToast({
        type: 'error',
        title: 'Connection Error',
        description: 'Failed to add API key. Please check your connection and try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedWithData = () => {
    console.log('handleProceedWithData called', { extractedData, onNext });
    if (extractedData) {
      console.log('Calling onDataChange with:', extractedData);
      onDataChange(extractedData);
      console.log('Calling onNext');
      onNext();
      console.log('onNext called');
    }
  };

  const handleEditData = () => {
    console.log('handleEditData called', { extractedData, onNext });
    if (extractedData) {
      onDataChange(extractedData);
      onNext();
    }
  };

  const handleReupload = () => {
    console.log('handleReupload called');
    setExtractedData(null);
    setShowDataPreview(false);
    setIsUploading(false);
    // Reset the file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file first
    const validation = validateFile(file);
    if (!validation.valid) {
      addToast({
        type: 'error',
        title: 'Invalid File',
        description: validation.errors.join(', ')
      });
      return;
    }

    // Check file size for AI processing (5MB limit for better processing)
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        type: 'warning',
        title: 'Large File Detected',
        description: 'This file is quite large. AI processing may take longer or be limited to the first part of the document.'
      });
    }

    setIsUploading(true);

    try {
      // Use new file processing approach
      const response = await uploadFileForProcessing(file);
      const result = await response.json();

      if (result.success) {
        setExtractedData(result.data);
        setShowDataPreview(true);
        addToast({
          type: 'success',
          title: 'CV Extracted Successfully!',
          description: `Your CV information has been extracted from ${result.file_info?.filename || 'the uploaded file'}. Please review the extracted data below.`
        });
      } else {
        addToast({
          type: 'error',
          title: 'Extraction Failed',
          description: result.message || 'Failed to extract CV data. Please try a different file format.'
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      // Provide more specific error messages based on the error
      let errorMessage = 'Failed to upload file. Please check your connection and try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('token count') || error.message.includes('too large')) {
          errorMessage = 'CV file is too large for AI processing. Please try a shorter CV or split it into sections.';
        } else if (error.message.includes('quota')) {
          errorMessage = 'API quota exceeded. Please try again later or add your own API key.';
        } else if (error.message.includes('temporarily unavailable')) {
          errorMessage = 'AI service is temporarily unavailable. Please try again in a few minutes.';
        }
      }
      
      addToast({
        type: 'error',
        title: 'Upload Failed',
        description: errorMessage
      });
    } finally {
      setIsUploading(false);
    }
  };



  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Upload Your CV</h2>
        <p className="text-lg text-gray-600">Our AI will extract and organize your information automatically</p>
      </div>

      {/* API Key Section - Moved to Top */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-8">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-green-900 mb-2">🚀 Free AI-Powered CV Processing</h3>
          <p className="text-green-800 mb-4">Get your CV processed instantly using our secure AI system</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">🔒 Your Data is Secure</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• All API keys are encrypted and stored securely</li>
              <li>• Your CV data is processed locally and not stored</li>
              <li>• We use enterprise-grade security measures</li>
              <li>• Your information is never shared with third parties</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">💡 Why Add Your API Key?</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Get unlimited CV processing for free</li>
              <li>• Faster processing with dedicated resources</li>
              <li>• Support the platform's free tools for everyone</li>
              <li>• Your key is only used for your account</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              const token = localStorage.getItem('token');
              if (!token) {
                addToast({
                  type: 'error',
                  title: 'Authentication Required',
                  description: 'Please log in to add your API key.',
                  duration: 5000
                });
                return;
              }
              setShowApiKeyInput(!showApiKeyInput);
            }}
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
          >
            <span className="mr-2">🔑</span>
            {showApiKeyInput ? 'Hide API Key Input' : 'Add Your API Key (Optional)'}
          </button>
        </div>
        
        {showApiKeyInput && (
          <div className="mt-4 bg-white rounded-lg p-4 border border-green-200">
            <div className="space-y-3">
              <input
                type="password"
                value={userApiKey}
                onChange={(e) => setUserApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-600">
                Get your free API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">Google AI Studio</a>
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowApiKeyInput(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddApiKey}
                  disabled={isLoading || !userApiKey.trim()}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isLoading || !userApiKey.trim()
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isLoading ? 'Adding...' : 'Add API Key'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 text-center">
          <p className="text-sm text-green-700">
            <strong>Available Requests:</strong> {apiStats.availableRequests} out of {apiStats.totalRequests} total
          </p>
        </div>
      </div>

      {/* File Upload Section - Only show when no data preview */}
      {!showDataPreview && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📄</span>
          </div>
          
          <div className="mb-6">
              <FileInput
                onFileSelect={handleFileUpload}
                isProcessing={isUploading}
                buttonText="Choose File"
              />
          </div>

          <p className="text-sm text-gray-500 mb-4">
              Supported formats: PDF, DOC, DOCX, TXT (Max 5MB)
            </p>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• AI extracts your personal information, experience, and skills</li>
              <li>• Information is organized into our CV format</li>
              <li>• You can review and edit before finalizing</li>
            </ul>
          </div>
        </div>
      </div>
      )}

      {/* Data Preview Section */}
      {showDataPreview && extractedData && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-green-900 mb-2">✅ CV Data Extracted Successfully!</h3>
            <p className="text-gray-600">Review the extracted information below and choose your next step</p>
          </div>

          {/* Extracted Data Preview */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">📋 Extracted Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Personal Information */}
              <div className="space-y-3">
                <h5 className="font-medium text-gray-800">Personal Information</h5>
                {extractedData.fullName && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-600">Name:</span> {extractedData.fullName}
                  </div>
                )}
                {extractedData.email && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-600">Email:</span> {extractedData.email}
                  </div>
                )}
                    {extractedData.phoneNumber && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-600">Phone:</span> {extractedData.phoneNumber}
                      </div>
                    )}
                    {extractedData.address && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-600">Location:</span> {extractedData.address}
                      </div>
                    )}
              </div>

              {/* Professional Information */}
              <div className="space-y-3">
                <h5 className="font-medium text-gray-800">Professional Information</h5>
                {extractedData.professionalSummary && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-600">Summary:</span> 
                    <p className="mt-1 text-gray-700">{extractedData.professionalSummary.substring(0, 100)}...</p>
                  </div>
                )}
                {extractedData.workExperience && extractedData.workExperience.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-600">Experience:</span> {extractedData.workExperience.length} position(s) found
                  </div>
                )}
                {extractedData.education && extractedData.education.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-600">Education:</span> {extractedData.education.length} entry(ies) found
                  </div>
                )}
                {extractedData.skills && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-600">Skills:</span> {extractedData.skills.split(',').length} skill(s) found
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleProceedWithData}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
            >
              ✅ Use This Data & Continue
            </button>
            <button
              onClick={handleEditData}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
            >
              ✏️ Edit & Customize
            </button>
            <button
              onClick={handleReupload}
              className="px-8 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200"
            >
              🔄 Upload Different File
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              💡 <strong>Tip:</strong> You can always edit any information after proceeding to the next step
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// AI Tailor Step
const AITailorStep = ({ onDataChange, onNext }: { onDataChange: (data: CVData) => void, onNext: () => void }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiStats, setApiStats] = useState({ availableRequests: 0, totalRequests: 0 });
  const [userApiKey, setUserApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [hasExistingCV, setHasExistingCV] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<CVData | null>(null);
  const [showDataPreview, setShowDataPreview] = useState(false);
  const { addToast } = useToast();

  // Load API stats on mount
  React.useEffect(() => {
    loadApiStats();
    
    // Clear any existing CV data from localStorage to prevent false positives
    localStorage.removeItem('cv-builder-data');
    setHasExistingCV(false);
  }, []);

  const loadApiStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // User not logged in, use public stats
        const response = await fetch('/api/cv-ai/stats');
        const data = await response.json();
        if (data.success) {
          setApiStats({
            availableRequests: data.data.available_requests,
            totalRequests: data.data.total_requests
          });
        }
        return;
      }

      // User is logged in, try to get user-specific stats
      try {
      const response = await fetch('/api/user-api-keys/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setApiStats({
          availableRequests: data.data.available_requests,
          totalRequests: data.data.total_requests
        });
        }
      } catch (authError) {
        // If user-specific stats fail, fall back to public stats
        console.warn('Failed to load user-specific API stats, falling back to public stats:', authError);
        const response = await fetch('/api/cv-ai/stats');
        const data = await response.json();
        if (data.success) {
          setApiStats({
            availableRequests: data.data.available_requests,
            totalRequests: data.data.total_requests
          });
        }
      }
    } catch (error) {
      console.error('Failed to load API stats:', error);
    }
  };

  const handleAddApiKey = async () => {
    if (!userApiKey.trim()) {
      addToast({
        type: 'warning',
        title: 'API Key Required',
        description: 'Please enter your Gemini API key.'
      });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      addToast({
        type: 'info',
        title: 'Login Required',
        description: 'Please log in to add your API key and get unlimited CV tailoring.',
        duration: 6000
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/user-api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          api_key: userApiKey,
          name: 'User API Key'
        })
      });

      const result = await response.json();

      if (result.success) {
        setUserApiKey('');
        setShowApiKeyInput(false);
        loadApiStats(); // Refresh stats
        addToast({
          type: 'success',
          title: 'API Key Added Successfully!',
          description: 'Your API key has been added and you now have unlimited CV tailoring.'
        });
      } else {
        addToast({
          type: 'error',
          title: 'Failed to Add API Key',
          description: result.message || 'Please check your API key and try again.'
        });
      }
    } catch (error) {
      console.error('Failed to add API key:', error);
      addToast({
        type: 'error',
        title: 'Connection Error',
        description: 'Failed to add API key. Please check your connection and try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedWithData = () => {
    if (extractedData) {
      onDataChange(extractedData);
      onNext();
    }
  };

  const handleEditData = () => {
    if (extractedData) {
      onDataChange(extractedData);
      onNext();
    }
  };

  const handleReupload = () => {
    setExtractedData(null);
    setShowDataPreview(false);
    setIsProcessing(false);
    // Reset the file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file first
    const validation = validateFile(file);
    if (!validation.valid) {
      addToast({
        type: 'error',
        title: 'Invalid File',
        description: validation.errors.join(', ')
      });
      return;
    }

    // Check file size for AI processing (5MB limit for better processing)
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        type: 'warning',
        title: 'Large File Detected',
        description: 'This file is quite large. AI processing may take longer or be limited to the first part of the document.'
      });
    }

    setCvFile(file);
    setIsProcessing(true);

    try {
      // Use new file processing approach
      const response = await uploadFileForProcessing(file);
      const result = await response.json();

      if (result.success) {
        setExtractedData(result.data);
        setShowDataPreview(true);
        setHasExistingCV(true);
        addToast({
          type: 'success',
          title: 'CV Extracted Successfully!',
          description: `Your CV information has been extracted from ${result.file_info?.filename || 'the uploaded file'}. Please review the extracted data below.`
        });
      } else {
        addToast({
          type: 'error',
          title: 'Extraction Failed',
          description: result.message || 'Failed to extract CV data. Please try a different file format.'
        });
      }
    } catch (error) {
      console.error('Processing error:', error);
      
      // Provide more specific error messages based on the error
      let errorMessage = 'Failed to process your CV. Please check your connection and try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('token count') || error.message.includes('too large')) {
          errorMessage = 'CV file is too large for AI processing. Please try a shorter CV or split it into sections.';
        } else if (error.message.includes('quota')) {
          errorMessage = 'API quota exceeded. Please try again later or add your own API key.';
        } else if (error.message.includes('temporarily unavailable')) {
          errorMessage = 'AI service is temporarily unavailable. Please try again in a few minutes.';
        }
      }
      
      addToast({
        type: 'error',
        title: 'Processing Error',
        description: errorMessage
      });
    } finally {
      setIsProcessing(false);
    }
  };


  const handleTailor = async () => {
    if (!jobDescription.trim()) {
      addToast({
        type: 'warning',
        title: 'Job Description Required',
        description: 'Please enter a job description to tailor your CV.'
      });
      return;
    }

    if (!hasExistingCV && !cvFile) {
      addToast({
        type: 'warning',
        title: 'CV Required',
        description: 'Please upload a CV file first or switch to manual creation.'
      });
      return;
    }

    setIsProcessing(true);

    try {
      // If user provided their own API key, add it first
      if (userApiKey.trim()) {
        const keyResponse = await fetch('/api/cv-ai/add-user-key', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: userApiKey,
            name: 'User API Key'
          })
        });

        if (!keyResponse.ok) {
          const keyResult = await keyResponse.json();
          addToast({
            type: 'error',
            title: 'Invalid API Key',
            description: keyResult.message || 'Please check your API key and try again.'
          });
          return;
        }
      }

      // Get current CV data from localStorage
      const savedData = localStorage.getItem('cv-builder-data');
      const cvData = savedData ? JSON.parse(savedData) : {};

      // Call AI API
      const response = await fetch('/api/cv-ai/tailor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cv_data: cvData,
          job_description: jobDescription
        })
      });

      const result = await response.json();

      if (result.success) {
        onDataChange(result.data);
        addToast({
          type: 'success',
          title: 'CV Tailored Successfully!',
          description: 'Your CV has been optimized for the job description. You can now proceed to the next step.'
        });
        onNext();
      } else {
        addToast({
          type: 'error',
          title: 'Tailoring Failed',
          description: result.message || 'Failed to tailor CV. Please try again.'
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Processing Error',
        description: 'Failed to tailor CV. Please check your connection and try again.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Tailor Your CV to a Job</h2>
        <p className="text-lg text-gray-600">Upload your CV and paste the job description to optimize it for that specific role</p>
      </div>

      {/* API Key Section - Moved to Top */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-8">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-green-900 mb-2">🚀 Free AI-Powered CV Tailoring</h3>
          <p className="text-green-800 mb-4">Get your CV optimized for any job using our secure AI system</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">🔒 Your Data is Secure</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• All API keys are encrypted and stored securely</li>
              <li>• Your CV data is processed locally and not stored</li>
              <li>• We use enterprise-grade security measures</li>
              <li>• Your information is never shared with third parties</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">💡 Why Add Your API Key?</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Get unlimited CV tailoring for free</li>
              <li>• Faster processing with dedicated resources</li>
              <li>• Support the platform's free tools for everyone</li>
              <li>• Your key is only used for your account</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              const token = localStorage.getItem('token');
              if (!token) {
                addToast({
                  type: 'error',
                  title: 'Authentication Required',
                  description: 'Please log in to add your API key.',
                  duration: 5000
                });
                return;
              }
              setShowApiKeyInput(!showApiKeyInput);
            }}
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
          >
            <span className="mr-2">🔑</span>
            {showApiKeyInput ? 'Hide API Key Input' : 'Add Your API Key (Optional)'}
          </button>
        </div>
        
        {showApiKeyInput && (
          <div className="mt-4 bg-white rounded-lg p-4 border border-green-200">
            <div className="space-y-3">
              <input
                type="password"
                value={userApiKey}
                onChange={(e) => setUserApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-600">
                Get your free API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">Google AI Studio</a>
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowApiKeyInput(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddApiKey}
                  disabled={isLoading || !userApiKey.trim()}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isLoading || !userApiKey.trim()
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isLoading ? 'Adding...' : 'Add API Key'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 text-center">
          <p className="text-sm text-green-700">
            <strong>Available Requests:</strong> {apiStats.availableRequests} out of {apiStats.totalRequests} total
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* CV Upload Section - Only show when no data preview */}
        {!showDataPreview && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Upload Your CV</h3>
          
          {hasExistingCV ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                <span className="text-green-800 font-medium">CV data found! You can proceed to tailor your CV.</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">📄</span>
                </div>
                
                <div className="mb-4">
                    <FileInput
                      onFileSelect={handleFileUpload}
                      isProcessing={isProcessing}
                      buttonText="Choose CV File"
                    />
                </div>

                <p className="text-sm text-gray-500 mb-4">
                    Supported formats: PDF, DOC, DOCX, TXT (Max 5MB)
                </p>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">No CV to upload?</h4>
                  <p className="text-sm text-yellow-800 mb-3">
                    If you don't have a CV file, you can create one manually by switching to "Create Manually" mode.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Switch to Manual Creation →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Job Description Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Job Description</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Job Description</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the complete job description here..."
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
              />
              <p className="text-sm text-gray-500 mt-1">
                {jobDescription.length} characters
              </p>
            </div>



            <div className="flex justify-center">
              <button
                onClick={handleTailor}
                disabled={isProcessing || !jobDescription.trim() || (!hasExistingCV && !cvFile)}
                className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                  isProcessing || !jobDescription.trim() || (!hasExistingCV && !cvFile)
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>AI Processing...</span>
                  </>
                ) : (
                  <>
                    <span>🎯</span>
                    <span>Tailor My CV</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">How AI tailoring works:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Analyzes job requirements and keywords</li>
                <li>• Optimizes your summary and experience descriptions</li>
                <li>• Highlights relevant skills and achievements</li>
                <li>• Ensures ATS compatibility</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Data Preview Section */}
      {showDataPreview && extractedData && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-green-900 mb-2">✅ CV Data Extracted Successfully!</h3>
            <p className="text-gray-600">Review the extracted information below and choose your next step</p>
          </div>

          {/* Extracted Data Preview */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">📋 Extracted Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Personal Information */}
              <div className="space-y-3">
                <h5 className="font-medium text-gray-800">Personal Information</h5>
                {extractedData.fullName && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-600">Name:</span> {extractedData.fullName}
                  </div>
                )}
                {extractedData.email && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-600">Email:</span> {extractedData.email}
                  </div>
                )}
                    {extractedData.phoneNumber && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-600">Phone:</span> {extractedData.phoneNumber}
                      </div>
                    )}
                    {extractedData.address && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-600">Location:</span> {extractedData.address}
                      </div>
                    )}
              </div>

              {/* Professional Information */}
              <div className="space-y-3">
                <h5 className="font-medium text-gray-800">Professional Information</h5>
                {extractedData.professionalSummary && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-600">Summary:</span> 
                    <p className="mt-1 text-gray-700">{extractedData.professionalSummary.substring(0, 100)}...</p>
                  </div>
                )}
                {extractedData.workExperience && extractedData.workExperience.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-600">Experience:</span> {extractedData.workExperience.length} position(s) found
                  </div>
                )}
                {extractedData.education && extractedData.education.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-600">Education:</span> {extractedData.education.length} entry(ies) found
                  </div>
                )}
                {extractedData.skills && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-600">Skills:</span> {extractedData.skills.split(',').length} skill(s) found
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleProceedWithData}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
            >
              ✅ Use This Data & Continue
            </button>
            <button
              onClick={handleEditData}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
            >
              ✏️ Edit & Customize
            </button>
            <button
              onClick={handleReupload}
              className="px-8 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200"
            >
              🔄 Upload Different File
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              💡 <strong>Tip:</strong> You can always edit any information after proceeding to the next step
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Step-by-step wizard component
const StepIndicator = ({ currentStep, totalSteps, onStepClick, completedSteps }: { currentStep: number, totalSteps: number, onStepClick: (step: number) => void, completedSteps: Set<number> }) => {
  const steps = [
    { id: 1, name: 'Personal Info', icon: '👤', description: 'Basic information', shortName: 'Personal' },
    { id: 2, name: 'Summary', icon: '📝', description: 'Professional summary', shortName: 'Summary' },
    { id: 3, name: 'Experience', icon: '💼', description: 'Work history', shortName: 'Experience' },
    { id: 4, name: 'Education', icon: '🎓', description: 'Academic background', shortName: 'Education' },
    { id: 5, name: 'Skills & Projects', icon: '🛠️', description: 'Skills and portfolio', shortName: 'Skills' },
    { id: 6, name: 'Certifications & Achievements', icon: '🏆', description: 'Certificates and achievements', shortName: 'Certifications' },
    { id: 7, name: 'Languages & Interests', icon: '🌍', description: 'Languages and hobbies', shortName: 'Languages' },
    { id: 8, name: 'References', icon: '👥', description: 'Professional references', shortName: 'References' },
    { id: 9, name: 'Template', icon: '🎨', description: 'Design & style', shortName: 'Template' },
    { id: 10, name: 'Preview', icon: '👁️', description: 'Final review', shortName: 'Preview' }
  ];

  const currentStepData = steps.find(step => step.id === currentStep);
  const completedStepsCount = completedSteps.size;
  const remainingSteps = totalSteps - currentStep;
  // const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-4 sm:py-6 sticky top-0 z-10 shadow-sm">
      <div className="max-w-6xl mx-auto">
        {/* Progress Header */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl">{currentStepData?.icon}</span>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    {currentStepData?.name || `Step ${currentStep}`}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                    {currentStepData?.description || 'Complete this step to continue'}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto mt-2 sm:mt-0 hidden sm:block">
              <div className="text-sm font-medium text-gray-900">
                Step {currentStep} of {totalSteps}
              </div>
              <div className="text-xs text-gray-500">
                {completedStepsCount} completed • {remainingSteps} remaining
              </div>
            </div>
          </div>
          
          {/* Enhanced Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 mb-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 sm:h-3 rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            >
              <div className="absolute right-0 top-0 w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full shadow-sm transform translate-x-1 -translate-y-0.5"></div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span className="font-medium text-blue-600">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
            <span>100%</span>
          </div>
        </div>

        {/* Desktop Step Indicator - Improved Layout - Only visible on large screens */}
        <div className="hidden lg:block">
          {/* Current Step Focus - DESKTOP ONLY */}
          <div className="mb-4">
            <div className="flex items-center justify-center space-x-4">
              {/* These navigation buttons are DESKTOP ONLY */}
              <button
                onClick={() => onStepClick(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="hidden lg:flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              >
                <span>←</span>
                <span>Previous</span>
              </button>
              
              <div className="flex items-center space-x-3 bg-blue-50 px-6 py-3 rounded-xl border-2 border-blue-200">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold">
                  {currentStep}
                </div>
                <div className="text-center">
                  <div className="font-semibold text-blue-900">{currentStepData?.name}</div>
                  <div className="text-sm text-blue-700">{currentStepData?.description}</div>
                </div>
              </div>
              
              {/* These navigation buttons are DESKTOP ONLY */}
              <button
                onClick={() => onStepClick(Math.min(totalSteps, currentStep + 1))}
                disabled={currentStep === totalSteps}
                className="hidden lg:flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
              >
                <span>Next</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Step Dots Indicator */}
          <div className="flex items-center justify-center space-x-2">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = completedSteps.has(step.id);
              
              return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => onStepClick(step.id)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-lg transform scale-110' 
                        : isCompleted 
                        ? 'bg-green-500 text-white hover:bg-green-600 hover:shadow-md' 
                        : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                    }`}
                    title={`${step.name}: ${step.description}`}
                  >
                    {isCompleted ? '✓' : step.id}
              </button>
                  
              {index < steps.length - 1 && (
                    <div className={`w-8 h-1 mx-2 rounded-full ${
                      isCompleted ? 'bg-green-400' : 'bg-gray-300'
                }`} />
              )}
            </div>
              );
            })}
        </div>

        </div>

        {/* Mobile Step Navigation - Completely Redesigned */}
        <div className="lg:hidden">
          {/* Current Step Display - Simplified for Mobile */}
          <div className="text-center mb-3">
            <div className="inline-flex flex-col items-center bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold mb-1">
                {currentStep}
              </div>
              <div className="font-semibold text-blue-900 text-sm">{currentStepData?.name}</div>
            </div>
          </div>

          {/* Step Indicator - Swipeable Strip */}
          <div className="overflow-x-auto pb-2 mb-3 no-scrollbar">
            <div className="flex items-center min-w-max px-2">
              {steps.map((step, index) => {
                const isActive = currentStep === step.id;
                const isCompleted = completedSteps.has(step.id);
                
                return (
                  <div key={step.id} className="flex items-center">
                    <button
                      onClick={() => onStepClick(step.id)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                        isActive 
                          ? 'bg-blue-600 text-white shadow-md transform scale-110' 
                          : isCompleted 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-300 text-gray-600'
                      }`}
                      aria-label={`Go to step ${step.id}: ${step.name}`}
                    >
                      {isCompleted ? '✓' : step.id}
                    </button>
                    
                    {index < steps.length - 1 && (
                      <div className={`w-3 h-0.5 mx-0.5 rounded-full ${
                        isCompleted ? 'bg-green-400' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Buttons - Icon Only for Mobile */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => onStepClick(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400'
              }`}
              aria-label="Previous step"
            >
              <span className="text-lg">←</span>
            </button>
            
            <div className="text-center px-2">
              <div className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
                {currentStep}/{totalSteps}
              </div>
            </div>
            
            <button
              onClick={() => onStepClick(Math.min(totalSteps, currentStep + 1))}
              disabled={currentStep === totalSteps}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                currentStep === totalSteps
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
              }`}
              aria-label="Next step"
            >
              <span className="text-lg">→</span>
            </button>
          </div>
        </div>
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
    <div className="bg-white border-t border-gray-200 px-4 py-4 sm:py-6 sticky bottom-0 z-10 shadow-lg">
      <div className="max-w-6xl mx-auto">
        {/* Progress Summary - MOBILE ONLY */}
        <div className="mb-3 sm:mb-4 sm:hidden">
          <div className="flex justify-center items-center mb-2">
            <div className="text-sm text-gray-600 text-center">
              <div className="font-medium text-blue-600">{Math.round((currentStep / totalSteps) * 100)}% Complete</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Progress Summary - DESKTOP ONLY */}
        <div className="mb-4 hidden sm:block">
          <div className="flex flex-row items-center justify-between mb-2">
            <div className="text-sm text-gray-600 flex items-center">
              <div className="whitespace-nowrap">
                <span className="font-medium text-gray-900">Step {currentStep}</span> of {totalSteps}
              </div>
              <span className="mx-2">•</span>
              <span className="text-blue-600 font-medium whitespace-nowrap">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
            </div>
            <div className="text-xs text-gray-500 whitespace-nowrap">
              {isLastStep ? 'Ready to download!' : `${totalSteps - currentStep} steps remaining`}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center gap-2">
          {/* Mobile View: Show only arrow icons */}
          <div className="sm:hidden">
            <button
              onClick={onPrevious}
              disabled={isFirstStep}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 ${
                isFirstStep
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
              }`}
            >
              <span className="text-xl">←</span>
            </button>
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
          
          {/* Mobile View: Show only icon for Download/Next */}
          <div className="sm:hidden">
            {isLastStep ? (
              <button
                onClick={onFinish}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md"
              >
                <span className="text-xl">📄</span>
              </button>
            ) : (
              <button
                onClick={onNext}
                disabled={isNextDisabled}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 ${
                  isNextDisabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md'
                }`}
              >
                <span className="text-xl">→</span>
              </button>
            )}
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Let's start with your basic information</h2>
        <p className="text-lg text-gray-600">This information will appear at the top of your CV</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Full Name *</label>
            <input
              type="text"
              value={data.fullName}
              onChange={(e) => onDataChange({ ...data, fullName: e.target.value })}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Job Title</label>
            <input
              type="text"
              value={data.jobTitle}
              onChange={(e) => onDataChange({ ...data, jobTitle: e.target.value })}
              placeholder="e.g., Software Engineer"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Email *</label>
            <input
              type="email"
              value={data.email}
              onChange={(e) => onDataChange({ ...data, email: e.target.value })}
              placeholder="your.email@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Phone Number</label>
            <input
              type="tel"
              value={data.phoneNumber}
              onChange={(e) => onDataChange({ ...data, phoneNumber: e.target.value })}
              placeholder="+1 (555) 123-4567"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Address</label>
            <input
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
              <input
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Tell us about yourself</h2>
        <p className="text-lg text-gray-600">Write a compelling professional summary that highlights your key strengths</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-700">Professional Summary</label>
          <textarea
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Your work experience</h2>
        <p className="text-lg text-gray-600">List your most relevant work experience, starting with the most recent</p>
      </div>

      <div className="space-y-6">
        {data.workExperience.map((exp, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                <input
                  type="text"
                  value={exp.jobTitle}
                  onChange={(e) => updateExperience(index, 'jobTitle', e.target.value)}
                  placeholder="e.g., Software Engineer"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Company *</label>
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => updateExperience(index, 'company', e.target.value)}
                  placeholder="e.g., Tech Corp"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Start Date *</label>
                <input
                  type="month"
                  value={exp.startDate}
                  onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">End Date</label>
                <input
                  type="month"
                  value={exp.endDate}
                  onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                  placeholder="Leave empty if current"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Description</label>
                <textarea
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Your education</h2>
        <p className="text-lg text-gray-600">Include your academic qualifications and certifications</p>
      </div>

      <div className="space-y-6">
        {data.education.map((edu, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                  placeholder="e.g., Bachelor of Science"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Institution *</label>
                <input
                  type="text"
                  value={edu.institution}
                  onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                  placeholder="e.g., University Name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Graduation Year *</label>
                <input
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Skills & Projects</h2>
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
          <textarea
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
                    <input
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
                    <input
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
                    <input
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
                    <input
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
                    <input
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
                    <textarea
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Languages & Interests</h2>
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
                    <input
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
                    <select
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
                    <input
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
                    <textarea
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">References</h2>
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
                <input
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
                <input
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
                <input
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
                <input
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
                <input
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
    onDataChange({ ...data, certificates: [...data.certificates, newCertificate] });
  };

  const removeCertificate = (index: number) => {
    const updatedCertificates = data.certificates.filter((_, i) => i !== index);
    onDataChange({ ...data, certificates: updatedCertificates });
  };

  const updateCertificate = (index: number, field: string, value: string) => {
    const updatedCertificates = data.certificates.map((cert, i) => 
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
      achievements: [...data.achievements, newAchievement],
    });
  };

  const removeAchievement = (index: number) => {
    const updatedAchievements = data.achievements.filter((_, i) => i !== index);
    onDataChange({
      ...data,
      achievements: updatedAchievements,
    });
  };

  const updateAchievement = (index: number, field: keyof typeof data.achievements[0], value: string) => {
    const updatedAchievements = data.achievements.map((achievement, i) =>
      i === index ? { ...achievement, [field]: value } : achievement
    );
    onDataChange({
      ...data,
      achievements: updatedAchievements,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Certifications & Achievements</h2>
        <p className="text-gray-600">Showcase your professional certifications and accomplishments</p>
      </div>

      <div className="space-y-8">
        {/* Certifications Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">🏆 Professional Certifications</h3>
          <div className="space-y-6">
            {data.certificates.map((certificate, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Certificate {index + 1}</h4>
                  {data.certificates.length > 1 && (
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
                    <input
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
                    <input
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
                    <input
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
                    <input
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
                    <input
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
            {data.achievements.map((achievement, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Achievement {index + 1}</h4>
                  {data.achievements.length > 1 && (
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
                    <input
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
                    <textarea
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
                    <input
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
      console.log('Template selected:', template);
      console.log('Selected template HTML content length:', template.html_content?.length || 0);
      console.log('Selected template HTML preview:', template.html_content?.substring(0, 200) || 'No HTML content');
      onStyleChange({
        templateName: templateId,
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        fontFamily: 'Arial, sans-serif',
        fontSize: 11,
      });
      onTemplateSelect(template);
      setPreviewMode('preview');
    }
  };

  const handleStyleChange = (newStyle: Partial<CVStyle>) => {
    console.log('Style changed:', newStyle);
    onStyleChange({ ...style, ...newStyle });
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
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your ATS-Friendly Template</h2>
        <p className="text-lg text-gray-600">Select a proven template that passes Applicant Tracking Systems</p>
        
        <div className="flex justify-center space-x-4 mt-6">
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
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2">✅ ATS-Friendly Templates</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
            <div>
              <h5 className="font-semibold mb-1">Proven Effectiveness:</h5>
              <p>Based on research from Jobscan, Microsoft, Novoresume, and other ATS experts</p>
            </div>
            <div>
              <h5 className="font-semibold mb-1">Maximum Compatibility:</h5>
              <p>Designed to pass through Applicant Tracking Systems with high success rates</p>
            </div>
          </div>
        </div>
      </div>

      {previewMode === 'grid' ? (
        <div className="space-y-8">
          {/* ATS-Friendly Template Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Choose Your ATS-Friendly Template</h3>
            
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
                    style.templateName === template.id.toString() 
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
                    <div className="absolute top-3 right-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        template.ats_score >= 8 ? 'bg-green-100 text-green-800' :
                        template.ats_score >= 6 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        ATS {template.ats_score}/10
                      </span>
                    </div>
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
                    
                    <button className="mt-2 w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                      Select Template
                    </button>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>
          
          {/* Template Selection Guide */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Template Selection Guide</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Executive Level</h4>
                <p className="text-sm text-blue-800 mb-2">Jobscan Executive, Microsoft Professional</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• C-level positions</li>
                  <li>• Senior executives</li>
                  <li>• Corporate leadership</li>
                </ul>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Tech Professionals</h4>
                <p className="text-sm text-green-800 mb-2">Novoresume Modern, Hirective Tech</p>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• Software developers</li>
                  <li>• IT professionals</li>
                  <li>• Tech startups</li>
                </ul>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">Career Changers</h4>
                <p className="text-sm text-purple-800 mb-2">Wozber Functional, Teal Hybrid</p>
                <ul className="text-xs text-purple-700 space-y-1">
                  <li>• Recent graduates</li>
                  <li>• Career transitions</li>
                  <li>• Skills-based roles</li>
                </ul>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-2">Consultants</h4>
                <p className="text-sm text-orange-800 mb-2">Cultivated Minimal, Freesumes Boost</p>
                <ul className="text-xs text-orange-700 space-y-1">
                  <li>• Freelancers</li>
                  <li>• Consultants</li>
                  <li>• Academic roles</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customize Style</h3>
              <TemplateCustomizer
                style={style}
                onStyleChange={handleStyleChange}
                showTemplates={false}
              />
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
                <div className="text-sm text-gray-500">
                  Template: <span className="font-medium">{style.templateName}</span>
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
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      onDownload(format, options);
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

export default function CVBuilder() {
  useSEO({
    title: 'Free CV Builder - Create Professional Resumes | Naqash Thaheem',
    description: 'Build professional CVs and resumes with our free CV builder. AI-powered parsing, multiple templates, and instant PDF download.',
    url: '/resources/cv-builder',
    keywords: ['cv builder', 'resume builder', 'free cv maker', 'professional resume', 'cv templates', 'ai cv builder']
  });

  const [cvData, setCvData] = useState<CVData>(defaultCVData);
  const [cvStyle, setCvStyle] = useState<CVStyle>({
    templateName: 'jobscan-executive',
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
    fontFamily: 'Arial, sans-serif',
    fontSize: 11,
  });
  const [currentStep, setCurrentStep] = useState(0); // 0 = AI selection, 1-7 = manual steps
  const [isLoading, setIsLoading] = useState(true);
  const [creationMode, setCreationMode] = useState<'ai-upload' | 'ai-tailor' | 'manual' | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const { addToast } = useToast();

  const totalSteps = 10;

  // Handle profile picture upload using client-side FileReader (no backend upload)
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type - restrict to common web formats only
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      addToast({
        type: 'error',
        title: 'Invalid File Type',
        description: 'Please select a JPG, PNG, GIF, or WebP image file'
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

  // Handle reset function
  const handleReset = () => {
    // Clear all saved data
    localStorage.removeItem('cv-builder-data');
    localStorage.removeItem('cv-builder-style');
    localStorage.removeItem('cv-builder-step');
    localStorage.removeItem('cv-builder-completed-steps');
    localStorage.setItem('cv-builder-load-saved', 'false');
    
    // Reset state
    setCvData(defaultCVData);
    setCvStyle({
      templateName: 'jobscan-executive',
      primaryColor: '#000000',
      secondaryColor: '#FFFFFF',
      fontFamily: 'Arial, sans-serif',
      fontSize: 11,
    });
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setCreationMode(null);
    setSelectedTemplate(null);
    setShowResetConfirm(false);
    
    addToast({
      type: 'success',
      description: 'CV Builder reset! You can now start fresh.',
      duration: 3000,
    });
  };

  // Load templates from API
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await apiClient.get('/cv-templates');
        const data = response.data;
        
        if (data.success) {
          console.log('Loaded templates:', data.data);
          setTemplates(data.data);
          // Set default template if available
          const defaultTemplate = data.data.find((t: any) => t.is_default) || data.data[0];
          if (defaultTemplate) {
            console.log('Default template selected:', defaultTemplate);
            console.log('Default template HTML content length:', defaultTemplate.html_content?.length || 0);
            setSelectedTemplate(defaultTemplate);
            setCvStyle({
              templateName: defaultTemplate.id.toString(),
              primaryColor: '#2563eb',
              secondaryColor: '#64748b',
              fontFamily: 'Arial, sans-serif',
              fontSize: 11,
            });
          }
        }
      } catch (error) {
        console.error('Failed to load templates:', error);
      } finally {
        setTemplatesLoading(false);
      }
    };

    loadTemplates();
  }, []);

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
          console.log('Saved sanitized CV data to localStorage');
          
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

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('cv-builder-data');
    const savedStyle = localStorage.getItem('cv-builder-style');
    const savedStep = localStorage.getItem('cv-builder-step');
    const savedCompletedSteps = localStorage.getItem('cv-builder-completed-steps');
    
    // Only load saved data if user hasn't explicitly chosen to start fresh
    const shouldLoadSaved = localStorage.getItem('cv-builder-load-saved') !== 'false';
    
    if (savedData && shouldLoadSaved) {
      try {
        setCvData(JSON.parse(savedData));
      } catch (error) {
        console.error('Failed to load saved CV data:', error);
      }
    }
    
    if (savedStyle && shouldLoadSaved) {
      try {
        setCvStyle(JSON.parse(savedStyle));
      } catch (error) {
        console.error('Failed to load saved CV style:', error);
      }
    }

    if (savedStep) {
      setCurrentStep(parseInt(savedStep));
    }

    if (savedCompletedSteps) {
      try {
        setCompletedSteps(new Set(JSON.parse(savedCompletedSteps)));
      } catch (error) {
        console.error('Failed to load saved completed steps:', error);
      }
    }

    setIsLoading(false);
  }, []);

  // Save current step
  useEffect(() => {
    localStorage.setItem('cv-builder-step', currentStep.toString());
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      // Mark current step as completed before moving to next
      markStepCompleted(currentStep);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    setCurrentStep(step);
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

  const exportAsPDF = async (_options: any) => {
    try {
      console.log('Starting ATS-friendly PDF generation...');
      console.log('CV Data:', cvData);

      // Get the preview element that contains the rendered template
      const previewElement = document.getElementById('cv-preview');
      if (!previewElement) {
        throw new Error('CV preview element not found');
      }
      
      // Create a text-based version of the CV content for ATS compatibility
      const fullName = cvData.fullName || 'Candidate';
      const jobTitle = cvData.jobTitle || '';
      const email = cvData.email || '';
      const phone = cvData.phoneNumber || '';
      const address = cvData.address || '';
      const summary = cvData.professionalSummary || '';
      
      // Build ATS-friendly content
      let atsContent = `${fullName}\n${jobTitle}\n${email} | ${phone}\n${address}\n\n`;
      
      // Professional Summary
      if (summary) {
        atsContent += `PROFESSIONAL SUMMARY\n${summary}\n\n`;
      }
      
      // Work Experience
      if (cvData.workExperience && cvData.workExperience.length > 0) {
        atsContent += `WORK EXPERIENCE\n`;
        cvData.workExperience.forEach(job => {
          atsContent += `${job.jobTitle} | ${job.company}\n`;
          atsContent += `${job.startDate} - ${job.endDate}\n`;
          atsContent += `${job.description}\n\n`;
        });
      }
      
      // Education
      if (cvData.education && cvData.education.length > 0) {
        atsContent += `EDUCATION\n`;
        cvData.education.forEach(edu => {
          atsContent += `${edu.degree} | ${edu.institution}\n`;
          atsContent += `${edu.graduationYear}\n`;
          atsContent += `\n`;
        });
      }
      
      // Skills
      if (cvData.skills) {
        atsContent += `SKILLS\n${cvData.skills}\n\n`;
      }
      
      // Projects
      if (cvData.projects && cvData.projects.length > 0) {
        atsContent += `PROJECTS\n`;
        cvData.projects.forEach(project => {
          atsContent += `${project.name}\n`;
          if (project.startDate || project.endDate) {
            atsContent += `${project.startDate || ''} - ${project.endDate || ''}\n`;
          }
          atsContent += `${project.description}\n`;
          if (project.url) atsContent += `URL: ${project.url}\n`;
          atsContent += `\n`;
        });
      }
      
      // Certificates
      if (cvData.certificates && cvData.certificates.length > 0) {
        atsContent += `CERTIFICATES\n`;
        cvData.certificates.forEach(cert => {
          atsContent += `${cert.name} | ${cert.issuer}\n`;
          atsContent += `${cert.date}\n`;
          if (cert.credentialId) atsContent += `ID: ${cert.credentialId}\n`;
          if (cert.url) atsContent += `URL: ${cert.url}\n`;
          atsContent += `\n`;
        });
      }
      
      // Languages
      if (cvData.languages && cvData.languages.length > 0) {
        atsContent += `LANGUAGES\n`;
        cvData.languages.forEach(lang => {
          atsContent += `${lang.language} - ${lang.proficiency}\n`;
        });
        atsContent += `\n`;
      }
      
      // Achievements
      if (cvData.achievements && cvData.achievements.length > 0) {
        atsContent += `ACHIEVEMENTS\n`;
        cvData.achievements.forEach(achievement => {
          atsContent += `${achievement.title}\n${achievement.description}\n\n`;
        });
      }
      
      // Interests
      if (cvData.interests) {
        atsContent += `INTERESTS\n${cvData.interests}\n\n`;
      }
      
      // References
      if (cvData.references && cvData.references.length > 0) {
        atsContent += `REFERENCES\n`;
        cvData.references.forEach(ref => {
          atsContent += `${ref.name} | ${ref.position} at ${ref.company}\n`;
          atsContent += `Email: ${ref.email}\n`;
          if (ref.phone) atsContent += `Phone: ${ref.phone}\n`;
          atsContent += `\n`;
        });
      }
      
      // Create a full HTML document for the iframe with both ATS content and visual content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${cvData.fullName || 'CV'} - Resume</title>
          <meta charset="utf-8">
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background-color: white;
              color: black;
              font-family: Arial, sans-serif;
            }
            /* Hidden but parseable ATS content */
            .ats-content {
              position: absolute;
              left: -9999px;
              top: 0;
              width: 1px;
              height: 1px;
              overflow: hidden;
              opacity: 0.01;
              /* This content is invisible but accessible to ATS parsers */
            }
            .cv-container {
              width: 100%;
              max-width: 100%;
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            .cv-template {
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 1mm !important;
              box-sizing: border-box !important;
              background-color: white !important;
              color: black !important;
            }
            /* Prevent page breaks inside important sections */
            .section {
              page-break-inside: avoid;
            }
            .item {
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body>
          <!-- Hidden ATS-friendly content -->
          <div class="ats-content" aria-hidden="true">
            <pre>${atsContent}</pre>
          </div>
          
          <!-- Visible styled content -->
          <div class="cv-container">
            ${previewElement.innerHTML}
          </div>
        </body>
        </html>
      `;
      
      // Create a blob from the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      
      // Create an iframe to render the HTML
      const iframe = document.createElement('iframe');
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.style.position = 'absolute';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.src = blobUrl;
      
      document.body.appendChild(iframe);
      
      // Wait for iframe to load
      await new Promise<void>((resolve) => {
        iframe.onload = () => {
          resolve();
        };
      });
      
      // Open the print dialog which allows saving as PDF
      setTimeout(() => {
        try {
          // Set print options to prevent multiple pages if possible
          if (iframe.contentWindow?.document) {
            const styleElement = document.createElement('style');
            styleElement.textContent = `
              @media print {
                body {
                  width: 210mm;
                  height: 297mm;
                }
              }
            `;
            iframe.contentWindow.document.head.appendChild(styleElement);
          }
          
          // Focus the iframe
          iframe.contentWindow?.focus();
          
          // Print the iframe content
          iframe.contentWindow?.print();
          
          // Clean up
          setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(blobUrl);
          }, 1000);
          
          console.log('Print dialog opened for ATS-friendly PDF generation');
        } catch (printError) {
          console.error('Error during print operation:', printError);
          document.body.removeChild(iframe);
          URL.revokeObjectURL(blobUrl);
          throw printError;
        }
      }, 1000);
      
      console.log('ATS-friendly PDF generation process started');

    } catch (error) {
      console.error('Error generating PDF:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      addToast({
        type: 'error',
        title: 'PDF Export Failed',
        description: 'Failed to export as PDF. Please try again.',
        duration: 5000
      });
    }
  };

  const exportAsDOCX = async (_options: any) => {
    // For now, show a message that DOCX export is coming soon
    addToast({
      type: 'info',
      title: 'Coming Soon',
      description: 'DOCX export is coming soon! For now, please use PDF export.',
      duration: 5000
    });
  };

  const exportAsHTML = async (_options: any) => {
    try {
      console.log('Starting ATS-friendly HTML export...');
      
      // Get the CV preview HTML
      const previewElement = document.getElementById('cv-preview');
      if (!previewElement) {
        throw new Error('CV preview not found');
      }
      
      // Create a text-based version of the CV content for ATS compatibility
      const fullName = cvData.fullName || 'Candidate';
      const jobTitle = cvData.jobTitle || '';
      const email = cvData.email || '';
      const phone = cvData.phoneNumber || '';
      const address = cvData.address || '';
      const summary = cvData.professionalSummary || '';
      
      // Build ATS-friendly content
      let atsContent = `${fullName}\n${jobTitle}\n${email} | ${phone}\n${address}\n\n`;
      
      // Professional Summary
      if (summary) {
        atsContent += `PROFESSIONAL SUMMARY\n${summary}\n\n`;
      }
      
      // Work Experience
      if (cvData.workExperience && cvData.workExperience.length > 0) {
        atsContent += `WORK EXPERIENCE\n`;
        cvData.workExperience.forEach(job => {
          atsContent += `${job.jobTitle} | ${job.company}\n`;
          atsContent += `${job.startDate} - ${job.endDate}\n`;
          atsContent += `${job.description}\n\n`;
        });
      }
      
      // Education
      if (cvData.education && cvData.education.length > 0) {
        atsContent += `EDUCATION\n`;
        cvData.education.forEach(edu => {
          atsContent += `${edu.degree} | ${edu.institution}\n`;
          atsContent += `${edu.graduationYear}\n`;
          atsContent += `\n`;
        });
      }
      
      // Skills
      if (cvData.skills) {
        atsContent += `SKILLS\n${cvData.skills}\n\n`;
      }
      
      // Projects
      if (cvData.projects && cvData.projects.length > 0) {
        atsContent += `PROJECTS\n`;
        cvData.projects.forEach(project => {
          atsContent += `${project.name}\n`;
          if (project.startDate || project.endDate) {
            atsContent += `${project.startDate || ''} - ${project.endDate || ''}\n`;
          }
          atsContent += `${project.description}\n`;
          if (project.url) atsContent += `URL: ${project.url}\n`;
          atsContent += `\n`;
        });
      }

      // Create HTML content using the live preview directly with added ATS content
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${cvData.fullName || 'CV'} - Resume</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: white; 
        }
        
        /* Hidden but parseable ATS content */
        .ats-content {
            position: absolute;
            left: -9999px;
            top: 0;
            width: 1px;
            height: 1px;
            overflow: hidden;
            opacity: 0.01;
            /* This content is invisible but accessible to ATS parsers */
        }
        
        /* Prevent page breaks inside important sections */
        .section {
            page-break-inside: avoid;
        }
        .item {
            page-break-inside: avoid;
        }
        
        @media print {
            body { 
                padding: 0; 
                background: white; 
                margin: 0;
            }
            @page {
                margin: 0;
                size: A4 portrait;
            }
        }
    </style>
</head>
<body>
    <!-- Hidden ATS-friendly content -->
    <div class="ats-content" aria-hidden="true">
        <pre>${atsContent}</pre>
    </div>
    
    <!-- Visible styled content -->
    ${previewElement.innerHTML}
    
    <!-- Machine-readable metadata for ATS -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org/",
        "@type": "Person",
        "name": "${cvData.fullName || ''}",
        "jobTitle": "${cvData.jobTitle || ''}",
        "email": "${cvData.email || ''}",
        "telephone": "${cvData.phoneNumber || ''}",
        "address": "${cvData.address || ''}"
    }
    </script>
</body>
</html>`;

      // Create and download the HTML file
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cvData.fullName || 'CV'}_Resume.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      addToast({
        type: 'success',
        title: 'HTML Export Successful',
        description: 'Your CV has been exported as an ATS-friendly HTML file.',
        duration: 5000
      });
    } catch (error) {
      console.error('Error generating HTML:', error);
      addToast({
        type: 'error',
        title: 'Export Failed',
        description: 'Failed to export as HTML. Please try again.',
        duration: 5000
      });
    }
  };

  const exportAsTXT = async (_options: any) => {
    try {
      let txtContent = '';
      
      // Header
      txtContent += `${cvData.fullName || 'CV'}\n`;
      txtContent += `${cvData.jobTitle || ''}\n`;
      txtContent += `${cvData.email || ''} | ${cvData.phoneNumber || ''}\n`;
      txtContent += `${cvData.address || ''}\n\n`;
      
      // Professional Summary
      if (cvData.professionalSummary) {
        txtContent += `PROFESSIONAL SUMMARY\n`;
        txtContent += `${cvData.professionalSummary}\n\n`;
      }
      
      // Work Experience
      if (cvData.workExperience && cvData.workExperience.length > 0) {
        txtContent += `WORK EXPERIENCE\n`;
        cvData.workExperience.forEach(exp => {
          txtContent += `${exp.jobTitle} - ${exp.company}\n`;
          txtContent += `${exp.startDate} - ${exp.endDate}\n`;
          txtContent += `${exp.description}\n\n`;
        });
      }
      
      // Education
      if (cvData.education && cvData.education.length > 0) {
        txtContent += `EDUCATION\n`;
        cvData.education.forEach(edu => {
          txtContent += `${edu.degree}\n`;
          txtContent += `${edu.institution}\n`;
          if (edu.graduationYear) {
            txtContent += `Graduated: ${edu.graduationYear}\n`;
          }
          txtContent += '\n';
        });
      }
      
      // Skills
      if (cvData.skills) {
        txtContent += `SKILLS\n`;
        txtContent += `${cvData.skills}\n\n`;
      }
      
      // Create and download the TXT file
      const blob = new Blob([txtContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cvData.fullName || 'CV'}_Resume.txt`;
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
    }
  };

  const isNextDisabled = () => {
    switch (currentStep) {
      case 1:
        return !cvData.fullName || !cvData.email;
      case 2:
        return !cvData.professionalSummary;
      case 3:
        return cvData.workExperience.length === 0 || !cvData.workExperience[0].jobTitle || !cvData.workExperience[0].company;
      case 4:
        return cvData.education.length === 0 || !cvData.education[0].degree || !cvData.education[0].institution;
      case 5:
        return !cvData.skills;
      default:
        return false;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CV Builder...</p>
        </div>
      </div>
    );
  }

  const handleModeSelection = (mode: 'ai-upload' | 'ai-tailor' | 'manual') => {
    setCreationMode(mode);
    if (mode === 'manual') {
      setCurrentStep(1);
    } else {
      // For AI modes, stay at step 0 but set the creation mode
      setCurrentStep(0);
    }
  };

  const handleAIComplete = () => {
    console.log('handleAIComplete called, switching to manual mode for template selection');
    setCreationMode('manual'); // Switch to manual mode for template selection
    setCurrentStep(8); // Go to template selection after AI processing
    console.log('Switched to manual mode, currentStep set to 8');
  };

  const renderStep = () => {
    // AI Selection Screen - only show when no mode is selected
    if (currentStep === 0 && !creationMode) {
      return <AIFeaturesSelection onSelectMode={handleModeSelection} />;
    }

    // AI Upload Step
    if (creationMode === 'ai-upload') {
      return <AIUploadStep onDataChange={setCvData} onNext={handleAIComplete} />;
    }

    // AI Tailor Step
    if (creationMode === 'ai-tailor') {
      return <AITailorStep onDataChange={setCvData} onNext={handleAIComplete} />;
    }

    // Manual Steps
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep data={cvData} onDataChange={setCvData} onProfilePictureUpload={handleProfilePictureUpload} />;
      case 2:
        return <SummaryStep data={cvData} onDataChange={setCvData} />;
      case 3:
        return <ExperienceStep data={cvData} onDataChange={setCvData} />;
      case 4:
        return <EducationStep data={cvData} onDataChange={setCvData} />;
      case 5:
        return <SkillsAndProjectsStep data={cvData} onDataChange={setCvData} />;
      case 6:
        return <CertificationsAndAchievementsStep data={cvData} onDataChange={setCvData} />;
      case 7:
        return <LanguagesAndInterestsStep data={cvData} onDataChange={setCvData} />;
      case 8:
        return <ReferencesStep data={cvData} onDataChange={setCvData} />;
      case 9:
        return <TemplateStep style={cvStyle} onStyleChange={setCvStyle} data={cvData} templates={templates} templatesLoading={templatesLoading} onTemplateSelect={setSelectedTemplate} selectedTemplate={selectedTemplate} />;
      case 10:
        return <PreviewStep data={cvData} style={cvStyle} onDownload={handleFinish} selectedTemplate={selectedTemplate} />;
      default:
        return <PersonalInfoStep data={cvData} onDataChange={setCvData} onProfilePictureUpload={handleProfilePictureUpload} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileOptimizationStyles />
      <ToastContainer />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">CV Builder</h1>
              <p className="text-sm text-gray-600">Create professional CVs with our step-by-step guide</p>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  const hasExistingData = localStorage.getItem('cv-builder-data') || 
                                        localStorage.getItem('cv-builder-style') || 
                                        localStorage.getItem('cv-builder-step');
                  
                  if (hasExistingData) {
                    setShowResetConfirm(true);
                  } else {
                    handleReset();
                  }
                }}
                className="text-blue-600 hover:text-blue-900 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors duration-200 border border-blue-200 flex-1 sm:flex-none text-center"
              >
                🔄 Start Fresh
              </button>
              
              <button
                onClick={() => window.history.back()}
                className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex-1 sm:flex-none text-center"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Step Indicator - Only show for manual mode */}
      {creationMode === 'manual' && currentStep > 0 && (
        <StepIndicator 
          currentStep={currentStep} 
          totalSteps={totalSteps} 
          onStepClick={handleStepClick} 
          completedSteps={completedSteps}
        />
      )}

      {/* Main Content */}
      <div className="pb-20">
        {renderStep()}
      </div>

      {/* Step Navigation - Only show for manual mode */}
      {creationMode === 'manual' && currentStep > 0 && (
        <StepNavigation
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onFinish={handleFinish}
          isNextDisabled={isNextDisabled()}
        />
      )}

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Reset CV Builder?
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                This will clear all your current CV data and start fresh. This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  Reset & Start Fresh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}