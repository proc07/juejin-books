import React, { useEffect, useState } from 'react';
import { InstantTooltip } from '../Common/InstantTooltip';

interface Heading {
  level: number;
  text: string;
  id: string;
}

interface TableOfContentsProps {
  headings?: Heading[];
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ headings = [], scrollContainerRef }) => {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (!headings.length || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const handleScroll = () => {
      const headingElements = headings
        .map(h => document.getElementById(h.id))
        .filter((el): el is HTMLElement => el !== null);

      const containerTop = container.scrollTop;

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const el = headingElements[i];
        if (el.offsetTop - 140 <= containerTop) {
          setActiveId(el.id);
          return;
        }
      }
      if (headingElements.length > 0) {
        setActiveId(headingElements[0].id);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [headings, scrollContainerRef]);

  if (!headings.length) return null;

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el && scrollContainerRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  };

  return (
    <nav className="toc-container">
      <div className="toc-title">
        <span>本章大纲导读</span>
      </div>
      <div>
        {headings.map((h, i) => (
          <InstantTooltip
            key={`${h.id}-${i}`}
            text={h.text}
            subtext={`H${h.level} 标题 · 点击平滑定位`}
            placement="left"
          >
            {({ onMouseEnter, onMouseLeave }) => (
              <a
                href={`#${h.id}`}
                className={`toc-link level-${h.level} ${activeId === h.id ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToHeading(h.id);
                }}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
              >
                {h.text}
              </a>
            )}
          </InstantTooltip>
        ))}
      </div>
    </nav>
  );
};
