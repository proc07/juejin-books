import React, { useState, useEffect, useRef } from 'react';
import { useReader } from '../context/ReaderContext';
import { Search, X, Book, FileText, ArrowRight } from 'lucide-react';
import { api } from '../api';
import { SearchResultItem } from '../types';

export const SearchModal: React.FC = () => {
  const { isSearchModalOpen, setIsSearchModalOpen, openBook } = useReader();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isSearchModalOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.search(query);
        setResults(res);
        setSelectedIndex(0);
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: SearchResultItem) => {
    openBook(item.bookId, item.chapterId);
    setIsSearchModalOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsSearchModalOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  if (!isSearchModalOpen) return null;

  return (
    <div className="modal-backdrop" onClick={() => setIsSearchModalOpen(false)}>
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="search-modal-header">
          <Search size={20} color="var(--text-muted)" />
          <input
            ref={inputRef}
            className="search-modal-input"
            placeholder="搜索小册名称、章节名、SQL/代码/知识点关键词..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button className="btn-icon" onClick={() => setQuery('')} style={{ width: '28px', height: '28px' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="search-results-list">
          {isSearching && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              正在全书库检索中...
            </div>
          )}

          {!isSearching && query.trim() && results.length === 0 && (
            <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>未找到与 "{query}" 相关的章节或内容</p>
              <p style={{ fontSize: '0.82rem', marginTop: '6px' }}>请尝试搜索 MySQL、索引、执行计划、React 等关键词</p>
            </div>
          )}

          {!isSearching && results.map((item, idx) => (
            <div
              key={`${item.bookId}-${item.chapterId}-${idx}`}
              className={`search-result-item ${idx === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent-subtle)',
                  color: 'var(--accent-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  {item.matchType === 'book_title' ? <Book size={16} /> : <FileText size={16} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="search-res-title">{item.chapterTitle}</div>
                  <div className="search-res-book">小册：{item.bookTitle}</div>
                  {item.snippet && <div className="search-snippet">{item.snippet}</div>}
                </div>
              </div>
              <ArrowRight size={16} color="var(--text-muted)" />
            </div>
          ))}

          {!query.trim() && (
            <div style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>💡 快捷搜索提示</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['MySQL 是怎样运行的', 'Explain', 'InnoDB', 'B+ 树', '单表访问', 'React Fiber'].map(tag => (
                  <span
                    key={tag}
                    onClick={() => setQuery(tag)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '999px',
                      backgroundColor: 'var(--bg-surface-subtle)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
