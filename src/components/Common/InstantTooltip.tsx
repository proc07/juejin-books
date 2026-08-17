import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface TooltipState {
  visible: boolean;
  text: string;
  subtext?: string;
  badge?: string;
  x: number;
  y: number;
  placement: 'right' | 'left' | 'top' | 'bottom';
}

export interface TooltipTriggerProps {
  text: string;
  subtext?: string;
  badge?: string;
  placement?: 'right' | 'left' | 'top' | 'bottom';
  children: (props: {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => void;
    onMouseLeave: () => void;
  }) => React.ReactNode;
}

export const InstantTooltip: React.FC<TooltipTriggerProps> = ({
  text,
  subtext,
  badge,
  placement = 'right',
  children,
}) => {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    text: '',
    x: 0,
    y: 0,
    placement: 'right',
  });

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let x = rect.right + 10;
    let y = rect.top + rect.height / 2;

    if (placement === 'left') {
      x = rect.left - 10;
    } else if (placement === 'top') {
      x = rect.left + rect.width / 2;
      y = rect.top - 8;
    } else if (placement === 'bottom') {
      x = rect.left + rect.width / 2;
      y = rect.bottom + 8;
    }

    setTooltip({
      visible: true,
      text,
      subtext,
      badge,
      x,
      y,
      placement,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  return (
    <>
      {children({
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
      })}
      {tooltip.visible &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              left: tooltip.placement === 'left' ? 'auto' : `${tooltip.x}px`,
              right: tooltip.placement === 'left' ? `${window.innerWidth - tooltip.x}px` : 'auto',
              top: `${Math.max(12, Math.min(window.innerHeight - 80, tooltip.y))}px`,
              transform:
                tooltip.placement === 'top'
                  ? 'translate(-50%, -100%)'
                  : tooltip.placement === 'bottom'
                  ? 'translate(-50%, 0)'
                  : 'translate(0, -50%)',
              backgroundColor: 'var(--bg-surface-elevated, var(--bg-surface))',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '10px 14px',
              fontSize: '0.88rem',
              fontWeight: 500,
              lineHeight: 1.45,
              maxWidth: '380px',
              minWidth: '160px',
              boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.25), 0 6px 12px -2px rgba(0, 0, 0, 0.15)',
              zIndex: 99999,
              pointerEvents: 'none',
              animation: 'tooltipFadeIn 0.08s ease-out',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                {tooltip.text}
              </div>
              {tooltip.badge && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--accent-subtle)',
                    color: 'var(--accent-text)',
                    flexShrink: 0,
                    textTransform: 'uppercase',
                  }}
                >
                  {tooltip.badge}
                </span>
              )}
            </div>
            {tooltip.subtext && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {tooltip.subtext}
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
};
