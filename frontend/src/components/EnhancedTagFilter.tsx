import { useState, useMemo } from 'react';

interface Tag {
  id: number;
  name: string;
  color: string;
  posts_count?: number;
}

interface EnhancedTagFilterProps {
  tags: Tag[];
  selectedTags: number[];
  onTagsChange: (tagIds: number[]) => void;
  maxVisible?: number;
}

export default function EnhancedTagFilter({
  tags,
  selectedTags,
  onTagsChange,
  maxVisible = 10
}: EnhancedTagFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  // Filter tags based on search query
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return tags;
    const query = searchQuery.toLowerCase();
    return tags.filter(tag => 
      tag.name.toLowerCase().includes(query)
    );
  }, [tags, searchQuery]);

  // Sort tags by post count (most used first)
  const sortedTags = useMemo(() => {
    return [...filteredTags].sort((a, b) => {
      const countA = a.posts_count || 0;
      const countB = b.posts_count || 0;
      return countB - countA;
    });
  }, [filteredTags]);

  // Visible tags (top N or all if showAll is true)
  const visibleTags = showAll ? sortedTags : sortedTags.slice(0, maxVisible);
  const hasMore = sortedTags.length > maxVisible;

  const toggleTag = (tagId: number) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const clearAll = () => {
    onTagsChange([]);
    setSearchQuery('');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Filter by Tags</h3>
        {selectedTags.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear ({selectedTags.length})
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {/* Tags List */}
      <div className="max-h-64 overflow-y-auto">
        {visibleTags.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">
            No tags found matching "{searchQuery}"
          </div>
        ) : (
          <div className="space-y-2">
            {visibleTags.map((tag) => {
              const isSelected = selectedTags.includes(tag.id);
              return (
                <label
                  key={tag.id}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTag(tag.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span
                      className="text-sm font-medium text-gray-700"
                      style={{ color: isSelected ? undefined : tag.color }}
                    >
                      {tag.name}
                    </span>
                  </div>
                  {tag.posts_count !== undefined && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({tag.posts_count})
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Show More/Less Button */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2 border-t border-gray-200"
        >
          {showAll ? `Show Less (${maxVisible} tags)` : `Show All (${sortedTags.length} tags)`}
        </button>
      )}

      {/* Selected Tags Summary */}
      {selectedTags.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tagId) => {
              const tag = tags.find(t => t.id === tagId);
              if (!tag) return null;
              return (
                <span
                  key={tagId}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                >
                  {tag.name}
                  <button
                    onClick={() => toggleTag(tagId)}
                    className="hover:text-blue-900"
                    aria-label={`Remove ${tag.name} filter`}
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

