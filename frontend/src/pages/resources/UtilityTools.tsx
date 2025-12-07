import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSEO } from '../../utils/seo';
import { generateBreadcrumbSchema, generateFAQSchema, injectStructuredData } from '../../utils/structuredData';
import AdPlacement from '../../components/AdPlacement';
import PasswordGenerator from '../../components/tools/PasswordGenerator';
import QRCodeGenerator from '../../components/tools/QRCodeGenerator';
import ImageResizer from '../../components/tools/ImageResizer';
import WordCounter from '../../components/tools/WordCounter';
import LoanCalculator from '../../components/tools/LoanCalculator';
import JSONFormatter from '../../components/tools/JSONFormatter';
import PDFMerger from '../../components/tools/PDFMerger';
import PDFSplitter from '../../components/tools/PDFSplitter';
import PDFCompressor from '../../components/tools/PDFCompressor';
import PDFRotate from '../../components/tools/PDFRotate';
import TipCalculator from '../../components/tools/TipCalculator';
import CompoundInterestCalculator from '../../components/tools/CompoundInterestCalculator';
import Base64Encoder from '../../components/tools/Base64Encoder';
import URLEncoder from '../../components/tools/URLEncoder';
import RegexTester from '../../components/tools/RegexTester';
import UUIDGenerator from '../../components/tools/UUIDGenerator';
import JWTDecoder from '../../components/tools/JWTDecoder';
import TextToImage from '../../components/tools/TextToImage';
import LoremIpsumGenerator from '../../components/tools/LoremIpsumGenerator';
import TextCaseConverter from '../../components/tools/TextCaseConverter';
import HashGenerator from '../../components/tools/HashGenerator';
import ImageCompressor from '../../components/tools/ImageCompressor';
import SQLFormatter from '../../components/tools/SQLFormatter';
import CSSFormatter from '../../components/tools/CSSFormatter';
import HTMLFormatter from '../../components/tools/HTMLFormatter';
import ImageFormatConverter from '../../components/tools/ImageFormatConverter';
import ColorPicker from '../../components/tools/ColorPicker';
import MarkdownPreview from '../../components/tools/MarkdownPreview';
import FileConverter from '../../components/tools/FileConverter';
import DocumentConverter from '../../components/tools/DocumentConverter';
import ExcelCsvConverter from '../../components/tools/ExcelCsvConverter';
import AudioConverter from '../../components/tools/AudioConverter';
import TokenCounter from '../../components/tools/TokenCounter';

type ToolType = 
  | 'password-generator' | 'qr-code-generator' 
  | 'image-resizer' | 'word-counter' | 'loan-calculator' | 'json-formatter'
  | 'pdf-merger' | 'pdf-splitter' | 'pdf-compressor' | 'pdf-rotate'
  | 'tip-calculator' | 'compound-interest-calculator' | 'base64-encoder' | 'url-encoder'
  | 'regex-tester' | 'uuid-generator' | 'jwt-decoder' | 'text-to-image'
  | 'lorem-ipsum-generator' | 'text-case-converter' | 'hash-generator' | 'image-compressor'
  | 'sql-formatter' | 'css-formatter' | 'html-formatter' | 'image-format-converter' | 'color-picker' | 'markdown-preview' | 'file-converter' | 'document-converter'
  | 'excel-csv-converter' | 'audio-converter' | 'token-counter';

interface ToolOption {
  id: ToolType;
  name: string;
  icon: string;
  category: 'productivity' | 'developer' | 'financial' | 'pdf';
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
}

const toolOptions: ToolOption[] = [
  { 
    id: 'password-generator', 
    name: 'Password Generator', 
    icon: '🔐', 
    category: 'productivity', 
    description: 'Generate strong, secure, random passwords with customizable options',
    seoTitle: 'Free Password Generator Online - Strong Random Password Creator | No Signup',
    seoDescription: 'Free password generator online - no signup required. Generate strong, secure, random passwords instantly. Customize length, character types, and complexity. Includes password strength meter. All processing in your browser for maximum security.',
    keywords: ['free password generator online', 'password generator', 'random password generator free', 'strong password', 'secure password generator online', 'password creator']
  },
  { 
    id: 'qr-code-generator', 
    name: 'QR Code Generator', 
    icon: '📱', 
    category: 'productivity', 
    description: 'Generate QR codes for URLs, text, WiFi, contact info, and more',
    seoTitle: 'Free QR Code Generator Online - Create QR Codes | No Signup',
    seoDescription: 'Free QR code generator online - no signup required. Generate QR codes instantly for URLs, text, WiFi, contact info, and more. Customize colors, size, and error correction. Download as PNG or SVG. All processing in your browser.',
    keywords: ['free QR code generator online', 'QR code generator', 'QR code maker free online', 'QR code creator', 'generate QR code', 'QR code online']
  },
  { 
    id: 'image-resizer', 
    name: 'Image Resizer', 
    icon: '🖼️', 
    category: 'productivity', 
    description: 'Resize images online with adjustable dimensions, format, and quality',
    seoTitle: 'Free Image Resizer Online - Resize Images | No Signup',
    seoDescription: 'Free image resizer online - no signup required. Resize images online instantly. Adjust width, height, maintain aspect ratio, change format, and adjust quality. Download resized images. All processing in your browser.',
    keywords: ['free image resizer online', 'image resizer', 'resize image online free', 'image size converter', 'resize photo', 'image compressor']
  },
  { 
    id: 'text-to-image', 
    name: 'Text to Image', 
    icon: '✨', 
    category: 'productivity', 
    description: 'Create beautiful images from text with customizable colors, fonts, and layouts',
    seoTitle: 'Free Text to Image Generator Online - Create Images from Text | No Signup',
    seoDescription: 'Free text to image generator online - no signup required. Create beautiful images from text instantly with customizable colors, fonts, and layouts. Perfect for social media posts, quotes, and graphics. All processing in your browser.',
    keywords: ['free text to image generator', 'text to image', 'free text to image generator online', 'text image generator', 'create image from text free', 'text image maker', 'quote image generator']
  },
  { 
    id: 'word-counter', 
    name: 'Word Counter', 
    icon: '📊', 
    category: 'productivity', 
    description: 'Count characters, words, sentences, paragraphs, and analyze text statistics',
    seoTitle: 'Free Word Counter Online - Character Count, Word Count Tool | No Signup',
    seoDescription: 'Free word counter online - no signup required. Count characters, words, sentences, paragraphs instantly. Calculate reading time and speaking time. Text analyzer with comprehensive statistics. Perfect for writers, students, and content creators. All processing in your browser.',
    keywords: ['free word counter online', 'word counter', 'character counter free online', 'text analyzer online free', 'word count', 'character count', 'text counter']
  },
  { 
    id: 'loan-calculator', 
    name: 'Loan Calculator', 
    icon: '💰', 
    category: 'financial', 
    description: 'Calculate monthly payments, total interest, and view amortization schedule',
    seoTitle: 'Free Loan Calculator Online - Mortgage, Auto, Personal Loan | No Signup',
    seoDescription: 'Free loan calculator online - no signup required. Calculate monthly payments, total interest, and amortization schedule for mortgages, auto loans, and personal loans instantly. Multiple payment frequencies. Perfect for financial planning. All calculations in your browser.',
    keywords: ['free loan calculator online', 'loan calculator', 'mortgage calculator free online', 'auto loan calculator', 'personal loan calculator', 'amortization calculator']
  },
  { 
    id: 'tip-calculator', 
    name: 'Tip Calculator', 
    icon: '💵', 
    category: 'financial', 
    description: 'Calculate tip amount, split bill, and total per person',
    seoTitle: 'Free Tip Calculator Online - Calculate Tip & Split Bill | No Signup',
    seoDescription: 'Free tip calculator online - no signup required. Calculate tip amount, split bill, and total per person instantly. Multiple tip percentages, round up option. Perfect for restaurants and services. All calculations in your browser.',
    keywords: ['free tip calculator online', 'tip calculator', 'tip calculator free', 'calculate tip', 'split bill calculator', 'restaurant tip calculator', 'tip percentage calculator']
  },
  { 
    id: 'compound-interest-calculator', 
    name: 'Compound Interest Calculator', 
    icon: '📈', 
    category: 'financial', 
    description: 'Calculate future value, investment growth, and returns with compound interest',
    seoTitle: 'Free Compound Interest Calculator Online - Investment Growth | No Signup',
    seoDescription: 'Free compound interest calculator online - no signup required. Calculate future value, investment growth, and returns instantly. Supports multiple compounding frequencies and additional contributions. Perfect for financial planning. All calculations in your browser.',
    keywords: ['free compound interest calculator', 'compound interest calculator', 'investment calculator free', 'future value calculator', 'compound interest', 'investment growth calculator']
  },
  { 
    id: 'json-formatter', 
    name: 'JSON Formatter', 
    icon: '📋', 
    category: 'developer', 
    description: 'Format, validate, beautify, and minify JSON data with syntax validation',
    seoTitle: 'Free JSON Formatter Online - Beautify, Minify, Validate JSON | No Signup',
    seoDescription: 'Free JSON formatter online - no signup required. Beautify, minify, validate, and format JSON data instantly. Includes syntax highlighting and error detection. JSON beautifier free online. Perfect for developers. All processing in your browser.',
    keywords: ['free JSON formatter online', 'JSON formatter', 'JSON beautifier free online', 'JSON validator', 'JSON beautifier', 'JSON minifier', 'format JSON', 'validate JSON']
  },
  { 
    id: 'base64-encoder', 
    name: 'Base64 Encoder', 
    icon: '🔐', 
    category: 'developer', 
    description: 'Encode text to Base64 or decode Base64 to text with UTF-8 support',
    seoTitle: 'Free Base64 Encoder Decoder Online - Encode Decode Base64 | No Signup',
    seoDescription: 'Free base64 encoder decoder online - no signup required. Encode text to Base64 or decode Base64 to text instantly. UTF-8 support, real-time conversion, copy to clipboard. Perfect for developers and data encoding. All processing in your browser.',
    keywords: ['free base64 encoder decoder online', 'Base64 encoder', 'Base64 decoder', 'base64 encode decode online', 'encode Base64', 'decode Base64', 'Base64 encode decode']
  },
  { 
    id: 'url-encoder', 
    name: 'URL Encoder', 
    icon: '🔗', 
    category: 'developer', 
    description: 'Encode URLs for safe transmission or decode URL-encoded strings',
    seoTitle: 'Free URL Encoder Decoder Online - Encode Decode URL | No Signup',
    seoDescription: 'Free URL encoder decoder online - no signup required. Encode URLs for safe transmission or decode URL-encoded strings instantly. Percent encoding, instant conversion, copy to clipboard. Perfect for developers. All processing in your browser.',
    keywords: ['free URL encoder decoder', 'URL encoder', 'URL encoder decoder online', 'URL encode decode online', 'URL decode', 'percent encoding', 'URL encoding']
  },
  { 
    id: 'regex-tester', 
    name: 'Regex Tester', 
    icon: '🔍', 
    category: 'developer', 
    description: 'Test regular expressions with real-time matching and highlighting',
    seoTitle: 'Free Regex Tester Online - Test Regular Expressions | No Signup',
    seoDescription: 'Free regex tester online - no signup required. Test regular expressions with real-time matching, highlighting, and explanation instantly. Supports all regex flags and common patterns. Perfect for developers. All processing in your browser.',
    keywords: ['free regex tester online', 'regex tester', 'test regex online', 'regular expression tester', 'regex test', 'regex pattern tester', 'online regex']
  },
  { 
    id: 'uuid-generator', 
    name: 'UUID Generator', 
    icon: '🆔', 
    category: 'developer', 
    description: 'Generate unique identifiers (UUIDs) - v1 and v4 support',
    seoTitle: 'Free UUID Generator v4 - Generate UUIDs Online | No Signup Required',
    seoDescription: 'Free UUID generator v4 - no signup required. Generate UUIDs (v1, v4), multiple UUIDs up to 100, validate UUIDs, and copy to clipboard instantly. Perfect for developers and database IDs. All processing in your browser.',
    keywords: ['free UUID generator v4', 'UUID generator', 'UUID generator v4', 'generate UUID v4', 'UUID v1', 'GUID generator', 'online UUID generator']
  },
  { 
    id: 'jwt-decoder', 
    name: 'JWT Decoder', 
    icon: '🔓', 
    category: 'developer', 
    description: 'Decode JWT tokens to view header and payload',
    seoTitle: 'Free JWT Decoder Online - Decode JWT Tokens | No Signup Required',
    seoDescription: 'Free JWT decoder online - no signup required. Decode JWT tokens to view header and payload instantly. Pretty print JSON, validate structure, view token claims. Perfect for debugging JWT tokens. All processing in your browser.',
    keywords: ['free JWT decoder online', 'JWT decoder', 'decode JWT online', 'JWT token decoder', 'JWT parser', 'online JWT decoder']
  },
  { 
    id: 'pdf-merger', 
    name: 'PDF Merger', 
    icon: '🔗', 
    category: 'pdf', 
    description: 'Combine multiple PDF files into one document with drag-and-drop reordering',
    seoTitle: 'Free PDF Merger Online - Combine Multiple PDFs | No Signup',
    seoDescription: 'Free PDF merger online - no signup required. Combine multiple PDF files into one document instantly. Drag and drop reordering, preview before merging. All processing happens in your browser. Perfect for document management.',
    keywords: ['free PDF merger online', 'PDF merger', 'merge PDF files free online', 'combine PDF', 'PDF combiner', 'merge PDF files', 'online PDF merger']
  },
  { 
    id: 'pdf-splitter', 
    name: 'PDF Splitter', 
    icon: '✂️', 
    category: 'pdf', 
    description: 'Split PDF into individual pages or extract specific pages and ranges',
    seoTitle: 'Free PDF Splitter Online - Split PDF Pages | No Signup',
    seoDescription: 'Free PDF splitter online - no signup required. Extract specific pages from PDF, split PDF into multiple files, or extract page ranges instantly. All processing happens in your browser. Perfect for document management.',
    keywords: ['free PDF splitter online', 'PDF splitter', 'split PDF pages free', 'extract PDF pages', 'PDF page extractor', 'split PDF online', 'free PDF splitter']
  },
  { 
    id: 'pdf-compressor', 
    name: 'PDF Compressor', 
    icon: '📦', 
    category: 'pdf', 
    description: 'Reduce PDF file size while maintaining quality with multiple compression levels',
    seoTitle: 'Free PDF Compressor Online - Reduce PDF File Size | No Signup',
    seoDescription: 'Free PDF compressor online - no signup required. Reduce PDF file size while maintaining quality instantly. Choose compression level (low, medium, high). All processing happens in your browser. Perfect for file sharing and storage.',
    keywords: ['free PDF compressor online', 'PDF compressor', 'compress PDF free online', 'reduce PDF size', 'PDF file size reducer', 'online PDF compressor', 'free PDF compressor']
  },
  { 
    id: 'pdf-rotate', 
    name: 'PDF Rotate', 
    icon: '🔄', 
    category: 'pdf', 
    description: 'Rotate PDF pages 90°, 180°, or 270° to fix orientation issues',
    seoTitle: 'Free PDF Rotator Online - Rotate PDF Pages 90, 180, 270 | No Signup',
    seoDescription: 'Free PDF rotator online - no signup required. Rotate PDF pages 90°, 180°, or 270° instantly. Rotate all pages or selected pages. Fix PDF orientation issues. All processing happens in your browser. Perfect for document management.',
    keywords: ['free PDF rotator online', 'PDF rotate', 'rotate PDF pages free', 'rotate PDF', 'PDF page rotator', 'online PDF rotate', 'free PDF rotate']
  },
  { 
    id: 'lorem-ipsum-generator', 
    name: 'Lorem Ipsum Generator', 
    icon: '📝', 
    category: 'productivity', 
    description: 'Generate placeholder text in paragraphs, words, or sentences with multiple text types',
    seoTitle: 'Free Online Lorem Ipsum Generator - Generate Placeholder Text | No Download',
    seoDescription: 'Free online lorem ipsum generator - no download required. Generate placeholder text in paragraphs, words, or sentences instantly. Multiple text types: Lorem Ipsum, Bacon Ipsum, Cupcake Ipsum, Hipster Ipsum. Copy to clipboard. All processing in your browser.',
    keywords: ['free online lorem ipsum generator', 'lorem ipsum generator', 'free lorem ipsum generator', 'lorem ipsum generator no download', 'placeholder text generator', 'dummy text generator', 'lorem ipsum text', 'generate lorem ipsum']
  },
  { 
    id: 'text-case-converter', 
    name: 'Text Case Converter', 
    icon: '🔄', 
    category: 'developer', 
    description: 'Convert text between uppercase, lowercase, camelCase, snake_case, kebab-case, and more',
    seoTitle: 'Free Text Case Converter Online - Uppercase, Lowercase, camelCase | No Signup',
    seoDescription: 'Free text case converter online - no signup required. Convert text to uppercase, lowercase, title case, camelCase, PascalCase, snake_case, kebab-case, and more instantly. Copy to clipboard. Perfect for developers and writers. All processing in your browser.',
    keywords: ['free text case converter online', 'text case converter', 'case converter online free', 'uppercase lowercase converter', 'camelCase converter', 'snake_case converter', 'kebab-case converter']
  },
  { 
    id: 'hash-generator', 
    name: 'Hash Generator', 
    icon: '🔐', 
    category: 'developer', 
    description: 'Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from text or files',
    seoTitle: 'Free Hash Generator Online - MD5, SHA-256, SHA-512 Generator | No Signup',
    seoDescription: 'Free hash generator online - no signup required. Generate SHA-1, SHA-256, and SHA-512 hashes from text or files instantly. Compare hashes, copy to clipboard. Perfect for developers and security professionals. All processing happens in your browser.',
    keywords: ['free hash generator online', 'hash generator', 'MD5 generator', 'SHA-256 generator', 'SHA-1 generator', 'SHA-512 generator', 'hash calculator', 'online hash tool']
  },
  { 
    id: 'image-compressor', 
    name: 'Image Compressor', 
    icon: '🗜️', 
    category: 'productivity', 
    description: 'Reduce image file size while maintaining quality with adjustable compression settings',
    seoTitle: 'Free Image Compressor Online - Reduce Image File Size | No Signup',
    seoDescription: 'Free image compressor online - no signup required. Reduce image file size while maintaining quality instantly. Compress JPEG, PNG, WebP images. Adjust quality, resize dimensions. Download compressed images. All processing in your browser.',
    keywords: ['free image compressor online', 'image compressor', 'compress image online free', 'reduce image size', 'image file size reducer', 'online image compressor', 'free image compressor']
  },
  { 
    id: 'sql-formatter', 
    name: 'SQL Formatter', 
    icon: '💾', 
    category: 'developer', 
    description: 'Format SQL queries with proper indentation, minify SQL, and support multiple database dialects',
    seoTitle: 'Free SQL Formatter Online - Format SQL Queries | No Signup Required',
    seoDescription: 'Free SQL formatter online - no signup required. Format SQL queries with proper indentation, syntax highlighting, and validation instantly. Supports MySQL, PostgreSQL, SQL Server, and more. Minify SQL, copy to clipboard. Perfect for developers. All processing in your browser.',
    keywords: ['free SQL formatter online', 'SQL formatter', 'SQL beautifier free online', 'format SQL', 'SQL query formatter', 'SQL prettifier', 'online SQL formatter']
  },
  { 
    id: 'css-formatter', 
    name: 'CSS Formatter', 
    icon: '🎨', 
    category: 'developer', 
    description: 'Format CSS code with proper indentation, minify CSS, and validate syntax',
    seoTitle: 'Free CSS Formatter Beautifier Online - Format CSS | No Signup',
    seoDescription: 'Free CSS formatter beautifier online - no signup required. Format CSS code with proper indentation, minify CSS, and validate syntax instantly. Beautify or minify CSS. Perfect for developers and web designers. All processing in your browser.',
    keywords: ['free CSS formatter beautifier', 'CSS formatter', 'CSS formatter beautifier', 'CSS beautifier free', 'format CSS', 'CSS code formatter', 'CSS prettifier', 'CSS minifier']
  },
  { 
    id: 'html-formatter', 
    name: 'HTML Formatter', 
    icon: '🌐', 
    category: 'developer', 
    description: 'Format HTML code with proper indentation, minify HTML, and validate syntax',
    seoTitle: 'Free HTML Formatter Online - Format HTML Code | No Signup',
    seoDescription: 'Free HTML formatter online - no signup required. Format HTML code with proper indentation, minify HTML, and validate syntax instantly. Beautify or minify HTML. Perfect for developers and web designers. All processing in your browser.',
    keywords: ['free HTML formatter online', 'HTML formatter', 'HTML formatter online', 'format HTML online', 'HTML beautifier', 'format HTML', 'HTML code formatter', 'HTML prettifier', 'HTML minifier']
  },
  { 
    id: 'image-format-converter', 
    name: 'Image Format Converter', 
    icon: '🔄', 
    category: 'productivity', 
    description: 'Convert images between JPEG, PNG, GIF, WebP, and BMP formats',
    seoTitle: 'Free Image Format Converter Online - Convert JPEG, PNG, GIF, WebP | No Signup',
    seoDescription: 'Free image format converter online - no signup required. Convert images between JPEG, PNG, GIF, WebP, and BMP formats instantly. Maintain quality, adjust compression, download converted images. All processing in your browser.',
    keywords: ['free image format converter online', 'image format converter', 'convert image format online', 'JPEG to PNG', 'PNG to JPEG', 'image converter', 'format converter']
  },
  { 
    id: 'color-picker', 
    name: 'Color Picker', 
    icon: '🎨', 
    category: 'developer', 
    description: 'Pick colors visually and get RGB, HEX, HSL values with color palette generator',
    seoTitle: 'Free Color Picker Online - RGB, HEX, HSL Picker | No Signup',
    seoDescription: 'Free color picker online - no signup required. Pick colors with visual color picker, get RGB, HEX, HSL values instantly. Generate color palettes, extract colors from images. Perfect for designers and developers. All processing in your browser.',
    keywords: ['free color picker online', 'color picker', 'RGB HEX color picker free', 'RGB color picker', 'HEX color picker', 'HSL color picker', 'color palette generator', 'color picker online']
  },
  { 
    id: 'markdown-preview', 
    name: 'Markdown Preview', 
    icon: '📄', 
    category: 'developer', 
    description: 'Live markdown preview and HTML converter with dark/light themes',
    seoTitle: 'Free Markdown Preview Editor Online - Live Preview | No Signup',
    seoDescription: 'Free markdown preview editor online - no signup required. Write markdown and see live preview instantly. Convert markdown to HTML, export HTML code. Dark and light themes. Perfect for developers and content creators. All processing in your browser.',
    keywords: ['free markdown preview editor', 'markdown preview', 'markdown preview editor', 'markdown editor online', 'markdown to HTML', 'live markdown preview', 'markdown converter', 'markdown viewer']
  },
  { 
    id: 'file-converter', 
    name: 'File Converter', 
    icon: '📁', 
    category: 'productivity', 
    description: 'Convert files between TXT, CSV, JSON, XML, YAML, and HTML formats',
    seoTitle: 'Free File Converter Online - Convert TXT, CSV, JSON, XML, YAML, HTML | No Signup',
    seoDescription: 'Free file converter online - no signup required. Convert files between TXT, CSV, JSON, XML, YAML, and HTML formats instantly. Automatic format detection, bidirectional conversions, real-time preview. All processing happens in your browser.',
    keywords: ['free file converter online', 'file converter', 'convert file format online', 'TXT to JSON', 'CSV to JSON', 'JSON to XML', 'XML to YAML', 'file format converter']
  },
  { 
    id: 'document-converter', 
    name: 'Document Converter', 
    icon: '📄', 
    category: 'productivity', 
    description: 'Convert documents between PDF, Word (DOCX), and TXT formats',
    seoTitle: 'Free Document Converter Word PDF - Convert Word to PDF Online | No Signup',
    seoDescription: 'Free document converter word pdf - no signup required. Convert Word to PDF, PDF to Word, DOCX to PDF, PDF to DOCX instantly. Secure server-side processing, download converted files. Perfect for document management.',
    keywords: ['free document converter word pdf', 'document converter', 'word to pdf converter', 'pdf to word', 'docx to pdf', 'pdf to docx', 'document format converter']
  },
  { 
    id: 'excel-csv-converter', 
    name: 'Excel CSV Converter', 
    icon: '📊', 
    category: 'productivity', 
    description: 'Convert Excel spreadsheets (XLSX, XLS) to CSV format and vice versa',
    seoTitle: 'Free Excel CSV Converter Online - Convert XLSX to CSV | No Signup',
    seoDescription: 'Free excel csv converter online - no signup required. Convert XLSX, XLS files to CSV format and vice versa instantly. Preserve data integrity, perfect for data import/export and database migration. Secure server-side processing.',
    keywords: ['free excel csv converter online', 'excel csv converter', 'excel to csv converter', 'csv to excel', 'xlsx to csv', 'csv to xlsx', 'excel converter', 'csv converter']
  },
  { 
    id: 'audio-converter', 
    name: 'Audio Converter', 
    icon: '🎵', 
    category: 'productivity', 
    description: 'Convert audio files between MP3, WAV, and other formats',
    seoTitle: 'Free Audio Converter MP3 WAV Online - Convert Audio Files | No Signup',
    seoDescription: 'Free audio converter mp3 wav online - no signup required. Convert MP3 to WAV, WAV to MP3, and other audio formats instantly. Perfect for audio editing, compatibility, and professional use. Secure server-side processing, download converted files.',
    keywords: ['free audio converter mp3 wav', 'audio converter', 'mp3 to wav converter', 'wav to mp3', 'mp3 converter', 'wav converter', 'audio format converter']
  },
  { 
    id: 'token-counter', 
    name: 'Token Counter', 
    icon: '🔢', 
    category: 'developer', 
    description: 'Count tokens for AI models (GPT, Claude, Gemini) and estimate API costs',
    seoTitle: 'Free Token Counter AI Models - Count GPT, Claude, Gemini Tokens | No Signup',
    seoDescription: 'Free token counter AI models - no signup required. Count tokens for GPT-3.5, GPT-4, Claude, Gemini, and other AI models instantly. Estimate API costs and track token usage. Perfect for AI developers. All processing in your browser.',
    keywords: ['free token counter AI models', 'token counter', 'AI token counter', 'gpt token counter', 'claude token counter', 'token calculator', 'openai token counter']
  },
];

export default function UtilityTools() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTool, setSelectedTool] = useState<ToolType>(
    (searchParams.get('tool') as ToolType) || 'password-generator'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    productivity: true,
    developer: true,
    financial: true,
    pdf: true,
  });

  const selectedToolInfo = toolOptions.find(t => t.id === selectedTool);
  
  // Dynamic SEO based on selected tool
  const seoTitle = selectedToolInfo?.seoTitle || 'Free Utility Tools - Password Generator, QR Code, PDF Tools & More | Naqash Thaheem';
  const seoDescription = selectedToolInfo?.seoDescription || 'Comprehensive collection of free utility tools: Password Generator, QR Code Generator, Image Resizer, Word Counter, Loan Calculator, JSON Formatter, and PDF tools. All tools are free and easy to use.';
  const seoKeywords = selectedToolInfo?.keywords || ['utility tools', 'password generator', 'QR code generator', 'image resizer', 'word counter', 'loan calculator', 'JSON formatter', 'PDF tools', 'free tools', 'online tools'];

  useSEO({
    title: seoTitle,
    description: seoDescription,
    url: `/resources/utility-tools${selectedTool !== 'password-generator' ? `?tool=${selectedTool}` : ''}`,
    keywords: seoKeywords,
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': selectedToolInfo?.name || 'Utility Tools',
      'description': seoDescription,
      'url': 'https://naqashthaheem.com/resources/utility-tools',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': toolOptions.map(t => t.name),
    }
  });

  useEffect(() => {
    // Add breadcrumb structured data
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://naqashthaheem.com' },
      { name: 'Resources', url: 'https://naqashthaheem.com/resources' },
      { name: 'Utility Tools', url: 'https://naqashthaheem.com/resources/utility-tools' },
      ...(selectedToolInfo ? [{ name: selectedToolInfo.name, url: `https://naqashthaheem.com/resources/utility-tools?tool=${selectedTool}` }] : [])
    ]);
    injectStructuredData(breadcrumbSchema);

    // Add FAQ structured data
    const faqSchema = generateFAQSchema([
      {
        question: 'Are these utility tools free to use?',
        answer: 'Yes, all utility tools are completely free to use with no registration required. You can use them as many times as you need without any limitations.'
      },
      {
        question: 'Do these tools store my data?',
        answer: 'No, all processing is performed locally in your browser. We do not store, track, or transmit any of your input data. Your privacy is our priority.'
      },
      {
        question: 'Can I use these tools on mobile devices?',
        answer: 'Yes, all utility tools are fully responsive and work perfectly on mobile phones, tablets, and desktop computers.'
      },
      {
        question: 'How accurate are the calculations?',
        answer: 'All calculations use standard formulas and are accurate. Loan calculator uses standard amortization formulas, and all other tools use reliable algorithms.'
      },
      {
        question: 'Can I download the results?',
        answer: 'Yes, many tools support downloading results. QR codes can be downloaded as PNG or SVG, resized images can be downloaded, and JSON can be copied to clipboard.'
      }
    ]);
    injectStructuredData(faqSchema);
  }, [selectedTool, selectedToolInfo]);

  const handleToolSelect = (toolId: ToolType) => {
    setSelectedTool(toolId);
    setSearchParams({ tool: toolId });
  };

  const filteredTools = toolOptions.filter(option =>
    option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedTools = {
    productivity: filteredTools.filter(t => t.category === 'productivity'),
    financial: filteredTools.filter(t => t.category === 'financial'),
    developer: filteredTools.filter(t => t.category === 'developer'),
    pdf: filteredTools.filter(t => t.category === 'pdf'),
  };

  const renderTool = () => {
    switch (selectedTool) {
      case 'password-generator': return <PasswordGenerator />;
      case 'qr-code-generator': return <QRCodeGenerator />;
      case 'image-resizer': return <ImageResizer />;
      case 'word-counter': return <WordCounter />;
      case 'loan-calculator': return <LoanCalculator />;
      case 'tip-calculator': return <TipCalculator />;
      case 'compound-interest-calculator': return <CompoundInterestCalculator />;
      case 'json-formatter': return <JSONFormatter />;
      case 'base64-encoder': return <Base64Encoder />;
      case 'url-encoder': return <URLEncoder />;
      case 'regex-tester': return <RegexTester />;
      case 'uuid-generator': return <UUIDGenerator />;
      case 'jwt-decoder': return <JWTDecoder />;
      case 'text-to-image': return <TextToImage />;
      case 'pdf-merger': return <PDFMerger />;
      case 'pdf-splitter': return <PDFSplitter />;
      case 'pdf-compressor': return <PDFCompressor />;
      case 'pdf-rotate': return <PDFRotate />;
      case 'lorem-ipsum-generator': return <LoremIpsumGenerator />;
      case 'text-case-converter': return <TextCaseConverter />;
      case 'hash-generator': return <HashGenerator />;
      case 'image-compressor': return <ImageCompressor />;
      case 'sql-formatter': return <SQLFormatter />;
      case 'css-formatter': return <CSSFormatter />;
      case 'html-formatter': return <HTMLFormatter />;
      case 'image-format-converter': return <ImageFormatConverter />;
      case 'color-picker': return <ColorPicker />;
      case 'markdown-preview': return <MarkdownPreview />;
      case 'file-converter': return <FileConverter />;
      case 'document-converter': return <DocumentConverter />;
      case 'excel-csv-converter': return <ExcelCsvConverter />;
      case 'audio-converter': return <AudioConverter />;
      case 'token-counter': return <TokenCounter />;
      default: return <PasswordGenerator />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            🛠️ Utility Tools
          </h1>
          <p className="text-gray-600">
            Free online utility tools for productivity, development, financial calculations, and PDF manipulation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 sticky top-4">
              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Tool List */}
              <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                {Object.entries(groupedTools).map(([category, tools]) => {
                  if (tools.length === 0) return null;
                  
                  const categoryNames: Record<string, string> = {
                    productivity: '📦 Productivity Tools',
                    developer: '💻 Developer Tools',
                    financial: '💰 Financial Tools',
                    pdf: '📄 PDF Tools',
                  };
                  
                  const isExpanded = expandedCategories[category] ?? true;
                  
                  return (
                    <div key={category} className="mb-3">
                      <button
                        onClick={() => setExpandedCategories(prev => ({
                          ...prev,
                          [category]: !prev[category]
                        }))}
                        className="w-full flex items-center justify-between px-2 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <span>{categoryNames[category] || category}</span>
                        <svg
                          className={`w-4 h-4 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isExpanded && (
                        <div className="mt-1 space-y-1">
                          {tools.map((tool) => (
                            <button
                              key={tool.id}
                              onClick={() => handleToolSelect(tool.id)}
                              className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                                selectedTool === tool.id
                                  ? 'bg-blue-100 text-blue-900 font-medium'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <span className="mr-2">{tool.icon}</span>
                              {tool.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Ad at top of tool */}
            <div className="mb-6">
              <AdPlacement position="content-top" />
            </div>
            
            {renderTool()}
            <AdPlacement position="content-bottom" />
          </div>
        </div>
      </div>
    </div>
  );
}

