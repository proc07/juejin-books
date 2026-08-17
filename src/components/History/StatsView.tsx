import React from 'react';
import { useReader } from '../../context/ReaderContext';
import { Clock, BookCheck, Flame, BookOpen, Trophy } from 'lucide-react';

export const StatsView: React.FC = () => {
  const { stats, books } = useReader();

  const formatReadTime = (sec: number = 0) => {
    if (sec < 60) return `${sec} 秒`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} 分钟`;
    const hr = (min / 60).toFixed(1);
    return `${hr} 小时`;
  };

  // Generate last 30 days for activity heatmap
  const past30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toISOString().split('T')[0];
    const duration = stats?.dailyReadingHistory?.[dateStr] || 0;
    return {
      date: dateStr,
      duration,
      level: duration === 0 ? 0 : duration < 300 ? 1 : duration < 900 ? 2 : duration < 1800 ? 3 : 4,
    };
  });

  return (
    <div className="container-xl" style={{ maxWidth: '1000px', margin: '32px auto 64px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>学习数据大盘</h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          量化每一次技术思考与知识沉淀，见证自我成长
        </p>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card-lg">
          <div className="stat-card-icon">
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-card-val">{formatReadTime(stats?.totalReadingTimeSec)}</div>
            <div className="stat-card-lbl">累计专注阅读时长</div>
          </div>
        </div>

        <div className="stat-card-lg">
          <div className="stat-card-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' }}>
            <BookCheck size={24} />
          </div>
          <div>
            <div className="stat-card-val">{stats?.chaptersCompletedCount || 0}</div>
            <div className="stat-card-lbl">已学完章节数</div>
          </div>
        </div>

        <div className="stat-card-lg">
          <div className="stat-card-icon" style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}>
            <Flame size={24} />
          </div>
          <div>
            <div className="stat-card-val">{stats?.currentStreakDays || 1} 天</div>
            <div className="stat-card-lbl">连续学习天数</div>
          </div>
        </div>

        <div className="stat-card-lg">
          <div className="stat-card-icon" style={{ backgroundColor: 'var(--bg-surface-subtle)', color: 'var(--text-primary)' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div className="stat-card-val">{books.length}</div>
            <div className="stat-card-lbl">书架小册总数</div>
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="heatmap-box">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>最近 30 天学习活跃度</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              每日阅读打卡记录（颜色越深专注时长越长）
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>少</span>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--bg-surface-subtle)' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#93c5fd' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#3b82f6' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#1d4ed8' }} />
            <span>多</span>
          </div>
        </div>

        <div className="heatmap-grid">
          {past30Days.map(item => (
            <div
              key={item.date}
              className={`heatmap-cell level-${item.level}`}
              title={`${item.date} : 学习 ${formatReadTime(item.duration)}`}
            />
          ))}
        </div>
      </div>

      {/* Achievement & Learning Insights */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          flexShrink: 0
        }}>
          <Trophy size={28} />
        </div>
        <div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            保持专注，深度思考
          </h4>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            系统性阅读掘金技术小册可以帮您建立严谨的底层心智模型。建议每天保持 20 分钟的沉浸研读与代码实操。
          </p>
        </div>
      </div>
    </div>
  );
};
