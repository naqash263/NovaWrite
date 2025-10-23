interface Category {
  id: number;
  name: string;
  posts_count?: number;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: number | null;
  onSelect: (categoryId: number | null) => void;
}

export function CategoryFilter({ categories, selectedCategory, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`px-4 py-2 rounded-full font-semibold transition-colors ${
          selectedCategory === null
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        All
      </button>
      {(categories || []).map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          className={`px-4 py-2 rounded-full font-semibold transition-colors ${
            selectedCategory === category.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {category.name}
          {category.posts_count !== undefined && ` (${category.posts_count})`}
        </button>
      ))}
    </div>
  );
}
