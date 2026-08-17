import React, { useState } from 'react';
import { useReader } from '../../context/ReaderContext';
import { X, Plus, Trash2, BookMarked, Calendar } from 'lucide-react';

interface NotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotesDrawer: React.FC<NotesDrawerProps> = ({ isOpen, onClose }) => {
  const { currentBook, currentChapter, notes, addNote, deleteNote } = useReader();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !currentBook) return null;

  const currentBookNotes = notes.filter(n => n.bookId === currentBook.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await addNote(content);
      setContent('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '380px',
        maxWidth: '90vw',
        backgroundColor: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-xl)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookMarked size={18} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            小册随堂笔记 ({currentBookNotes.length})
          </h3>
        </div>
        <button className="btn-icon" onClick={onClose} style={{ width: '28px', height: '28px' }}>
          <X size={16} />
        </button>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
          当前章节：{currentChapter?.title}
        </div>
        <textarea
          style={{
            width: '100%',
            height: '80px',
            padding: '10px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-subtle)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            resize: 'none',
          }}
          placeholder="记录您对本节的理解、技术要点或疑问..."
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={!content.trim() || isSubmitting}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
          >
            <Plus size={14} />
            <span>保存笔记</span>
          </button>
        </div>
      </form>

      {/* Notes List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {currentBookNotes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            暂无随堂笔记，点击上方随时记录心得
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {currentBookNotes.map(item => (
              <div
                key={item.id}
                style={{
                  background: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-text)' }}>
                    {item.chapterTitle}
                  </span>
                  <button
                    className="btn-icon"
                    onClick={() => deleteNote(item.id)}
                    title="删除笔记"
                    style={{ width: '22px', height: '22px' }}
                  >
                    <Trash2 size={13} color="var(--text-muted)" />
                  </button>
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {item.content}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  <Calendar size={11} />
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
