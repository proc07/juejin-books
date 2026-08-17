import React from 'react';
import { ExternalLink, FileText } from 'lucide-react';

interface PdfReaderProps {
  pdfUrl: string;
  chapterTitle: string;
}

export const PdfReader: React.FC<PdfReaderProps> = ({ pdfUrl, chapterTitle }) => {
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        padding: '12px 18px',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="#ef4444" />
          <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            PDF 章节模式：{chapterTitle}
          </span>
        </div>

        <a
          href={pdfUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.82rem' }}
        >
          <span>在新标签页打开</span>
          <ExternalLink size={13} />
        </a>
      </div>

      <div className="pdf-viewer-container">
        <iframe
          src={`${pdfUrl}#toolbar=1&navpanes=0`}
          title={chapterTitle}
          className="pdf-viewer-iframe"
        />
      </div>
    </div>
  );
};
