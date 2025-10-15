import React, { useState, useRef } from 'react';
import apiClient from '../api/axios';
import { useToast } from '../hooks/use-toast';

interface SeoFileUploadProps {
  onUploadSuccess?: (file: any) => void;
  context?: string;
  className?: string;
  accept?: string;
  maxSize?: number;
}

interface UploadProgress {
  uploading: boolean;
  progress: number;
  message: string;
}

const SeoFileUpload: React.FC<SeoFileUploadProps> = ({
  onUploadSuccess,
  context,
  className = '',
  accept = 'image/*,application/pdf,.doc,.docx,.txt,.zip,.json',
  maxSize = 10 * 1024 * 1024 // 10MB
}) => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    uploading: false,
    progress: 0,
    message: ''
  });
  const [customName, setCustomName] = useState('');
  const [uploadContext, setUploadContext] = useState(context || '');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const handleFileUpload = async (file: File) => {
    if (file.size > maxSize) {
      addToast({
        type: 'error',
        title: 'File Too Large',
        description: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
      });
      return;
    }

    setUploadProgress({
      uploading: true,
      progress: 0,
      message: 'Preparing file for upload...'
    });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('is_public', 'true');
      
      if (uploadContext) {
        formData.append('context', uploadContext);
      }
      
      if (customName) {
        formData.append('custom_name', customName);
      }

      setUploadProgress({
        uploading: true,
        progress: 30,
        message: 'Generating SEO-friendly filename...'
      });

      const response = await apiClient.post('/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress({
            uploading: true,
            progress: Math.min(progress, 90),
            message: 'Uploading file...'
          });
        },
      });

      setUploadProgress({
        uploading: true,
        progress: 100,
        message: 'Processing SEO metadata...'
      });

      // Show SEO data in toast
      const seoData = response.data.seo_data;
      addToast({
        type: 'success',
        title: 'File Uploaded Successfully',
        description: `SEO Score: ${seoData.seo_score}/100 - ${seoData.seo_name}`,
        duration: 5000
      });

      // Show detailed SEO information
      console.log('SEO Data:', seoData);
      console.log('Keywords:', seoData.keywords);
      console.log('Description:', seoData.description);

      if (onUploadSuccess) {
        onUploadSuccess(response.data.file);
      }

      // Reset form
      setCustomName('');
      setUploadContext(context || '');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      addToast({
        type: 'error',
        title: 'Upload Failed',
        description: error.response?.data?.message || 'Failed to upload file'
      });
    } finally {
      setUploadProgress({
        uploading: false,
        progress: 0,
        message: ''
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`seo-file-upload ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploadProgress.uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={uploadProgress.uploading}
        />

        {uploadProgress.uploading ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 mb-2">
                {uploadProgress.message}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.progress}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {uploadProgress.progress}%
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto text-gray-400">
              <svg
                className="w-full h-full"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drop files here or click to upload
              </p>
              <p className="text-sm text-gray-500">
                Files will be automatically renamed with SEO-friendly names
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SEO Configuration */}
      {!uploadProgress.uploading && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Context (Optional)
            </label>
            <input
              type="text"
              value={uploadContext}
              onChange={(e) => setUploadContext(e.target.value)}
              placeholder="e.g., business-report, tutorial-guide, marketing-material"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be included in the SEO-friendly filename
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Name (Optional)
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g., my-awesome-document"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Override the automatic filename generation
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              🚀 SEO Benefits
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Automatic SEO-friendly filename generation</li>
              <li>• AI-powered keyword extraction</li>
              <li>• Content categorization and tagging</li>
              <li>• Search engine optimization</li>
              <li>• Better discoverability</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeoFileUpload;

