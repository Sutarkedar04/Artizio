import React from 'react';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'paintings', label: 'Paintings' },
  { id: 'sketches', label: 'Sketches'},
  { id: 'digital', label: 'Digital Art'},
  { id: 'watercolors', label: 'Watercolors'},
  { id: 'mixed-media', label: 'Mixed Media'}
];

const CategoryFilter = ({ selectedCategory, onSelect, artworkCounts = {} }) => {
  return (
    <div className="flex flex-wrap justify-center gap-3 mb-12 mt-12">
      {CATEGORIES.map(cat => {
        const count = cat.id === 'all' 
          ? Object.values(artworkCounts).reduce((a, b) => a + b, 0)
          : artworkCounts[cat.id] || 0;
        
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`px-6 py-2 rounded-full capitalize transition-all duration-300 flex items-center gap-2 ${
              selectedCategory === cat.id 
                ? 'bg-amber-600 text-white shadow-lg transform scale-105' 
                : 'bg-white text-gray-700 hover:bg-amber-100'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
            {count > 0 && (
              <span className={`text-xs ml-1 px-2 py-0.5 rounded-full ${
                selectedCategory === cat.id 
                  ? 'bg-white text-amber-600' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;