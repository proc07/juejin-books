import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Book, Chapter, HistoryRecord, NoteItem, UserStats, ReaderSettings, ReaderTheme, RemoteBook, DownloadTask, RepoConfig } from '../types';
import { api } from '../api';
import confetti from 'canvas-confetti';

interface ReaderContextType {
  // Navigation & Views
  activeView: 'bookshelf' | 'remote' | 'history' | 'stats' | 'reader';
  setActiveView: (view: 'bookshelf' | 'remote' | 'history' | 'stats' | 'reader') => void;
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: (open: boolean) => void;

  // Local Books
  books: Book[];
  isLoadingBooks: boolean;
  currentBook: Book | null;
  currentChapter: Chapter | null;
  chapterIndex: number;
  openBook: (bookId: string, chapterId?: string) => Promise<void>;
  openChapter: (chapterId: string) => Promise<void>;
  nextChapter: () => void;
  prevChapter: () => void;
  rescanBooks: () => Promise<void>;

  // Remote Repository & Downloader
  remoteBooks: RemoteBook[];
  isLoadingRemoteBooks: boolean;
  downloadTasks: DownloadTask[];
  repoConfig: RepoConfig | null;
  fetchRemoteBooks: (forceRefresh?: boolean) => Promise<void>;
  startBookDownload: (bookName: string, options?: { includePdf?: boolean; includeAudio?: boolean; useMirror?: boolean }) => Promise<void>;
  deleteDownloadedBook: (bookName: string) => Promise<void>;
  updateRepoConfig: (newConfig: Partial<RepoConfig>) => Promise<void>;

  // Progress & History
  history: HistoryRecord[];
  stats: UserStats | null;
  completedChapterIds: Set<string>;
  toggleChapterCompletion: (chapterId: string) => Promise<void>;
  deleteHistoryItem: (id: string) => Promise<void>;
  clearAllHistory: () => Promise<void>;
  updateScrollProgress: (pct: number) => void;

  // Settings & Theme
  settings: ReaderSettings;
  updateSettings: (newSettings: Partial<ReaderSettings>) => void;
  setTheme: (theme: ReaderTheme) => void;

  // Notes
  notes: NoteItem[];
  addNote: (content: string, highlightedText?: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}

const ReaderContext = createContext<ReaderContextType | undefined>(undefined);

export const ReaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<'bookshelf' | 'remote' | 'history' | 'stats' | 'reader'>('bookshelf');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);

  const [books, setBooks] = useState<Book[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState<boolean>(true);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [completedChapterIds, setCompletedChapterIds] = useState<Set<string>>(new Set());

  // Remote Repository State
  const [remoteBooks, setRemoteBooks] = useState<RemoteBook[]>([]);
  const [isLoadingRemoteBooks, setIsLoadingRemoteBooks] = useState<boolean>(false);
  const [downloadTasks, setDownloadTasks] = useState<DownloadTask[]>([]);
  const [repoConfig, setRepoConfig] = useState<RepoConfig | null>(null);

  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [notes, setNotes] = useState<NoteItem[]>([]);

  // Reader Settings stored in localStorage
  const [settings, setSettings] = useState<ReaderSettings>(() => {
    const saved = localStorage.getItem('juejin_reader_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      theme: 'light',
      fontSize: 16,
      lineHeight: 1.8,
      fontFamily: 'sans',
      contentWidth: 'normal',
      autoScrollSave: true,
    };
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    localStorage.setItem('juejin_reader_settings', JSON.stringify(settings));
  }, [settings]);

  // Load initial books, history, stats, repoConfig
  const fetchAllData = useCallback(async () => {
    try {
      setIsLoadingBooks(true);
      const [fetchedBooks, fetchedHistory, fetchedStats, fetchedNotes, fetchedConfig] = await Promise.all([
        api.getBooks(),
        api.getHistory(),
        api.getStats(),
        api.getNotes(),
        api.getRepoConfig(),
      ]);
      setBooks(fetchedBooks);
      setHistory(fetchedHistory);
      setStats(fetchedStats);
      setNotes(fetchedNotes);
      setRepoConfig(fetchedConfig);
    } catch (e) {
      console.error('Failed to load reader data:', e);
    } finally {
      setIsLoadingBooks(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Fetch remote books
  const fetchRemoteBooks = useCallback(async (forceRefresh = false) => {
    setIsLoadingRemoteBooks(true);
    try {
      const list = await api.getRemoteBooks(forceRefresh);
      setRemoteBooks(list);
    } catch (e) {
      console.error('Failed to load remote books:', e);
    } finally {
      setIsLoadingRemoteBooks(false);
    }
  }, []);

  // Poll download tasks if any task is running
  const hasActiveTasks = downloadTasks.some(t => t.status === 'pending' || t.status === 'downloading');
  useEffect(() => {
    let interval: any;
    if (hasActiveTasks || activeView === 'remote') {
      interval = setInterval(async () => {
        try {
          const tasks = await api.getDownloadTasks();
          setDownloadTasks(tasks);

          // If a task just completed, refresh books list and remote books
          const anyCompleted = tasks.some(t => t.status === 'completed' && (!downloadTasks.find(old => old.id === t.id) || downloadTasks.find(old => old.id === t.id)?.status !== 'completed'));
          if (anyCompleted) {
            api.getBooks().then(setBooks);
            api.getRemoteBooks().then(setRemoteBooks);
          }
        } catch (e) {}
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [hasActiveTasks, activeView, downloadTasks]);

  // Start book download
  const startBookDownload = async (bookName: string, options?: { includePdf?: boolean; includeAudio?: boolean; useMirror?: boolean }) => {
    try {
      const task = await api.startDownload({
        bookName,
        includePdf: options?.includePdf ?? true,
        includeAudio: options?.includeAudio ?? false,
        useMirror: options?.useMirror ?? true,
      });
      setDownloadTasks(prev => [task, ...prev.filter(t => t.id !== task.id)]);
    } catch (e: any) {
      alert(`启动下载失败: ${e.message || '网络错误'}`);
    }
  };

  // Delete downloaded book
  const deleteDownloadedBook = async (bookName: string) => {
    await api.deleteLocalBook(bookName);
    await Promise.all([
      api.getBooks().then(setBooks),
      api.getRemoteBooks().then(setRemoteBooks),
    ]);
  };

  // Update repo config
  const updateRepoConfig = async (newConfig: Partial<RepoConfig>) => {
    const updated = await api.updateRepoConfig(newConfig);
    setRepoConfig(updated);
    await fetchRemoteBooks(true);
  };

  // Keyboard shortcut Ctrl+K or Cmd+K for search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Heartbeat for active reading time tracking
  useEffect(() => {
    if (activeView !== 'reader' || !currentBook || !currentChapter) return;
    const timer = setInterval(() => {
      api.sendHeartbeat(15);
    }, 15000);
    return () => clearInterval(timer);
  }, [activeView, currentBook, currentChapter]);

  // Open a book
  const openBook = async (bookId: string, targetChapterId?: string) => {
    try {
      const bookDetail = await api.getBook(bookId);
      setCurrentBook(bookDetail);

      const completed = new Set<string>(bookDetail.userProgress?.completedChapters || []);
      setCompletedChapterIds(completed);

      let chapterToOpen: Chapter | undefined;
      if (targetChapterId) {
        chapterToOpen = bookDetail.chapters.find(c => c.id === targetChapterId);
      } else if (bookDetail.userProgress?.chapterId) {
        chapterToOpen = bookDetail.chapters.find(c => c.id === bookDetail.userProgress?.chapterId);
      }
      if (!chapterToOpen && bookDetail.chapters.length > 0) {
        chapterToOpen = bookDetail.chapters[0];
      }

      if (chapterToOpen) {
        setCurrentChapter(chapterToOpen);
        await api.addHistory({
          bookId: bookDetail.id,
          bookTitle: bookDetail.title,
          chapterId: chapterToOpen.id,
          chapterTitle: chapterToOpen.title,
          chapterIndex: bookDetail.chapters.indexOf(chapterToOpen),
          totalChapters: bookDetail.chapters.length,
          format: chapterToOpen.format === 'pdf' ? 'pdf' : 'md',
          progressPercentage: 0,
          readDurationSec: 0,
        });
      }

      setActiveView('reader');
      api.getHistory().then(setHistory);
      api.getStats().then(setStats);
    } catch (e) {
      console.error('Failed to open book:', e);
    }
  };

  const openChapter = async (chapterId: string) => {
    if (!currentBook) return;
    const ch = currentBook.chapters.find(c => c.id === chapterId);
    if (!ch) return;
    setCurrentChapter(ch);

    const chIndex = currentBook.chapters.indexOf(ch);
    await api.saveProgress({
      bookId: currentBook.id,
      chapterId: ch.id,
      chapterIndex: chIndex,
      chapterTitle: ch.title,
      scrollPercentage: 0,
      totalChapters: currentBook.chapters.length,
    });

    await api.addHistory({
      bookId: currentBook.id,
      bookTitle: currentBook.title,
      chapterId: ch.id,
      chapterTitle: ch.title,
      chapterIndex: chIndex,
      totalChapters: currentBook.chapters.length,
      format: ch.format === 'pdf' ? 'pdf' : 'md',
      progressPercentage: 0,
      readDurationSec: 0,
    });

    api.getHistory().then(setHistory);
  };

  const chapterIndex = currentBook && currentChapter ? currentBook.chapters.findIndex(c => c.id === currentChapter.id) : 0;

  const nextChapter = () => {
    if (!currentBook || chapterIndex < 0 || chapterIndex >= currentBook.chapters.length - 1) return;
    openChapter(currentBook.chapters[chapterIndex + 1].id);
  };

  const prevChapter = () => {
    if (!currentBook || chapterIndex <= 0) return;
    openChapter(currentBook.chapters[chapterIndex - 1].id);
  };

  const toggleChapterCompletion = async (chapterId: string) => {
    if (!currentBook) return;
    const res = await api.toggleChapterComplete(currentBook.id, chapterId);
    setCompletedChapterIds(new Set(res.progress.completedChapters));

    if (res.isCompleted) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    }

    api.getBooks().then(setBooks);
    api.getStats().then(setStats);
  };

  const updateScrollProgress = (pct: number) => {
    if (!currentBook || !currentChapter) return;
    api.saveProgress({
      bookId: currentBook.id,
      chapterId: currentChapter.id,
      chapterIndex,
      chapterTitle: currentChapter.title,
      scrollPercentage: pct,
      totalChapters: currentBook.chapters.length,
    });
  };

  const deleteHistoryItem = async (id: string) => {
    await api.deleteHistory(id);
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const clearAllHistory = async () => {
    await api.clearHistory();
    setHistory([]);
  };

  const rescanBooks = async () => {
    const updated = await api.rescan();
    setBooks(updated);
  };

  const updateSettings = (newSettings: Partial<ReaderSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const setTheme = (theme: ReaderTheme) => {
    updateSettings({ theme });
  };

  const addNote = async (content: string, highlightedText?: string) => {
    if (!currentBook || !currentChapter) return;
    const note = await api.addNote({
      bookId: currentBook.id,
      chapterId: currentChapter.id,
      chapterTitle: currentChapter.title,
      highlightedText,
      content,
    });
    setNotes(prev => [note, ...prev]);
  };

  const deleteNote = async (id: string) => {
    await api.deleteNote(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  return (
    <ReaderContext.Provider
      value={{
        activeView,
        setActiveView,
        isSearchModalOpen,
        setIsSearchModalOpen,
        books,
        isLoadingBooks,
        currentBook,
        currentChapter,
        chapterIndex,
        openBook,
        openChapter,
        nextChapter,
        prevChapter,
        rescanBooks,
        remoteBooks,
        isLoadingRemoteBooks,
        downloadTasks,
        repoConfig,
        fetchRemoteBooks,
        startBookDownload,
        deleteDownloadedBook,
        updateRepoConfig,
        history,
        stats,
        completedChapterIds,
        toggleChapterCompletion,
        deleteHistoryItem,
        clearAllHistory,
        updateScrollProgress,
        settings,
        updateSettings,
        setTheme,
        notes,
        addNote,
        deleteNote,
      }}
    >
      {children}
    </ReaderContext.Provider>
  );
};

export const useReader = () => {
  const context = useContext(ReaderContext);
  if (!context) {
    throw new Error('useReader must be used within a ReaderProvider');
  }
  return context;
};
