import React, { useState, useEffect, useRef } from 'react';
import { useReader } from '../../context/ReaderContext';
import { ChapterSidebar } from './ChapterSidebar';
import { ReaderToolbar } from './ReaderToolbar';
import { MarkdownReader } from './MarkdownReader';
import { PdfReader } from './PdfReader';
import { TableOfContents } from './TableOfContents';
import { ReaderFooter } from './ReaderFooter';
import { NotesDrawer } from './NotesDrawer';
import { InstantTooltip } from '../Common/InstantTooltip';
import { api } from '../../api';
import { Menu, ChevronRight, BookOpen, ListFilter } from 'lucide-react';

export const ReaderView: React.FC = () => {
  const { currentBook, currentChapter, nextChapter, prevChapter, updateScrollProgress, notes, setActiveView } = useReader();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showToc, setShowToc] = useState(true);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [activeFormat, setActiveFormat] = useState<'md' | 'pdf'>('md');

  const [markdownContent, setMarkdownContent] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [scrollPercentage, setScrollPercentage] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load chapter content when currentBook / currentChapter changes
  useEffect(() => {
    if (!currentBook || !currentChapter) return;

    let isMounted = true;
    setIsLoadingContent(true);

    api.getChapterContent(currentBook.id, currentChapter.id)
      .then(res => {
        if (!isMounted) return;
        setMarkdownContent(res.markdownContent || '');
        setPdfUrl(res.pdfUrl || null);

        // If chapter is only PDF, switch to PDF format
        if (currentChapter.format === 'pdf') {
          setActiveFormat('pdf');
        } else {
          setActiveFormat('md');
        }
      })
      .catch(e => {
        console.error('Failed to load chapter content:', e);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingContent(false);
          // Reset scroll to top
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentBook, currentChapter]);

  // Track scroll percentage
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const totalHeight = el.scrollHeight - el.clientHeight;
    if (totalHeight <= 0) {
      setScrollPercentage(100);
      return;
    }
    const currentPct = Math.round((el.scrollTop / totalHeight) * 100);
    setScrollPercentage(currentPct);
  };

  // Debounce save scroll percentage to backend
  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollPercentage > 0) {
        updateScrollProgress(scrollPercentage);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [scrollPercentage, updateScrollProgress]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowRight') {
        e.preventDefault();
        nextChapter();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowLeft') {
        e.preventDefault();
        prevChapter();
      } else if (e.key === 'Escape') {
        setShowNotesDrawer(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextChapter, prevChapter]);

  if (!currentBook || !currentChapter) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
        <h3>请先选择一本小册</h3>
        <button className="btn-primary" onClick={() => setActiveView('bookshelf')} style={{ marginTop: '16px' }}>
          返回书架
        </button>
      </div>
    );
  }

  const currentBookNotes = notes.filter(n => n.bookId === currentBook.id);
  const headings = currentChapter.headings || [];

  return (
    <div className="reader-container">
      {/* Chapter Sidebar */}
      <ChapterSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
      />

      {/* Main Reader View */}
      <div className="reader-main">
        {/* Top bar */}
        <header className="reader-topbar">
          <div className="topbar-left">
            <button
              className="btn-icon"
              onClick={() => setSidebarCollapsed(prev => !prev)}
              title={sidebarCollapsed ? '展开章节目录' : '收起章节目录'}
            >
              <Menu size={18} />
            </button>

            <div className="breadcrumb-book" onClick={() => setActiveView('bookshelf')}>
              <BookOpen size={14} />
              <span>{currentBook.title}</span>
            </div>

            <ChevronRight size={14} color="var(--text-muted)" />

            <InstantTooltip text={currentChapter.title} subtext="当前阅读章节" placement="bottom">
              {({ onMouseEnter, onMouseLeave }) => (
                <div
                  className="breadcrumb-chapter"
                  onMouseEnter={onMouseEnter}
                  onMouseLeave={onMouseLeave}
                >
                  {currentChapter.title}
                </div>
              )}
            </InstantTooltip>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {headings.length > 0 && activeFormat === 'md' && (
              <button
                className={`btn-icon ${showToc ? 'active' : ''}`}
                onClick={() => setShowToc(prev => !prev)}
                title="切换本章大纲目录"
              >
                <ListFilter size={17} />
              </button>
            )}

            <ReaderToolbar
              onToggleNotes={() => setShowNotesDrawer(prev => !prev)}
              hasNotes={currentBookNotes.length > 0}
              activeFormat={activeFormat}
              onFormatChange={setActiveFormat}
            />
          </div>
        </header>

        {/* Real-time reading progress bar */}
        <div className="reader-reading-progress-bar">
          <div className="reading-progress-indicator" style={{ width: `${scrollPercentage}%` }} />
        </div>

        {/* Scrollable Reader Content Body */}
        <div
          ref={scrollContainerRef}
          className="reader-scroll-container"
          onScroll={handleScroll}
        >
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="reader-article-wrapper width-normal" style={{ flex: 1 }}>
              {isLoadingContent ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>正在加载章节内容...</div>
                </div>
              ) : activeFormat === 'pdf' && pdfUrl ? (
                <PdfReader pdfUrl={pdfUrl} chapterTitle={currentChapter.title} />
              ) : (
                <MarkdownReader content={markdownContent} />
              )}

              {/* Reader Navigation Footer */}
              <ReaderFooter />
            </div>

            {/* Floating Table of Contents */}
            {showToc && activeFormat === 'md' && headings.length > 0 && (
              <TableOfContents headings={headings} scrollContainerRef={scrollContainerRef} />
            )}
          </div>
        </div>
      </div>

      {/* Notes Drawer */}
      <NotesDrawer
        isOpen={showNotesDrawer}
        onClose={() => setShowNotesDrawer(false)}
      />
    </div>
  );
};
