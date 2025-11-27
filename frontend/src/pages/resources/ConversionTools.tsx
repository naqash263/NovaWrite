import { useState, useEffect } from 'react';
import { useSEO } from '../../utils/seo';
import { generateBreadcrumbSchema, generateFAQSchema, injectStructuredData } from '../../utils/structuredData';
import AdPlacement from '../../components/AdPlacement';
import LengthConverter from '../../components/converters/LengthConverter';
import WeightConverter from '../../components/converters/WeightConverter';
import VolumeConverter from '../../components/converters/VolumeConverter';
import TemperatureConverter from '../../components/converters/TemperatureConverter';
import AreaConverter from '../../components/converters/AreaConverter';
import SpeedConverter from '../../components/converters/SpeedConverter';
import CurrencyConverter from '../../components/converters/CurrencyConverter';
import TimeZoneConverter from '../../components/converters/TimeZoneConverter';
import DateCalculator from '../../components/converters/DateCalculator';
import NumberSystemConverter from '../../components/converters/NumberSystemConverter';
import TextConverter from '../../components/converters/TextConverter';
import ColorConverter from '../../components/converters/ColorConverter';
import FileSizeConverter from '../../components/converters/FileSizeConverter';
import PercentageCalculator from '../../components/converters/PercentageCalculator';
import BMICalculator from '../../components/converters/BMICalculator';

type ConverterType = 
  | 'length' | 'weight' | 'volume' | 'temperature' | 'area' | 'speed'
  | 'currency' | 'timezone' | 'date' | 'number' | 'text' | 'color'
  | 'filesize' | 'percentage' | 'bmi';

interface ConverterOption {
  id: ConverterType;
  name: string;
  icon: string;
  category: 'measurement' | 'utility' | 'technical' | 'health';
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
}

const converterOptions: ConverterOption[] = [
  // Measurement Converters
  { 
    id: 'length', 
    name: 'Length Converter', 
    icon: '📏', 
    category: 'measurement', 
    description: 'Convert between meters, feet, inches, kilometers, miles, and more',
    seoTitle: 'Free Length Converter - Meters to Feet, Inches, Kilometers, Miles | Online Unit Converter',
    seoDescription: 'Free online length converter. Convert meters to feet, inches to centimeters, kilometers to miles, and more. Instant, accurate conversions for all length units.',
    keywords: ['length converter', 'meters to feet', 'inches to cm', 'km to miles', 'unit converter', 'distance converter']
  },
  { 
    id: 'weight', 
    name: 'Weight Converter', 
    icon: '⚖️', 
    category: 'measurement', 
    description: 'Convert between kilograms, pounds, ounces, grams, and tons',
    seoTitle: 'Free Weight Converter - Kilograms to Pounds, Ounces, Grams | Online Unit Converter',
    seoDescription: 'Free online weight converter. Convert kilograms to pounds, ounces to grams, tons to kilograms, and more. Accurate weight conversions for all units.',
    keywords: ['weight converter', 'kg to lbs', 'pounds to kg', 'ounces to grams', 'weight calculator']
  },
  { 
    id: 'volume', 
    name: 'Volume Converter', 
    icon: '🧪', 
    category: 'measurement', 
    description: 'Convert between liters, gallons, cups, milliliters, and fluid ounces',
    seoTitle: 'Free Volume Converter - Liters to Gallons, Cups, Milliliters | Online Unit Converter',
    seoDescription: 'Free online volume converter. Convert liters to gallons, cups to milliliters, fluid ounces to liters, and more. Accurate volume conversions for cooking and science.',
    keywords: ['volume converter', 'liters to gallons', 'cups to ml', 'fluid ounces converter', 'volume calculator']
  },
  { 
    id: 'temperature', 
    name: 'Temperature Converter', 
    icon: '🌡️', 
    category: 'measurement', 
    description: 'Convert between Celsius, Fahrenheit, and Kelvin',
    seoTitle: 'Free Temperature Converter - Celsius to Fahrenheit, Kelvin | Online Unit Converter',
    seoDescription: 'Free online temperature converter. Convert Celsius to Fahrenheit, Fahrenheit to Celsius, Kelvin conversions, and more. Accurate temperature conversions with reference points.',
    keywords: ['temperature converter', 'celsius to fahrenheit', 'fahrenheit to celsius', 'kelvin converter', 'temp converter']
  },
  { 
    id: 'area', 
    name: 'Area Converter', 
    icon: '📐', 
    category: 'measurement', 
    description: 'Convert between square meters, square feet, acres, hectares, and more',
    seoTitle: 'Free Area Converter - Square Meters to Square Feet, Acres, Hectares | Online Unit Converter',
    seoDescription: 'Free online area converter. Convert square meters to square feet, acres to hectares, square yards to square meters, and more. Accurate area conversions for real estate and construction.',
    keywords: ['area converter', 'square meters to square feet', 'acres to hectares', 'area calculator', 'square feet converter']
  },
  { 
    id: 'speed', 
    name: 'Speed Converter', 
    icon: '🚗', 
    category: 'measurement', 
    description: 'Convert between km/h, mph, m/s, knots, and more',
    seoTitle: 'Free Speed Converter - KM/H to MPH, M/S, Knots | Online Unit Converter',
    seoDescription: 'Free online speed converter. Convert km/h to mph, meters per second to miles per hour, knots to km/h, and more. Accurate speed conversions for travel and science.',
    keywords: ['speed converter', 'kmh to mph', 'mph to kmh', 'knots converter', 'speed calculator']
  },
  
  // Utility Converters
  { 
    id: 'currency', 
    name: 'Currency Converter', 
    icon: '💱', 
    category: 'utility', 
    description: 'Convert between different currencies with real-time exchange rates',
    seoTitle: 'Free Currency Converter - Real-Time Exchange Rates | 60+ Currencies Worldwide',
    seoDescription: 'Free online currency converter with real-time exchange rates. Convert between 60+ currencies including USD, EUR, GBP, JPY, CNY, INR, AED, SAR, BRL, KRW, and more. Live exchange rates updated automatically every 5 minutes.',
    keywords: ['currency converter', 'exchange rate', 'usd to eur', 'gbp to usd', 'currency calculator', 'forex converter', '60 currencies', 'world currencies', 'real-time exchange rates', 'currency conversion tool']
  },
  { 
    id: 'timezone', 
    name: 'Time Zone Converter', 
    icon: '🌍', 
    category: 'utility', 
    description: 'Convert time between different time zones around the world',
    seoTitle: 'Free Time Zone Converter - Convert Time Between Time Zones | UTC, EST, PST, GMT',
    seoDescription: 'Free online time zone converter. Convert time between UTC, EST, PST, GMT, IST, JST, and 18+ time zones. Perfect for scheduling meetings and travel planning.',
    keywords: ['time zone converter', 'utc converter', 'est to pst', 'time converter', 'world clock']
  },
  { 
    id: 'date', 
    name: 'Date Calculator', 
    icon: '📅', 
    category: 'utility', 
    description: 'Calculate age, date differences, and time durations',
    seoTitle: 'Free Date Calculator - Age Calculator, Date Difference, Add/Subtract Days',
    seoDescription: 'Free online date calculator. Calculate age from birth date, find date differences, add or subtract days from dates. Perfect for planning and age calculations.',
    keywords: ['date calculator', 'age calculator', 'date difference', 'add days to date', 'date tool']
  },
  
  // Technical Converters
  { 
    id: 'number', 
    name: 'Number System Converter', 
    icon: '🔢', 
    category: 'technical', 
    description: 'Convert between binary, decimal, hexadecimal, and octal',
    seoTitle: 'Free Number System Converter - Binary to Decimal, Hex to Decimal, Octal Converter',
    seoDescription: 'Free online number system converter. Convert binary to decimal, hexadecimal to decimal, octal to binary, and more. Perfect for programming and computer science.',
    keywords: ['number system converter', 'binary to decimal', 'hex to decimal', 'octal converter', 'base converter']
  },
  { 
    id: 'text', 
    name: 'Text Converter', 
    icon: '📝', 
    category: 'technical', 
    description: 'Case converter, URL encoder/decoder, Base64, and text transformations',
    seoTitle: 'Free Text Converter - Case Converter, URL Encoder, Base64 Encoder/Decoder',
    seoDescription: 'Free online text converter. Convert text case (uppercase, lowercase, title case), URL encode/decode, Base64 encode/decode, text to binary, and more. Essential web development tools.',
    keywords: ['text converter', 'case converter', 'url encoder', 'base64 encoder', 'text to binary']
  },
  { 
    id: 'color', 
    name: 'Color Converter', 
    icon: '🎨', 
    category: 'technical', 
    description: 'Convert between RGB, HEX, HSL, and other color formats',
    seoTitle: 'Free Color Converter - RGB to HEX, HEX to RGB, HSL Color Converter',
    seoDescription: 'Free online color converter. Convert RGB to HEX, HEX to RGB, HSL to RGB, and more. Live color preview with interactive color picker. Perfect for web design and graphics.',
    keywords: ['color converter', 'rgb to hex', 'hex to rgb', 'hsl converter', 'color picker']
  },
  { 
    id: 'filesize', 
    name: 'File Size Converter', 
    icon: '💾', 
    category: 'technical', 
    description: 'Convert between bytes, KB, MB, GB, TB, and PB',
    seoTitle: 'Free File Size Converter - Bytes to KB, MB to GB, TB Converter',
    seoDescription: 'Free online file size converter. Convert bytes to KB, MB to GB, GB to TB, and more. Accurate file size conversions with examples. Perfect for storage calculations.',
    keywords: ['file size converter', 'bytes to kb', 'mb to gb', 'gb to tb', 'file size calculator']
  },
  
  // Health & Life Calculators
  { 
    id: 'percentage', 
    name: 'Percentage Calculator', 
    icon: '📊', 
    category: 'health', 
    description: 'Calculate percentages, increases, decreases, and discounts',
    seoTitle: 'Free Percentage Calculator - Calculate Percentages, Discounts, Increases',
    seoDescription: 'Free online percentage calculator. Calculate what percentage is X of Y, percentage increase/decrease, discounts, and more. Perfect for math, finance, and shopping.',
    keywords: ['percentage calculator', 'discount calculator', 'percentage increase', 'percentage decrease', 'percent calculator']
  },
  { 
    id: 'bmi', 
    name: 'BMI Calculator', 
    icon: '🏥', 
    category: 'health', 
    description: 'Calculate Body Mass Index and health recommendations',
    seoTitle: 'Free BMI Calculator - Calculate Body Mass Index with Health Categories',
    seoDescription: 'Free online BMI calculator. Calculate your Body Mass Index (BMI) using metric or imperial units. Get health category recommendations and understand your BMI score.',
    keywords: ['bmi calculator', 'body mass index', 'bmi calculator metric', 'bmi calculator imperial', 'health calculator']
  },
];

export default function ConversionTools() {
  const [selectedConverter, setSelectedConverter] = useState<ConverterType>('length');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const selectedConverterInfo = converterOptions.find(c => c.id === selectedConverter);
  
  // Dynamic SEO based on selected converter
  const seoTitle = selectedConverterInfo?.seoTitle || 'Free Conversion Tools - Unit Converters & Calculators | Naqash Thaheem';
  const seoDescription = selectedConverterInfo?.seoDescription || 'Comprehensive collection of free conversion tools: length, weight, volume, temperature, currency, time zone, date calculator, number systems, text converter, color converter, BMI calculator, and more. All tools are free and easy to use.';
  const seoKeywords = selectedConverterInfo?.keywords || ['unit converter', 'conversion tools', 'length converter', 'weight converter', 'currency converter', 'time zone converter', 'BMI calculator', 'percentage calculator', 'temperature converter', 'free tools', 'online calculator'];

  useSEO({
    title: seoTitle,
    description: seoDescription,
    url: `/resources/conversion-tools${selectedConverter !== 'length' ? `?tool=${selectedConverter}` : ''}`,
    keywords: seoKeywords,
    structuredData: 'custom',
    customStructuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': selectedConverterInfo?.name || 'Conversion Tools',
      'description': seoDescription,
      'url': `https://naqashthaheem.com/resources/conversion-tools`,
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web Browser',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'featureList': converterOptions.map(c => c.name),
      'screenshot': 'https://naqashthaheem.com/images/conversion-tools-screenshot.jpg'
    }
  });

  useEffect(() => {
    // Add breadcrumb structured data
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://naqashthaheem.com' },
      { name: 'Resources', url: 'https://naqashthaheem.com/resources' },
      { name: 'Conversion Tools', url: 'https://naqashthaheem.com/resources/conversion-tools' },
      ...(selectedConverterInfo ? [{ name: selectedConverterInfo.name, url: `https://naqashthaheem.com/resources/conversion-tools?tool=${selectedConverter}` }] : [])
    ]);
    injectStructuredData(breadcrumbSchema);

    // Add FAQ structured data
    const faqSchema = generateFAQSchema([
      {
        question: 'Are these conversion tools free to use?',
        answer: 'Yes, all conversion tools are completely free to use with no registration required. You can use them as many times as you need without any limitations.'
      },
      {
        question: 'How accurate are the conversions?',
        answer: 'All conversions use standard conversion factors and are accurate to 6 decimal places. Currency conversions use real-time exchange rates from reliable sources.'
      },
      {
        question: 'Can I use these tools on mobile devices?',
        answer: 'Yes, all conversion tools are fully responsive and work perfectly on mobile phones, tablets, and desktop computers.'
      },
      {
        question: 'Do these tools store my data?',
        answer: 'No, all conversions are performed locally in your browser. We do not store, track, or transmit any of your input data.'
      },
      {
        question: 'How many units can I convert at once?',
        answer: 'You can convert one value at a time, but you can perform unlimited conversions. Simply enter a new value to get instant results.'
      }
    ]);
    injectStructuredData(faqSchema);
  }, [selectedConverter, selectedConverterInfo]);

  const filteredConverters = converterOptions.filter(option =>
    option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedConverters = {
    measurement: filteredConverters.filter(c => c.category === 'measurement'),
    utility: filteredConverters.filter(c => c.category === 'utility'),
    technical: filteredConverters.filter(c => c.category === 'technical'),
    health: filteredConverters.filter(c => c.category === 'health'),
  };

  const renderConverter = () => {
    switch (selectedConverter) {
      case 'length': return <LengthConverter />;
      case 'weight': return <WeightConverter />;
      case 'volume': return <VolumeConverter />;
      case 'temperature': return <TemperatureConverter />;
      case 'area': return <AreaConverter />;
      case 'speed': return <SpeedConverter />;
      case 'currency': return <CurrencyConverter />;
      case 'timezone': return <TimeZoneConverter />;
      case 'date': return <DateCalculator />;
      case 'number': return <NumberSystemConverter />;
      case 'text': return <TextConverter />;
      case 'color': return <ColorConverter />;
      case 'filesize': return <FileSizeConverter />;
      case 'percentage': return <PercentageCalculator />;
      case 'bmi': return <BMICalculator />;
      default: return <LengthConverter />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
            {selectedConverterInfo?.name || 'Conversion Tools'} - Free Online Unit Converters & Calculators
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto mb-4 px-4">
            {selectedConverterInfo?.seoDescription || 'Free, easy-to-use conversion tools for everyday life. Convert units, calculate values, and transform data instantly.'}
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 px-4">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Completely Free
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              No Registration
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Instant Results
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Privacy-Focused
            </span>
          </div>
        </div>

        {/* AI-Friendly Content Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">About {selectedConverterInfo?.name || 'Conversion Tools'}</h2>
          <div className="prose prose-sm sm:prose-lg max-w-none text-gray-700">
            <p className="mb-4">
              {selectedConverterInfo?.name || 'Our conversion tools'} provide accurate, instant conversions for {selectedConverterInfo?.category === 'measurement' ? 'measurement units' : selectedConverterInfo?.category === 'utility' ? 'everyday utilities' : selectedConverterInfo?.category === 'technical' ? 'technical applications' : 'health and life calculations'}. 
              Whether you're a student, professional, developer, or just need quick conversions, our tools are designed to be fast, accurate, and easy to use.
            </p>
            <p className="mb-4">
              All conversions are performed instantly in your browser with no data transmission to servers. This ensures your privacy while providing lightning-fast results. 
              Our tools support a wide range of units and formats, making them suitable for various use cases including education, business, development, and personal projects.
            </p>
            <p>
              <strong>Key Features:</strong> Real-time conversions, multiple unit support, swap units functionality, accurate calculations, mobile-responsive design, 
              no registration required, completely free, and privacy-focused with local processing.
            </p>
          </div>
        </div>

        {/* Ad Placement */}
        <div className="max-w-4xl mx-auto mb-8">
          <AdPlacement position="content-top" />
        </div>

        {/* Mobile Sidebar Toggle */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-gray-900">
              {selectedConverterInfo?.name || 'Select Converter'}
            </span>
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Sidebar - Converter Selection */}
          <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block lg:w-80 flex-shrink-0`}>
            {/* Mobile Overlay */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            
            <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 ${sidebarOpen ? 'fixed inset-y-0 left-0 z-50 w-80 overflow-y-auto lg:relative lg:inset-auto' : ''} lg:sticky lg:top-8`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Select Converter</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
                  aria-label="Close sidebar"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search converters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Converter List */}
              <div className="space-y-4 max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-300px)] overflow-y-auto">
                {Object.entries(groupedConverters).map(([category, converters]) => {
                  if (converters.length === 0) return null;
                  
                  return (
                    <div key={category} className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                        {category === 'measurement' && '📏 Measurements'}
                        {category === 'utility' && '🔧 Utilities'}
                        {category === 'technical' && '💻 Technical'}
                        {category === 'health' && '🏥 Health & Life'}
                      </h3>
                      <div className="space-y-2">
                        {converters.map((converter) => (
                          <button
                            key={converter.id}
                            onClick={() => {
                              setSelectedConverter(converter.id);
                              setSidebarOpen(false);
                            }}
                            className={`w-full text-left p-3 sm:p-4 rounded-lg border transition-all duration-200 touch-manipulation ${
                              selectedConverter === converter.id
                                ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{converter.icon}</span>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 text-sm">{converter.name}</h4>
                                <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{converter.description}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
              {/* Converter Header */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                  <span className="text-2xl sm:text-3xl">{selectedConverterInfo?.icon}</span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedConverterInfo?.name}</h2>
                </div>
                <p className="text-sm sm:text-base text-gray-600">{selectedConverterInfo?.description}</p>
              </div>

              {/* Converter Component */}
              <div className="mt-8">
                {renderConverter()}
              </div>
            </div>

            {/* Ad Placement */}
            <div className="max-w-4xl mx-auto mt-8">
              <AdPlacement position="content-bottom" />
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 mt-6 sm:mt-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Are these conversion tools free to use?</h3>
                  <p className="text-gray-600">
                    Yes, all conversion tools are completely free to use with no registration required. You can use them as many times as you need without any limitations or hidden fees.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">How accurate are the conversions?</h3>
                  <p className="text-gray-600">
                    All conversions use standard conversion factors and are accurate to 6 decimal places. Currency conversions use real-time exchange rates from reliable financial data sources, updated automatically.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I use these tools on mobile devices?</h3>
                  <p className="text-gray-600">
                    Yes, all conversion tools are fully responsive and work perfectly on mobile phones, tablets, and desktop computers. The interface adapts to your screen size for optimal usability.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Do these tools store my data?</h3>
                  <p className="text-gray-600">
                    No, all conversions are performed locally in your browser. We do not store, track, or transmit any of your input data. Your privacy is our priority.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">What units are supported?</h3>
                  <p className="text-gray-600">
                    Each converter supports multiple units relevant to its category. For example, the length converter supports meters, feet, inches, kilometers, miles, yards, and more. 
                    Check the dropdown menu in each converter to see all available units.
                  </p>
                </div>
              </div>
            </div>

            {/* Related Tools Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 mt-6 sm:mt-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Related Conversion Tools</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {converterOptions
                  .filter(c => c.id !== selectedConverter && c.category === selectedConverterInfo?.category)
                  .slice(0, 6)
                  .map((converter) => (
                    <button
                      key={converter.id}
                      onClick={() => {
                        setSelectedConverter(converter.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-left p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 touch-manipulation"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{converter.icon}</span>
                        <div>
                          <h4 className="font-medium text-gray-900">{converter.name}</h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{converter.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

