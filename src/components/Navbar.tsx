import React from 'react';
import { useReader } from '../context/ReaderContext';
import { BookOpen, History, BarChart3, Search, RefreshCw, Moon, Sun, BookMarked, Globe } from 'lucide-react';
import { ReaderTheme } from '../types';

export const Navbar: React.FC = () => {
  const { activeView, setActiveView, setIsSearchModalOpen, settings, setTheme, rescanBooks, history } = useReader();

  const toggleTheme = () => {
    const themes: ReaderTheme[] = ['light', 'sepia', 'dark', 'forest'];
    const currentIndex = themes.indexOf(settings.theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  const getThemeIcon = () => {
    switch (settings.theme) {
      case 'dark':
        return <Moon size={18} />;
      case 'sepia':
        return <BookMarked size={18} />;
      case 'forest':
        return <Moon size={18} color="#10b981" />;
      default:
        return <Sun size={18} />;
    }
  };

  return (
    <header className="navbar">
      <div className="container-xl navbar-inner">
        {/* Brand */}
        <div className="brand" onClick={() => setActiveView('bookshelf')}>
          <div className="brand-icon">
            <BookOpen size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="brand-title">小册阅读器</span>
              <span className="brand-badge">PRO</span>
            </div>
          </div>
        </div>

        {/* Search trigger button */}
        <button
          className="search-trigger-btn"
          onClick={() => setIsSearchModalOpen(true)}
          title="搜索小册与章节 (快捷键: ⌘+K / Ctrl+K)"
        >
          <Search size={16} />
          <span>搜索小册、章节、内容...</span>
          <span className="search-shortcut">⌘ K</span>
        </button>

        {/* Nav Links */}
        <nav className="nav-links">
          <button
            className={`nav-link ${activeView === 'bookshelf' ? 'active' : ''}`}
            onClick={() => setActiveView('bookshelf')}
          >
            <BookOpen size={17} />
            <span>我的书架</span>
          </button>

          <button
            className={`nav-link ${activeView === 'remote' ? 'active' : ''}`}
            onClick={() => setActiveView('remote')}
          >
            <Globe size={17} />
            <span>云端书库</span>
          </button>

          <button
            className={`nav-link ${activeView === 'history' ? 'active' : ''}`}
            onClick={() => setActiveView('history')}
          >
            <History size={17} />
            <span>学习记录</span>
            {history.length > 0 && (
              <span style={{
                fontSize: '0.72rem',
                padding: '1px 6px',
                borderRadius: '999px',
                backgroundColor: 'var(--bg-surface-subtle)',
                color: 'var(--text-secondary)'
              }}>
                {history.length}
              </span>
            )}
          </button>

          <button
            className={`nav-link ${activeView === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveView('stats')}
          >
            <BarChart3 size={17} />
            <span>学习统计</span>
          </button>
        </nav>

        {/* Actions */}
        <div className="nav-actions">
          <button
            className="btn-icon"
            onClick={toggleTheme}
            title={`当前主题: ${settings.theme} (点击切换)`}
          >
            {getThemeIcon()}
          </button>

          <button
            className="btn-icon"
            onClick={() => rescanBooks()}
            title="刷新与扫描本地书籍目录"
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </div>
    </header>
  );
};
