import React from 'react';
import { Book } from '../../types';
import { useReader } from '../../context/ReaderContext';
import { FileText, CheckCircle2, ChevronRight, Clock } from 'lucide-react';

interface BookCardProps {
  book: Book;
  viewMode: 'grid' | 'list';
}

export const BookCard: React.FC<BookCardProps> = ({ book, viewMode }) => {
  const { openBook } = useReader();

  const progress = book.progress;
  const progressPercent = progress?.progressPercent || 0;
  const isStarted = !!progress?.lastChapterId || progressPercent > 0;
  const isCompleted = progressPercent === 100 && book.chapterCount > 0;

  const handleCardClick = () => {
    openBook(book.id, progress?.lastChapterId);
  };

  const getInitials = (title: string) => {
    if (title.toLowerCase().includes('mysql')) return 'MySQL';
    if (title.toLowerCase().includes('react')) return 'React';
    if (title.toLowerCase().includes('redis')) return 'Redis';
    return title.substring(0, 2);
  };

  if (viewMode === 'list') {
    return (
      <div className="book-card" onClick={handleCardClick} style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
            <div className="book-cover" style={{ background: book.coverColor, width: '46px', height: '58px', fontSize: '1rem' }}>
              {getInitials(book.title)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="book-category">{book.category || '技术小册'}</span>
                {isCompleted && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', color: 'var(--success-text)', fontWeight: 600 }}>
                    <CheckCircle2 size={13} /> 已读完
                  </span>
                )}
              </div>
              <h3 className="book-title" style={{ fontSize: '1rem' }}>{book.title}</h3>
              <div className="book-meta">
                <span className="book-meta-item"><FileText size={14} /> {book.chapterCount} 章节</span>
                {progress?.lastChapterTitle && (
                  <span className="book-meta-item"><Clock size={14} /> 上次读至: {progress.lastChapterTitle}</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
            <div style={{ width: '120px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>进度</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-text)' }}>{progressPercent}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            <button className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.84rem' }}>
              {isStarted ? '继续阅读' : '开始阅读'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="book-card" onClick={handleCardClick}>
      <div className="book-card-header">
        <div className="book-cover" style={{ background: book.coverColor }}>
          {getInitials(book.title)}
        </div>
        <div className="book-info">
          <span className="book-category">{book.category || '技术小册'}</span>
          <h3 className="book-title">{book.title}</h3>
          <div className="book-meta">
            <span className="book-meta-item">
              <FileText size={13} /> {book.chapterCount} 章节
            </span>
            {book.pdfCount > 0 && (
              <span className="book-meta-item" style={{ color: '#ef4444' }}>
                PDF 支持
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="book-progress-box">
        <div className="progress-header">
          <span className="progress-label">
            {isCompleted ? '🎉 已全部完成' : isStarted ? `已学 ${progress?.completedCount || 0}/${book.chapterCount} 节` : '尚未开始阅读'}
          </span>
          <span className="progress-pct">{progressPercent}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="book-card-footer">
        <div className="last-read-chapter" title={progress?.lastChapterTitle ? `上次读至：${progress.lastChapterTitle}` : ''}>
          {progress?.lastChapterTitle ? `上次读至：${progress.lastChapterTitle}` : '点击随时开启沉浸学习'}
        </div>
        <div className="read-btn">
          <span>{isStarted ? '继续' : '开始'}</span>
          <ChevronRight size={16} />
        </div>
      </div>
    </div>
  );
};
