import React, { useState } from 'react';
import { API_CONFIG } from '../../config/api';

interface Template {
  id: number;
  name: string;
  description: string;
  category: string;
  ats_score: number;
  thumbnail: string;
  html_content: string;
  json_config: any;
  customizable_options: any;
  field_mappings: any;
}

interface EnhancedTemplateSelectorProps {
  templates: Template[];
  templatesLoading: boolean;
  selectedTemplate: Template | null;
  onTemplateSelect: (template: Template) => void;
  onStyleChange: (style: any) => void;
  currentStyle: any;
}

export const EnhancedTemplateSelector: React.FC<EnhancedTemplateSelectorProps> = ({
  templates,
  templatesLoading,
  selectedTemplate,
  onTemplateSelect,
  onStyleChange
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'ats_score' | 'category'>('ats_score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];

  // Filter and sort templates
  const filteredTemplates = templates
    .filter(template => {
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'ats_score':
          comparison = a.ats_score - b.ats_score;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleTemplateSelect = (template: Template) => {
    onTemplateSelect(template);
    
    // Apply template's default styling
    const defaultStyle = {
      templateName: template.id.toString(),
      primaryColor: template.customizable_options?.primaryColor || '#2563eb',
      secondaryColor: template.customizable_options?.secondaryColor || '#64748b',
      fontFamily: template.customizable_options?.fontFamily || 'Arial, sans-serif',
      fontSize: template.customizable_options?.fontSize || 11,
    };
    
    onStyleChange(defaultStyle);
  };

  const getATSScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getATSScoreLabel = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    return 'Fair';
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
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your CV Template</h2>
        <p className="text-lg text-gray-600">Select from our collection of professional, ATS-friendly templates</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ats_score">ATS Score</option>
              <option value="name">Name</option>
              <option value="category">Category</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${
              selectedTemplate?.id === template.id
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleTemplateSelect(template)}
          >
            {/* Template Preview */}
            <div className="aspect-[3/4] bg-gray-50 rounded-t-xl overflow-hidden relative">
              {template.thumbnail ? (
                <img
                  src={API_CONFIG.getStorageUrl(template.thumbnail)}
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
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getATSScoreColor(template.ats_score)}`}>
                  ATS {template.ats_score}/10
                </span>
              </div>

              {/* Selected Badge */}
              {selectedTemplate?.id === template.id && (
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white">
                    Selected
                  </span>
                </div>
              )}
            </div>

            {/* Template Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 text-lg">{template.name}</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {template.category}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {template.description}
              </p>

              {/* ATS Score Details */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">ATS Score:</span>
                  <span className={`text-sm font-semibold ${getATSScoreColor(template.ats_score)}`}>
                    {getATSScoreLabel(template.ats_score)}
                  </span>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTemplateSelect(template);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {selectedTemplate?.id === template.id ? 'Selected' : 'Select'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or category filter.</p>
        </div>
      )}

      {/* Template Stats */}
      <div className="mt-8 bg-gray-50 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{templates.length}</div>
            <div className="text-sm text-gray-600">Total Templates</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {templates.filter(t => t.ats_score >= 8).length}
            </div>
            <div className="text-sm text-gray-600">ATS Optimized</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{categories.length - 1}</div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTemplateSelector;

