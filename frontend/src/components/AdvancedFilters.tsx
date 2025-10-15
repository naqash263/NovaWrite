
interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  name: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'text';
  options?: FilterOption[];
  placeholder?: string;
}

interface AdvancedFiltersProps {
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  filterConfigs: FilterConfig[];
  onClearAll: () => void;
  onApply: () => void;
  isOpen: boolean;
  onToggle: () => void;
  resultsCount: number;
}

export default function AdvancedFilters({
  filters,
  onFiltersChange,
  filterConfigs,
  onClearAll,
  onApply,
  isOpen,
  onToggle,
  resultsCount
}: AdvancedFiltersProps) {
  const activeFiltersCount = Object.values(filters).filter(f => 
    f !== '' && f !== null && f !== undefined && 
    (Array.isArray(f) ? f.length > 0 : true)
  ).length;

  const handleFilterChange = (filterName: string, value: any) => {
    onFiltersChange({
      ...filters,
      [filterName]: value
    });
  };

  const renderFilterInput = (config: FilterConfig) => {
    const value = filters[config.name] || '';

    switch (config.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFilterChange(config.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">All {config.label}</option>
            {config.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {config.options?.map(option => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter(v => v !== option.value);
                    handleFilterChange(config.name, newValues);
                  }}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFilterChange(config.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        );

      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFilterChange(config.name, e.target.value)}
            placeholder={config.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <button
          onClick={onToggle}
          className={`px-3 py-2 rounded-lg border transition-colors ${
            isOpen 
              ? 'bg-blue-600 text-white border-blue-600' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
          </svg>
          Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </button>
      </div>

      {/* Advanced Filters */}
      {isOpen && (
        <div className="border-t pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterConfigs.map(config => (
              <div key={config.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {config.label}
                </label>
                {renderFilterInput(config)}
              </div>
            ))}
          </div>

          {/* Filter Actions */}
          <div className="flex justify-between items-center pt-2 border-t">
            <div className="text-sm text-gray-600">
              {activeFiltersCount > 0 && (
                <span>
                  {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
                </span>
              )}
              {resultsCount > 0 && (
                <span className="ml-2">
                  • {resultsCount} result{resultsCount !== 1 ? 's' : ''} found
                </span>
              )}
            </div>
            <div className="space-x-2">
              <button
                onClick={onClearAll}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
              >
                Clear All
              </button>
              <button
                onClick={onApply}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-medium text-gray-600">Active Filters:</span>
            {Object.entries(filters).map(([key, value]) => {
              if (!value || value === '' || (Array.isArray(value) && value.length === 0)) return null;
              
              const config = filterConfigs.find(c => c.name === key);
              const displayValue = Array.isArray(value) ? value.join(', ') : value;
              
              return (
                <span
                  key={key}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                >
                  {config?.label || key}: {displayValue}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
