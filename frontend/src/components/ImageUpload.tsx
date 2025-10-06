import React, { useState, useRef } from 'react';
import apiClient from '../api/axios';

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  currentImage?: string;
  className?: string;
  label?: string;
  accept?: string;
  maxSize?: number; // in MB
}

export default function ImageUpload({ 
  onImageUploaded, 
  currentImage, 
  className = '',
  label = 'Upload Image',
  accept = 'image/*',
  maxSize = 5
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset states
    setError('');
    setSuccess(false);
    setUploadProgress(0);

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload file with progress tracking
      const formData = new FormData();
      formData.append('file', file);
      formData.append('is_public', 'true');

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      const response = await apiClient.post('/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });

      // Complete progress
      setUploadProgress(100);
      clearInterval(progressInterval);

      // Get the full URL for the uploaded image
      const imageUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${response.data.file.path}`;
      onImageUploaded(imageUrl);
      
      // Show success state
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload image');
      setPreview(null);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    setError('');
    setSuccess(false);
    setUploadProgress(0);
    onImageUploaded('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <div className="space-y-3">
        {/* Preview */}
        {preview && (
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Preview"
              className={`w-32 h-32 object-cover rounded-lg border border-gray-300 transition-opacity ${
                uploading ? 'opacity-50' : ''
              }`}
            />
            {!uploading && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
              >
                ×
              </button>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
              </div>
            )}
          </div>
        )}

        {/* Upload Button */}
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleClick}
            disabled={uploading}
            className={`px-4 py-2 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
              uploading
                ? 'border-blue-300 text-blue-600 bg-blue-50 cursor-not-allowed'
                : success
                ? 'border-green-300 text-green-600 bg-green-50 hover:bg-green-100'
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              {uploading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              )}
              {success && !uploading && (
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              <span>
                {uploading ? 'Uploading...' : success ? 'Upload Complete!' : preview ? 'Change Image' : 'Select Image'}
              </span>
            </div>
          </button>

          {/* Progress Bar */}
          {uploading && (
            <div className="w-full">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center space-x-2 text-sm text-red-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && !uploading && (
          <div className="flex items-center space-x-2 text-sm text-green-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Image uploaded successfully!</span>
          </div>
        )}

        {/* Help Text */}
        <p className="text-xs text-gray-500">
          Supported formats: JPG, PNG, GIF, WebP, SVG. Max size: {maxSize}MB
        </p>
      </div>
    </div>
  );
}
