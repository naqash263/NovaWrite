import { useState, useEffect } from 'react';

type ConversionType = 'case' | 'url' | 'base64' | 'binary';

export default function TextConverter() {
  const [conversionType, setConversionType] = useState<ConversionType>('case');
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [caseType, setCaseType] = useState<'upper' | 'lower' | 'title' | 'sentence'>('upper');

  const convertText = () => {
    if (!inputText) {
      setOutputText('');
      return;
    }

    try {
      switch (conversionType) {
        case 'case':
          switch (caseType) {
            case 'upper':
              setOutputText(inputText.toUpperCase());
              break;
            case 'lower':
              setOutputText(inputText.toLowerCase());
              break;
            case 'title':
              setOutputText(inputText.replace(/\w\S*/g, (txt) => 
                txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
              ));
              break;
            case 'sentence':
              setOutputText(inputText.charAt(0).toUpperCase() + inputText.slice(1).toLowerCase());
              break;
          }
          break;
        case 'url':
          setOutputText(encodeURIComponent(inputText));
          break;
        case 'base64':
          setOutputText(btoa(inputText));
          break;
        case 'binary':
          setOutputText(
            inputText.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' ')
          );
          break;
      }
    } catch (error) {
      setOutputText('Error: Invalid input');
    }
  };

  const decodeText = () => {
    if (!inputText) {
      setOutputText('');
      return;
    }

    try {
      switch (conversionType) {
        case 'url':
          setOutputText(decodeURIComponent(inputText));
          break;
        case 'base64':
          setOutputText(atob(inputText));
          break;
        case 'binary':
          setOutputText(
            inputText.split(' ').map(bin => String.fromCharCode(parseInt(bin, 2))).join('')
          );
          break;
        default:
          setOutputText('Decode not available for this type');
      }
    } catch (error) {
      setOutputText('Error: Invalid input');
    }
  };

  const handleInputChange = (value: string) => {
    setInputText(value);
  };

  useEffect(() => {
    if (inputText && conversionType === 'case') {
      convertText();
    }
  }, [inputText, caseType, conversionType]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Conversion Type</label>
        <select
          value={conversionType}
          onChange={(e) => {
            setConversionType(e.target.value as ConversionType);
            setOutputText('');
          }}
          className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm sm:text-base touch-manipulation"
        >
          <option value="case">Case Converter</option>
          <option value="url">URL Encoder/Decoder</option>
          <option value="base64">Base64 Encoder/Decoder</option>
          <option value="binary">Text to Binary / Binary to Text</option>
        </select>
      </div>

      {conversionType === 'case' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Case Type</label>
          <select
            value={caseType}
            onChange={(e) => {
              setCaseType(e.target.value as typeof caseType);
              convertText();
            }}
            className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm sm:text-base touch-manipulation"
          >
            <option value="upper">UPPERCASE</option>
            <option value="lower">lowercase</option>
            <option value="title">Title Case</option>
            <option value="sentence">Sentence case</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Input Text</label>
        <textarea
          value={inputText}
          onChange={(e) => handleInputChange(e.target.value)}
          className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm sm:text-base"
          rows={6}
          placeholder="Enter text to convert..."
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <button
          onClick={convertText}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium touch-manipulation shadow-sm"
        >
          {conversionType === 'case' ? 'Convert' : 'Encode'}
        </button>
        {(conversionType === 'url' || conversionType === 'base64' || conversionType === 'binary') && (
          <button
            onClick={decodeText}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors font-medium touch-manipulation shadow-sm"
          >
            Decode
          </button>
        )}
      </div>

      {outputText && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Output Text</label>
            <button
              onClick={() => copyToClipboard(outputText)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Copy to Clipboard
            </button>
          </div>
          <textarea
            value={outputText}
            readOnly
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-mono"
            rows={6}
          />
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Conversion Types</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Case Converter:</strong> Transform text between uppercase, lowercase, title case, and sentence case</li>
          <li>• <strong>URL Encoder/Decoder:</strong> Encode text for URLs or decode URL-encoded strings</li>
          <li>• <strong>Base64 Encoder/Decoder:</strong> Encode/decode text using Base64 encoding</li>
          <li>• <strong>Binary Converter:</strong> Convert text to binary representation or decode binary to text</li>
        </ul>
      </div>
    </div>
  );
}

