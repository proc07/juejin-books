import React, { useState } from 'react';
import { RemoteBook } from '../../types';
import { Download, X, Zap, FileText } from 'lucide-react';

interface DownloadModalProps {
  book: RemoteBook | null;
  onClose: () => void;
  onConfirm: (options: { includePdf: boolean; useMirror: boolean }) => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ book, onClose, onConfirm }) => {
  const [includePdf, setIncludePdf] = useState(true);
  const [useMirror, setUseMirror] = useState(true);

  if (!book) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="search-modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="search-modal-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              按需下载小册
            </h3>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ width: '28px', height: '28px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>
          <div style={{
            background: 'var(--bg-surface-subtle)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '18px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-text)', marginBottom: '2px' }}>
              {book.category}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {book.name}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={includePdf}
                onChange={e => setIncludePdf(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={15} color="#ef4444" />
                <span>包含 PDF 格式讲义 (推荐勾选)</span>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={useMirror}
                onChange={e => setUseMirror(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={15} color="#eab308" />
                <span>使用国内加速镜像节点下载 (极速无阻)</span>
              </div>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button className="btn-secondary" onClick={onClose}>
              取消
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                onConfirm({ includePdf, useMirror });
                onClose();
              }}
            >
              <Download size={15} />
              <span>立即按需下载</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
