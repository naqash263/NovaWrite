import { useState, useRef } from 'react';
import { useSEO } from '../../utils/seo';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

type AudioFormat = 'mp3' | 'wav';

export default function AudioConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceFormat, setSourceFormat] = useState<AudioFormat | null>(null);
  const [targetFormat, setTargetFormat] = useState<AudioFormat>('wav');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useSEO({
    title: 'Free Audio Converter MP3 WAV Online - Convert Audio Files | No Signup',
    description: 'Free audio converter mp3 wav online - no signup required. Convert MP3 to WAV, WAV to MP3, and other audio formats instantly. Perfect for audio editing, compatibility, and professional use. Secure server-side processing.',
    url: '/resources/utility-tools/audio-converter',
    keywords: [
      'free audio converter mp3 wav', 'audio converter', 'free audio converter', 'audio converter mp3 wav', 'mp3 to wav converter',
      'mp3 to wav', 'wav to mp3', 'mp3 converter', 'wav converter',
      'audio format converter', 'online audio converter',
      'convert mp3', 'convert wav', 'audio file converter', 'free online audio converter'
    ],
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Audio Converter',
      'description': 'Free online audio converter. Convert MP3 to WAV, WAV to MP3, and other audio formats.',
      'url': 'https://naqashthaheem.com/resources/utility-tools/audio-converter',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': [
        'Convert MP3 to WAV',
        'Convert WAV to MP3',
        'Support multiple audio formats',
        'Download converted files',
        'Secure server-side processing'
      ]
    }
  });

  const detectFormat = (filename: string): AudioFormat | null => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (extension === 'wav') {
      return 'wav';
    }
    
    if (['mp3', 'aac', 'ogg', 'flac', 'm4a'].includes(extension || '')) {
      return 'mp3';
    }
    
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSelectedFile(file);
    setDownloadUrl('');
    setFilename('');

    const format = detectFormat(file.name);
    if (!format) {
      setError('Unsupported file format. Please upload MP3, WAV, AAC, OGG, FLAC, or M4A files.');
      return;
    }

    setSourceFormat(format);
    
    // Set default target format
    if (format === 'mp3') {
      setTargetFormat('wav');
    } else {
      setTargetFormat('mp3');
    }
  };

  const convertAudio = async () => {
    if (!selectedFile || !sourceFormat) {
      setError('Please select a file first');
      return;
    }

    if (sourceFormat === targetFormat) {
      setError('Source and target formats are the same. Please select a different target format.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setDownloadUrl('');
    setFilename('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('target_format', targetFormat);

      const response = await fetch(`${API_URL}/utility-tools/audio-converter/convert`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to convert audio');
      }

      if (data.success && data.data) {
        setDownloadUrl(data.data.url);
        setFilename(data.data.filename);
      } else {
        throw new Error(data.message || 'Failed to convert audio');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while converting the audio');
      setDownloadUrl('');
      setFilename('');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadConverted = () => {
    if (!downloadUrl) return;
    window.open(downloadUrl, '_blank');
  };

  const reset = () => {
    setSelectedFile(null);
    setSourceFormat(null);
    setDownloadUrl('');
    setFilename('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Free Audio Converter MP3 WAV Online</h1>
        <p className="text-gray-600 mb-6">
          Free audio converter mp3 wav online - no signup required. Convert audio files between MP3, WAV, and other formats instantly. Perfect for audio editing, compatibility, and professional use. Secure server-side processing, download converted files. 
          compatibility, and professional audio production.
        </p>

        {/* Server Limitation Notice */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Note:</strong> Audio conversion requires FFmpeg on the server. On shared hosting, 
            FFmpeg is typically not available. If conversion fails, please use a desktop application 
            or contact your hosting provider to enable FFmpeg.
          </p>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Audio File
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.aac,.ogg,.flac,.m4a"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {sourceFormat && (
            <p className="text-sm text-gray-600 mt-2">
              Detected format: <span className="font-semibold">{sourceFormat.toUpperCase()}</span>
            </p>
          )}
        </div>

        {/* Format Selection */}
        {selectedFile && sourceFormat && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Format
              </label>
              <input
                type="text"
                value={sourceFormat.toUpperCase()}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Format
              </label>
              <select
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value as AudioFormat)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sourceFormat !== 'wav' && <option value="wav">WAV (Uncompressed)</option>}
                {sourceFormat !== 'mp3' && <option value="mp3">MP3 (Compressed)</option>}
              </select>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {downloadUrl && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm mb-3">
              ✅ Audio converted successfully!
            </p>
            <button
              onClick={downloadConverted}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Download Converted Audio ({filename})
            </button>
          </div>
        )}

        {/* Action Buttons */}
        {selectedFile && sourceFormat && (
          <div className="flex gap-4">
            <button
              onClick={convertAudio}
              disabled={isProcessing || sourceFormat === targetFormat}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Converting...' : 'Convert Audio'}
            </button>
            <button
              onClick={reset}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Reset
            </button>
          </div>
        )}

        {/* Supported Conversions */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Supported Formats</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-700">
            <div>✅ MP3 → WAV</div>
            <div>✅ WAV → MP3</div>
            <div>✅ AAC → MP3/WAV</div>
            <div>✅ OGG → MP3/WAV</div>
            <div>✅ FLAC → MP3/WAV</div>
            <div>✅ M4A → MP3/WAV</div>
          </div>
        </div>
      </div>

      {/* SEO Content */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">About Audio Converter</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-4">
            Audio Converter is a free online tool that converts audio files between MP3, WAV, and other formats. 
            Perfect for audio editing, compatibility with different devices and applications, and professional audio production.
          </p>
          
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Supported Formats</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>MP3:</strong> Compressed audio format, widely compatible, smaller file size.</li>
            <li><strong>WAV:</strong> Uncompressed audio format, high quality, larger file size.</li>
            <li><strong>AAC:</strong> Advanced audio coding, used by Apple devices.</li>
            <li><strong>OGG:</strong> Open-source audio format, good compression.</li>
            <li><strong>FLAC:</strong> Lossless audio format, high quality, larger file size.</li>
            <li><strong>M4A:</strong> Apple audio format, used in iTunes.</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Key Features</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>Multiple Format Support:</strong> Convert between MP3, WAV, AAC, OGG, FLAC, and M4A.</li>
            <li><strong>Quality Preservation:</strong> Maintain audio quality during conversion where possible.</li>
            <li><strong>Secure Processing:</strong> All conversions happen on secure servers.</li>
            <li><strong>No Registration:</strong> Start converting audio files immediately without creating an account.</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Use Cases</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>Audio Editing:</strong> Convert audio files for use in editing software.</li>
            <li><strong>Device Compatibility:</strong> Convert audio files for compatibility with different devices.</li>
            <li><strong>File Size Optimization:</strong> Convert WAV to MP3 for smaller file sizes.</li>
            <li><strong>Professional Production:</strong> Convert audio files for professional audio production workflows.</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Server Requirements</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-gray-700 text-sm mb-2">
              <strong>Important:</strong> Audio conversion requires FFmpeg on the server. On shared hosting, 
              FFmpeg is typically not available. If conversion fails, consider:
            </p>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
              <li>Using a desktop application like Audacity or VLC Media Player</li>
              <li>Using online services that support audio conversion</li>
              <li>Contacting your hosting provider to enable FFmpeg</li>
              <li>Upgrading to a VPS or dedicated server with FFmpeg support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

