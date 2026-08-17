import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

interface FilterBarProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  statusFilter: 'all' | 'reading' | 'completed' | 'unread';
  onStatusFilterChange: (status: 'all' | 'reading' | 'completed' | 'unread') => void;
  sortBy: 'recent' | 'progress' | 'title' | 'chapters';
  onSortByChange: (sort: 'recent' | 'progress' | 'title' | 'chapters') => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className="filter-container">
      {/* Category & Status Pills */}
      <div className="filter-pills">
        <button
          className={`pill-btn ${selectedCategory === 'all' && statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => {
            onSelectCategory('all');
            onStatusFilterChange('all');
          }}
        >
          全部小册
        </button>

        <button
          className={`pill-btn ${statusFilter === 'reading' ? 'active' : ''}`}
          onClick={() => {
            onSelectCategory('all');
            onStatusFilterChange('reading');
          }}
        >
          正在阅读
        </button>

        <button
          className={`pill-btn ${statusFilter === 'completed' ? 'active' : ''}`}
          onClick={() => {
            onSelectCategory('all');
            onStatusFilterChange('completed');
          }}
        >
          已学完
        </button>

        {categories.map(cat => (
          <button
            key={cat}
            className={`pill-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => {
              onStatusFilterChange('all');
              onSelectCategory(cat);
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Right Controls (Sort & View Mode) */}
      <div className="filter-right">
        <select
          className="sort-select"
          value={sortBy}
          onChange={e => onSortByChange(e.target.value as any)}
        >
          <option value="recent">最近阅读优先</option>
          <option value="progress">学习进度最高</option>
          <option value="chapters">章节数量最多</option>
          <option value="title">小册名称 (A-Z)</option>
        </select>

        <div className="view-toggle-group">
          <button
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => onViewModeChange('grid')}
            title="网格视图"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => onViewModeChange('list')}
            title="列表视图"
          >
            <List size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
