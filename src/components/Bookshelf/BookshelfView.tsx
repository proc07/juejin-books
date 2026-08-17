import React, { useState, useMemo } from 'react';
import { useReader } from '../../context/ReaderContext';
import { ContinueHero } from './ContinueHero';
import { FilterBar } from './FilterBar';
import { BookCard } from './BookCard';
import { BookOpen, FolderPlus } from 'lucide-react';

export const BookshelfView: React.FC = () => {
  const { books, isLoadingBooks, rescanBooks } = useReader();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'reading' | 'completed' | 'unread'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'progress' | 'title' | 'chapters'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Extract all categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    books.forEach(b => {
      if (b.category) cats.add(b.category);
    });
    return Array.from(cats);
  }, [books]);

  // Filter & Sort
  const filteredBooks = useMemo(() => {
    return books
      .filter(book => {
        // Category
        if (selectedCategory !== 'all' && book.category !== selectedCategory) {
          return false;
        }

        // Status
        const progress = book.progress;
        const pct = progress?.progressPercent || 0;
        if (statusFilter === 'reading' && (pct === 0 || pct === 100)) {
          return false;
        }
        if (statusFilter === 'completed' && pct < 100) {
          return false;
        }
        if (statusFilter === 'unread' && pct > 0) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'recent') {
          const timeA = a.progress?.lastReadAt ? new Date(a.progress.lastReadAt).getTime() : 0;
          const timeB = b.progress?.lastReadAt ? new Date(b.progress.lastReadAt).getTime() : 0;
          return timeB - timeA;
        }
        if (sortBy === 'progress') {
          return (b.progress?.progressPercent || 0) - (a.progress?.progressPercent || 0);
        }
        if (sortBy === 'chapters') {
          return b.chapterCount - a.chapterCount;
        }
        return a.title.localeCompare(b.title, 'zh-Hans-CN');
      });
  }, [books, selectedCategory, statusFilter, sortBy]);

  return (
    <div className="container-xl" style={{ paddingBottom: '60px' }}>
      {/* Hero Banner */}
      <ContinueHero />

      {/* Filter and View Controls */}
      <FilterBar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Loading state */}
      {isLoadingBooks && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '1rem', fontWeight: 600 }}>正在扫描并加载小册资源...</div>
        </div>
      )}

      {/* Empty State */}
      {!isLoadingBooks && filteredBooks.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          margin: '20px 0'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-surface-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--text-muted)'
          }}>
            <BookOpen size={30} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            没有找到匹配的小册
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 20px' }}>
            您可以将任意技术小册 Markdown / PDF 文件夹放入 <code>books/</code> 目录，系统将自动热更新识别。
          </p>
          <button className="btn-primary" onClick={() => rescanBooks()}>
            <FolderPlus size={16} />
            <span>重新扫描本地目录</span>
          </button>
        </div>
      )}

      {/* Books List / Grid */}
      {!isLoadingBooks && filteredBooks.length > 0 && (
        <div className={viewMode === 'grid' ? 'books-grid' : 'books-list'}>
          {filteredBooks.map(book => (
            <BookCard key={book.id} book={book} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
};
