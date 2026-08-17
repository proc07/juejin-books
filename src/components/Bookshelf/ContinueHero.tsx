import React from 'react';
import { useReader } from '../../context/ReaderContext';
import { Play, Sparkles } from 'lucide-react';

export const ContinueHero: React.FC = () => {
  const { books, openBook, stats } = useReader();

  // Find the most recently read book
  const recentBook = books
    .filter(b => b.progress?.lastReadAt)
    .sort((a, b) => new Date(b.progress!.lastReadAt!).getTime() - new Date(a.progress!.lastReadAt!).getTime())[0] || books[0];

  if (!recentBook) return null;

  const progress = recentBook.progress;
  const progressPercent = progress?.progressPercent || 0;
  const lastChapterTitle = progress?.lastChapterTitle || recentBook.chapters[0]?.title || '开启第一章';

  const formatReadTime = (sec: number = 0) => {
    if (sec < 60) return `${sec} 秒`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} 分钟`;
    const hr = (min / 60).toFixed(1);
    return `${hr} 小时`;
  };

  return (
    <section className="hero-banner">
      <div className="hero-left">
        <div className="hero-badge">
          <Sparkles size={14} />
          <span>持续精进 · 知识沉淀</span>
        </div>
        <h1 className="hero-title">{recentBook.title}</h1>
        <p className="hero-desc">
          上次阅读至：<strong>{lastChapterTitle}</strong> (进度 {progressPercent}%)
        </p>

        <div className="hero-actions">
          <button
            className="btn-primary"
            onClick={() => openBook(recentBook.id, progress?.lastChapterId)}
          >
            <Play size={16} fill="#ffffff" />
            <span>继续学习</span>
          </button>
        </div>
      </div>

      <div className="hero-stats">
        <div className="stat-box">
          <div className="stat-value">{books.length}</div>
          <div className="stat-label">小册总数</div>
        </div>

        <div className="stat-box">
          <div className="stat-value">{stats?.chaptersCompletedCount || 0}</div>
          <div className="stat-label">已学完章节</div>
        </div>

        <div className="stat-box">
          <div className="stat-value">{formatReadTime(stats?.totalReadingTimeSec)}</div>
          <div className="stat-label">累计专注时长</div>
        </div>
      </div>
    </section>
  );
};
