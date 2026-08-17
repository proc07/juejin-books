import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import Prism from 'prismjs';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import { Copy, Check } from 'lucide-react';
import { useReader } from '../../context/ReaderContext';

interface MarkdownReaderProps {
  content: string;
}

// Code Block with Copy and Syntax Highlight
const CodeBlock: React.FC<{ language: string; value: string }> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightedCode = React.useMemo(() => {
    const validLang = Prism.languages[language] ? language : 'javascript';
    try {
      return Prism.highlight(value, Prism.languages[validLang] || Prism.languages.javascript, validLang);
    } catch (e) {
      return value;
    }
  }, [language, value]);

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span>{language ? language.toUpperCase() : 'CODE'}</span>
        <button className="copy-code-btn" onClick={handleCopy} title="复制完整代码">
          {copied ? (
            <>
              <Check size={13} color="#4ade80" />
              <span style={{ color: '#4ade80' }}>已复制</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>复制代码</span>
            </>
          )}
        </button>
      </div>
      <pre>
        <code
          className={`language-${language}`}
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </pre>
    </div>
  );
};

export const MarkdownReader: React.FC<MarkdownReaderProps> = ({ content }) => {
  const { settings } = useReader();

  useEffect(() => {
    Prism.highlightAll();
  }, [content]);

  const fontClass = settings.fontFamily === 'serif' ? 'font-serif' : settings.fontFamily === 'mono' ? 'font-mono' : '';

  return (
    <div
      className={`markdown-body ${fontClass}`}
      style={{
        fontSize: `${settings.fontSize}px`,
        lineHeight: settings.lineHeight,
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && (match || codeString.includes('\n'))) {
              return (
                <CodeBlock
                  language={match ? match[1] : 'sql'}
                  value={codeString}
                />
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          h1({ children, ...props }) {
            const text = String(children);
            const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '');
            return <h1 id={id} {...props}>{children}</h1>;
          },
          h2({ children, ...props }) {
            const text = String(children);
            const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '');
            return <h2 id={id} {...props}>{children}</h2>;
          },
          h3({ children, ...props }) {
            const text = String(children);
            const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '');
            return <h3 id={id} {...props}>{children}</h3>;
          },
          a({ href, children, ...props }: any) {
            const isHash = href?.startsWith('#');
            return (
              <a
                href={href}
                target={isHash ? undefined : '_blank'}
                rel={isHash ? undefined : 'noopener noreferrer'}
                {...props}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
