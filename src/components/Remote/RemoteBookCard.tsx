import React from 'react';
import { RemoteBook, DownloadTask } from '../../types';
import { useReader } from '../../context/ReaderContext';
import { Download, CheckCircle2, BookOpen, Trash2, Loader2, AlertCircle } from 'lucide-react';

interface RemoteBookCardProps {
  book: RemoteBook;
  task?: DownloadTask;
  onRequestDownload: (book: RemoteBook) => void;
}

export const RemoteBookCard: React.FC<RemoteBookCardProps> = ({ book, task, onRequestDownload }) => {
  const { books, openBook, deleteDownloadedBook, setActiveView } = useReader();

  const isDownloading = task?.status === 'downloading' || task?.status === 'pending';
  const isFailed = task?.status === 'failed';

  // Check if book is already in local books list
  const localBook = books.find(b => b.folderName === book.name || b.title === book.name);
  const isDownloaded = book.isDownloaded || !!localBook;

  const handleRead = () => {
    if (localBook) {
      openBook(localBook.id);
    } else {
      setActiveView('bookshelf');
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`确定要从本地删除《${book.name}》吗？后续可随时重新下载。`)) {
      deleteDownloadedBook(book.name);
    }
  };

  const getInitials = (name: string) => {
    if (name.toLowerCase().includes('mysql')) return 'MySQL';
    if (name.toLowerCase().includes('react')) return 'React';
    if (name.toLowerCase().includes('vue')) return 'Vue';
    if (name.toLowerCase().includes('node')) return 'Node';
    if (name.toLowerCase().includes('ai')) return 'AI';
    if (name.toLowerCase().includes('redis')) return 'Redis';
    if (name.toLowerCase().includes('electron')) return 'Electron';
    return name.substring(0, 2);
  };

  return (
    <div className="book-card" style={{ cursor: isDownloaded ? 'pointer' : 'default' }} onClick={isDownloaded ? handleRead : undefined}>
      <div className="book-card-header">
        <div className="book-cover" style={{ background: book.coverColor }}>
          {getInitials(book.name)}
        </div>
        <div className="book-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span className="book-category">{book.category}</span>
            {isDownloaded && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', color: 'var(--success-text)', fontWeight: 600 }}>
                <CheckCircle2 size={13} /> 已就绪
              </span>
            )}
          </div>
          <h3 className="book-title" title={book.name}>{book.name}</h3>
        </div>
      </div>

      {/* Downloading Progress Bar */}
      {isDownloading && (
        <div style={{ margin: '12px 0 6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', marginBottom: '4px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-text)', fontWeight: 600 }}>
              <Loader2 size={13} className="spin" /> 正在下载章节...
            </span>
            <span style={{ fontWeight: 700, color: 'var(--accent-text)' }}>{task.progress}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${task.progress}%` }} />
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {task.currentFile}
          </div>
        </div>
      )}

      {/* Failed state */}
      {isFailed && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '0.78rem', margin: '8px 0' }}>
          <AlertCircle size={14} />
          <span>{task.error || '下载失败，请点击重试'}</span>
        </div>
      )}

      {/* Footer / Actions */}
      <div className="book-card-footer" style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
        {isDownloaded ? (
          <>
            <button
              className="btn-primary"
              onClick={handleRead}
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            >
              <BookOpen size={14} />
              <span>立即阅读</span>
            </button>

            <button
              className="btn-icon"
              onClick={handleDelete}
              title="删除本地文件以节省空间"
              style={{ width: '28px', height: '28px' }}
            >
              <Trash2 size={14} color="var(--text-muted)" />
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              云端资源 · 按需下载
            </div>
            <button
              className="btn-secondary"
              onClick={() => onRequestDownload(book)}
              disabled={isDownloading}
              style={{ padding: '6px 14px', fontSize: '0.82rem', borderColor: 'var(--accent-primary)', color: 'var(--accent-text)' }}
            >
              <Download size={14} />
              <span>{isDownloading ? '下载中' : '下载到本地'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
