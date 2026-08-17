import React, { useState } from 'react';
import { useReader } from '../../context/ReaderContext';
import { CheckCircle2, Circle, ArrowLeft, X } from 'lucide-react';
import { InstantTooltip } from '../Common/InstantTooltip';

interface ChapterSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const ChapterSidebar: React.FC<ChapterSidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const { currentBook, currentChapter, openChapter, completedChapterIds, toggleChapterCompletion, setActiveView } = useReader();
  const [filterQuery, setFilterQuery] = useState('');

  if (!currentBook) return null;

  const filteredChapters = currentBook.chapters.filter(c =>
    c.title.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <aside className={`reader-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <button
            className="btn-icon"
            onClick={() => setActiveView('bookshelf')}
            title="返回书架"
            style={{ width: '30px', height: '30px' }}
          >
            <ArrowLeft size={16} />
          </button>
          <span className="sidebar-book-title" onClick={() => setActiveView('bookshelf')}>
            {currentBook.title}
          </span>
        </div>
        <button className="btn-icon" onClick={onToggleCollapse} title="收起目录" style={{ width: '30px', height: '30px' }}>
          <X size={16} />
        </button>
      </div>

      {/* Chapter Search */}
      <div className="sidebar-search-box">
        <input
          className="sidebar-search-input"
          placeholder="筛选章节目录..."
          value={filterQuery}
          onChange={e => setFilterQuery(e.target.value)}
        />
      </div>

      {/* Chapters List */}
      <div className="sidebar-chapters-list">
        {filteredChapters.map((ch) => {
          const isActive = currentChapter?.id === ch.id;
          const isCompleted = completedChapterIds.has(ch.id);

          const subtext = isCompleted
            ? '✅ 本节已打卡学完'
            : ch.readTimeMin
            ? `预计阅读约 ${ch.readTimeMin} 分钟 · 点击立即开始`
            : '点击阅读本章节';

          return (
            <InstantTooltip
              key={ch.id}
              text={ch.title}
              subtext={subtext}
              badge={ch.format === 'both' ? 'MD+PDF' : ch.format.toUpperCase()}
              placement="right"
            >
              {({ onMouseEnter, onMouseLeave }) => (
                <div
                  className={`sidebar-chapter-item ${isActive ? 'active' : ''}`}
                  onClick={() => openChapter(ch.id)}
                  onMouseEnter={onMouseEnter}
                  onMouseLeave={onMouseLeave}
                >
                  {/* Checkbox button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleChapterCompletion(ch.id);
                    }}
                    title={isCompleted ? '标记为未学' : '标记为已学完'}
                    style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={16} color="var(--success-text)" />
                    ) : (
                      <Circle size={16} color="var(--text-muted)" />
                    )}
                  </button>

                  <span className="chapter-item-title">
                    {ch.title}
                  </span>

                  {ch.format === 'both' ? (
                    <span className="chapter-format-tag">MD+PDF</span>
                  ) : ch.format === 'pdf' ? (
                    <span className="chapter-format-tag" style={{ color: '#ef4444' }}>PDF</span>
                  ) : (
                    <span className="chapter-format-tag">MD</span>
                  )}
                </div>
              )}
            </InstantTooltip>
          );
        })}
      </div>
    </aside>
  );
};
