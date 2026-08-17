import React from 'react';
import { useReader } from '../../context/ReaderContext';
import { History, Trash2, ArrowRight, BookOpen, Calendar } from 'lucide-react';

export const HistoryView: React.FC = () => {
  const { history, openBook, deleteHistoryItem, clearAllHistory, setActiveView } = useReader();

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / (1000 * 60));
      const diffHr = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMin < 1) return '刚刚';
      if (diffMin < 60) return `${diffMin} 分钟前`;
      if (diffHr < 24) return `${diffHr} 小时前`;
      if (diffDays === 1) return '昨天 ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (diffDays < 7) return `${diffDays} 天前`;
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="history-container">
      {/* Header */}
      <div className="history-header">
        <div className="history-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1>学习与阅读历史</h1>
            {history.length > 0 && (
              <span className="brand-badge">{history.length} 条记录</span>
            )}
          </div>
          <p>记录您的技术进阶足迹，随时一键续读上次离开位置</p>
        </div>

        {history.length > 0 && (
          <button
            className="btn-secondary"
            onClick={() => {
              if (window.confirm('确定要清空全部学习记录吗？')) {
                clearAllHistory();
              }
            }}
            style={{ color: '#ef4444', fontSize: '0.85rem' }}
          >
            <Trash2 size={15} />
            <span>清空记录</span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {history.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)'
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
            <History size={30} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            暂无观看学习记录
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 20px' }}>
            打开小册开始沉浸阅读，您的每一次翻阅和学习进度都将自动精准沉淀在此。
          </p>
          <button className="btn-primary" onClick={() => setActiveView('bookshelf')}>
            <BookOpen size={16} />
            <span>去书架选书</span>
          </button>
        </div>
      )}

      {/* History Timeline */}
      {history.length > 0 && (
        <div className="timeline">
          {history.map(item => (
            <div key={item.id} className="timeline-item">
              <div className="timeline-dot" />
              <div className="history-card">
                <div className="history-card-main">
                  <div className="history-book-title">{item.bookTitle}</div>
                  <div className="history-chapter-title">{item.chapterTitle}</div>
                  <div className="history-meta">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} /> {formatDate(item.timestamp)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="chapter-format-tag">{item.format}</span>
                    </span>
                  </div>
                </div>

                <div className="history-card-actions">
                  <button
                    className="btn-primary"
                    onClick={() => openBook(item.bookId, item.chapterId)}
                    style={{ padding: '7px 14px', fontSize: '0.84rem' }}
                  >
                    <span>继续学习</span>
                    <ArrowRight size={14} />
                  </button>

                  <button
                    className="btn-icon"
                    onClick={() => deleteHistoryItem(item.id)}
                    title="删除此记录"
                    style={{ width: '32px', height: '32px' }}
                  >
                    <Trash2 size={15} color="var(--text-muted)" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
