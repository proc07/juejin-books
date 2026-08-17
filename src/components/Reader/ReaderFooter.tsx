import React from 'react';
import { useReader } from '../../context/ReaderContext';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react';

export const ReaderFooter: React.FC = () => {
  const { currentBook, currentChapter, chapterIndex, prevChapter, nextChapter, completedChapterIds, toggleChapterCompletion } = useReader();

  if (!currentBook || !currentChapter) return null;

  const isFirst = chapterIndex <= 0;
  const isLast = chapterIndex >= currentBook.chapters.length - 1;
  const isCompleted = completedChapterIds.has(currentChapter.id);

  return (
    <div className="reader-footer-nav">
      <button
        className="chapter-nav-btn"
        onClick={prevChapter}
        disabled={isFirst}
        title={isFirst ? '已经是第一节' : '上一节 (快捷键: ⌘ + ←)'}
      >
        <ChevronLeft size={16} />
        <span>上一节</span>
      </button>

      {/* Mark Completed Button */}
      <button
        className="btn-secondary"
        onClick={() => toggleChapterCompletion(currentChapter.id)}
        style={{
          color: isCompleted ? 'var(--success-text)' : 'var(--text-primary)',
          borderColor: isCompleted ? 'var(--success-border)' : 'var(--border-subtle)',
          backgroundColor: isCompleted ? 'var(--success-bg)' : 'var(--bg-surface)',
          padding: '8px 16px',
          borderRadius: '999px',
          fontWeight: 600,
        }}
      >
        {isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
        <span>{isCompleted ? '本节已学完' : '标记为已学完'}</span>
      </button>

      <button
        className="chapter-nav-btn"
        onClick={nextChapter}
        disabled={isLast}
        title={isLast ? '已经是最后一节' : '下一节 (快捷键: ⌘ + →)'}
      >
        <span>下一节</span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
};
