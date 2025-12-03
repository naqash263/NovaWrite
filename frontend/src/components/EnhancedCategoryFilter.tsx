import { useState } from 'react';

interface Category {
  id: number;
  name: string;
  posts_count?: number;
}

interface EnhancedCategoryFilterProps {
  categories: Category[];
  selectedCategory: number | null;
  onSelect: (categoryId: number | null) => void;
  maxVisible?: number;
}

export default function EnhancedCategoryFilter({
  categories,
  selectedCategory,
  onSelect,
  maxVisible = 6
}: EnhancedCategoryFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter categories based on search
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort by post count (most posts first)
  const sortedCategories = [...filteredCategories].sort((a, b) => {
    const countA = a.posts_count || 0;
    const countB = b.posts_count || 0;
    return countB - countA;
  });

  // Visible categories
  const visibleCategories = isExpanded 
    ? sortedCategories 
    : sortedCategories.slice(0, maxVisible);
  const hasMore = sortedCategories.length > maxVisible;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Categories</h3>
        {selectedCategory && (
          <button
            onClick={() => onSelect(null)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* Search for categories (if many) */}
      {categories.length > maxVisible && (
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-2">
        {/* All Categories Button */}
        <button
          onClick={() => onSelect(null)}
          className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
            selectedCategory === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Categories
          {!selectedCategory && (
            <span className="ml-2 text-xs opacity-75">
              ({categories.reduce((sum, cat) => sum + (cat.posts_count || 0), 0)})
            </span>
          )}
        </button>

        {/* Category Buttons */}
        {visibleCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{category.name}</span>
              {category.posts_count !== undefined && (
                <span className={`text-xs ${
                  selectedCategory === category.id ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  ({category.posts_count})
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Show More/Less Button */}
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2 border-t border-gray-200"
        >
          {isExpanded 
            ? `Show Less (${maxVisible} categories)` 
            : `Show All (${sortedCategories.length} categories)`
          }
        </button>
      )}

      {/* Selected Category Display */}
      {selectedCategory && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Selected:</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {categories.find(c => c.id === selectedCategory)?.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

