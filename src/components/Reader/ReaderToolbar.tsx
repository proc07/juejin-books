import React, { useState, useRef, useEffect } from 'react';
import { useReader } from '../../context/ReaderContext';
import { SlidersHorizontal, MessageSquarePlus } from 'lucide-react';
import { ReaderTheme, ReaderWidth } from '../../types';

interface ReaderToolbarProps {
  onToggleNotes: () => void;
  hasNotes: boolean;
  activeFormat: 'md' | 'pdf';
  onFormatChange: (format: 'md' | 'pdf') => void;
}

export const ReaderToolbar: React.FC<ReaderToolbarProps> = ({
  onToggleNotes,
  hasNotes,
  activeFormat,
  onFormatChange,
}) => {
  const { currentChapter, settings, updateSettings, setTheme } = useReader();
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSettingsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themes: Array<{ key: ReaderTheme; label: string; bg: string }> = [
    { key: 'light', label: '晨曦白', bg: '#ffffff' },
    { key: 'sepia', label: '羊皮纸', bg: '#f6f1e8' },
    { key: 'dark', label: '暗夜黑', bg: '#1e293b' },
    { key: 'forest', label: '极客绿', bg: '#162d23' },
  ];

  const widths: Array<{ key: ReaderWidth; label: string }> = [
    { key: 'narrow', label: '舒适 (680px)' },
    { key: 'normal', label: '标准 (820px)' },
    { key: 'wide', label: '宽屏 (1000px)' },
    { key: 'full', label: '全宽 (1300px)' },
  ];

  return (
    <div className="topbar-right" style={{ position: 'relative' }}>
      {/* Format switch if both formats are available */}
      {currentChapter?.format === 'both' && (
        <div className="view-toggle-group">
          <button
            className={`view-toggle-btn ${activeFormat === 'md' ? 'active' : ''}`}
            onClick={() => onFormatChange('md')}
            style={{ fontSize: '0.78rem', fontWeight: 600, padding: '3px 8px' }}
          >
            MD
          </button>
          <button
            className={`view-toggle-btn ${activeFormat === 'pdf' ? 'active' : ''}`}
            onClick={() => onFormatChange('pdf')}
            style={{ fontSize: '0.78rem', fontWeight: 600, padding: '3px 8px' }}
          >
            PDF
          </button>
        </div>
      )}

      {/* Notes Drawer Button */}
      <button
        className="btn-icon"
        onClick={onToggleNotes}
        title="随堂笔记与知识卡片"
        style={{ position: 'relative' }}
      >
        <MessageSquarePlus size={17} />
        {hasNotes && (
          <span style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-primary)',
          }} />
        )}
      </button>

      {/* Reading Preferences Button */}
      <button
        className="btn-icon"
        onClick={() => setShowSettingsDropdown(prev => !prev)}
        title="排版与主题设置"
      >
        <SlidersHorizontal size={17} />
      </button>

      {/* Settings Dropdown Popover */}
      {showSettingsDropdown && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: '46px',
            right: '0',
            width: '280px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            padding: '18px',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Themes */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              阅读背景主题
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {themes.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTheme(t.key)}
                  style={{
                    backgroundColor: t.bg,
                    border: settings.theme === t.key ? '2px solid var(--accent-primary)' : '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: t.key === 'dark' || t.key === 'forest' ? '#ffffff' : '#333333',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>字号大小</span>
              <span style={{ color: 'var(--accent-text)' }}>{settings.fontSize}px</span>
            </div>
            <input
              type="range"
              min="14"
              max="24"
              step="1"
              value={settings.fontSize}
              onChange={e => updateSettings({ fontSize: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
            />
          </div>

          {/* Font Family */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              字体系列
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {[
                { key: 'sans', label: '无衬线' },
                { key: 'serif', label: '衬线体' },
                { key: 'mono', label: '等宽代码' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => updateSettings({ fontFamily: f.key as any })}
                  className={`pill-btn ${settings.fontFamily === f.key ? 'active' : ''}`}
                  style={{ fontSize: '0.78rem', padding: '5px 0', textAlign: 'center' }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reading Width */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              正文版心宽度
            </div>
            <select
              className="sort-select"
              style={{ width: '100%' }}
              value={settings.contentWidth}
              onChange={e => updateSettings({ contentWidth: e.target.value as any })}
            >
              {widths.map(w => (
                <option key={w.key} value={w.key}>{w.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
