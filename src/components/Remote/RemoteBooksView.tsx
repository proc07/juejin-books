import React, { useState, useEffect, useMemo } from 'react';
import { useReader } from '../../context/ReaderContext';
import { RemoteBookCard } from './RemoteBookCard';
import { DownloadModal } from './DownloadModal';
import { RemoteBook } from '../../types';
import { Cloud, Search, RefreshCw, Settings, Globe } from 'lucide-react';

export const RemoteBooksView: React.FC = () => {
  const {
    remoteBooks,
    isLoadingRemoteBooks,
    fetchRemoteBooks,
    downloadTasks,
    startBookDownload,
    repoConfig,
    updateRepoConfig,
    books,
  } = useReader();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'downloaded' | 'not_downloaded'>('all');
  const [targetDownloadBook, setTargetDownloadBook] = useState<RemoteBook | null>(null);
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);

  // Config edit state
  const [editRepoUrl, setEditRepoUrl] = useState(repoConfig?.repoUrl || '');
  const [editToken, setEditToken] = useState(repoConfig?.token || '');
  const [editUseMirror, setEditUseMirror] = useState(repoConfig?.useMirror ?? true);

  useEffect(() => {
    if (repoConfig) {
      setEditRepoUrl(repoConfig.repoUrl);
      setEditToken(repoConfig.token || '');
      setEditUseMirror(repoConfig.useMirror ?? true);
    }
  }, [repoConfig]);

  // Load remote books on first mount if empty
  useEffect(() => {
    if (remoteBooks.length === 0) {
      fetchRemoteBooks(false);
    }
  }, [fetchRemoteBooks, remoteBooks.length]);

  // Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    remoteBooks.forEach(b => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set);
  }, [remoteBooks]);

  // Filtered remote books
  const filteredBooks = useMemo(() => {
    const downloadedNames = new Set(books.map(b => b.folderName));

    return remoteBooks.filter(book => {
      const isDownloaded = book.isDownloaded || downloadedNames.has(book.name);

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!book.name.toLowerCase().includes(q) && !book.category.toLowerCase().includes(q)) {
          return false;
        }
      }

      // Category match
      if (selectedCategory !== 'all' && book.category !== selectedCategory) {
        return false;
      }

      // Status match
      if (statusFilter === 'downloaded' && !isDownloaded) return false;
      if (statusFilter === 'not_downloaded' && isDownloaded) return false;

      return true;
    });
  }, [remoteBooks, searchQuery, selectedCategory, statusFilter, books]);

  const downloadedCount = useMemo(() => {
    const downloadedNames = new Set(books.map(b => b.folderName));
    return remoteBooks.filter(b => b.isDownloaded || downloadedNames.has(b.name)).length;
  }, [remoteBooks, books]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateRepoConfig({
      repoUrl: editRepoUrl,
      token: editToken,
      useMirror: editUseMirror,
    });
    setShowConfigDrawer(false);
  };

  return (
    <div className="container-xl" style={{ paddingBottom: '60px' }}>
      {/* Hero Header */}
      <section className="hero-banner" style={{ marginTop: '24px' }}>
        <div className="hero-left" style={{ maxWidth: '700px' }}>
          <div className="hero-badge">
            <Globe size={14} />
            <span>GitHub 远程小册库 · 按需极速同步</span>
          </div>
          <h1 className="hero-title">云端小册探索与下载</h1>
          <p className="hero-desc">
            来自 <strong>{repoConfig?.owner || 'lm-rebooter'}/{repoConfig?.repo || 'NuggetsBooklet'}</strong> 仓库，包含 115+ 本技术小册。
            无需全量克隆庞大仓库，按需点击即可秒级下载单本小册至本地。
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn-primary"
              onClick={() => fetchRemoteBooks(true)}
              disabled={isLoadingRemoteBooks}
              style={{ padding: '8px 16px', fontSize: '0.86rem' }}
            >
              <RefreshCw size={15} className={isLoadingRemoteBooks ? 'spin' : ''} />
              <span>{isLoadingRemoteBooks ? '正在同步目录...' : '刷新云端列表'}</span>
            </button>

            <button
              className="btn-secondary"
              onClick={() => setShowConfigDrawer(prev => !prev)}
              style={{ padding: '8px 16px', fontSize: '0.86rem' }}
            >
              <Settings size={15} />
              <span>仓库与加速设置</span>
            </button>
          </div>
        </div>

        <div className="hero-stats">
          <div className="stat-box">
            <div className="stat-value">{remoteBooks.length}</div>
            <div className="stat-label">云端小册总数</div>
          </div>
          <div className="stat-box">
            <div className="stat-value" style={{ color: 'var(--success-text)' }}>{downloadedCount}</div>
            <div className="stat-label">已下载到本地</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{remoteBooks.length - downloadedCount}</div>
            <div className="stat-label">可下载小册</div>
          </div>
        </div>
      </section>

      {/* Repo Settings Drawer / Box */}
      {showConfigDrawer && (
        <form onSubmit={handleSaveConfig} style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '20px 24px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)' }}>
            ⚙️ GitHub 仓库与下载源配置
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                GitHub 仓库地址
              </label>
              <input
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.86rem',
                }}
                value={editRepoUrl}
                onChange={e => setEditRepoUrl(e.target.value)}
                placeholder="https://github.com/lm-rebooter/NuggetsBooklet.git"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                GitHub Personal Access Token (可选，提高限流配额)
              </label>
              <input
                type="password"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.86rem',
                }}
                value={editToken}
                onChange={e => setEditToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.86rem' }}>
              <input
                type="checkbox"
                checked={editUseMirror}
                onChange={e => setEditUseMirror(e.target.checked)}
                style={{ accentColor: 'var(--accent-primary)' }}
              />
              <span>开启国内加速镜像节点 (ghfast.top) 下载 Raw 文件</span>
            </label>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowConfigDrawer(false)} style={{ padding: '6px 14px' }}>
                取消
              </button>
              <button type="submit" className="btn-primary" style={{ padding: '6px 16px' }}>
                保存并重新获取
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-container">
        {/* Search input */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input
            style={{
              width: '100%',
              padding: '7px 12px 7px 36px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.86rem',
            }}
            placeholder="搜索 115+ 本云端小册..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category & Status Pills */}
        <div className="filter-pills">
          <button
            className={`pill-btn ${selectedCategory === 'all' && statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => {
              setSelectedCategory('all');
              setStatusFilter('all');
            }}
          >
            全部 ({remoteBooks.length})
          </button>

          <button
            className={`pill-btn ${statusFilter === 'downloaded' ? 'active' : ''}`}
            onClick={() => {
              setSelectedCategory('all');
              setStatusFilter('downloaded');
            }}
          >
            已在书架 ({downloadedCount})
          </button>

          <button
            className={`pill-btn ${statusFilter === 'not_downloaded' ? 'active' : ''}`}
            onClick={() => {
              setSelectedCategory('all');
              setStatusFilter('not_downloaded');
            }}
          >
            可下载 ({remoteBooks.length - downloadedCount})
          </button>

          {categories.map(cat => (
            <button
              key={cat}
              className={`pill-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter('all');
                setSelectedCategory(cat);
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoadingRemoteBooks && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontSize: '1rem', fontWeight: 600 }}>正在从 GitHub 检索小册目录清单...</div>
        </div>
      )}

      {/* Empty State */}
      {!isLoadingRemoteBooks && filteredBooks.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          margin: '20px 0'
        }}>
          <Cloud size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            未找到匹配的云端小册
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            请尝试调整搜索关键词或分类筛选
          </p>
        </div>
      )}

      {/* Grid of Remote Books */}
      {!isLoadingRemoteBooks && filteredBooks.length > 0 && (
        <div className="books-grid">
          {filteredBooks.map(book => {
            const task = downloadTasks.find(t => t.bookName === book.name);
            return (
              <RemoteBookCard
                key={book.name}
                book={book}
                task={task}
                onRequestDownload={b => setTargetDownloadBook(b)}
              />
            );
          })}
        </div>
      )}

      {/* Download Options Modal */}
      <DownloadModal
        book={targetDownloadBook}
        onClose={() => setTargetDownloadBook(null)}
        onConfirm={options => {
          if (targetDownloadBook) {
            startBookDownload(targetDownloadBook.name, options);
          }
        }}
      />
    </div>
  );
};
