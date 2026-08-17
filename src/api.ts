import { Book, ReadingProgress, HistoryRecord, NoteItem, UserStats, SearchResultItem } from './types';

const API_BASE = '/api';

export const api = {
  // Books
  async getBooks(): Promise<Book[]> {
    const res = await fetch(`${API_BASE}/books`);
    const json = await res.json();
    return json.data || [];
  },

  async getBook(bookId: string): Promise<Book & { userProgress?: ReadingProgress }> {
    const res = await fetch(`${API_BASE}/books/${bookId}`);
    const json = await res.json();
    return json.data;
  },

  async getChapterContent(bookId: string, chapterId: string): Promise<{
    chapter: any;
    markdownContent: string;
    pdfUrl: string | null;
  }> {
    const res = await fetch(`${API_BASE}/books/${bookId}/chapters/${chapterId}/content`);
    const json = await res.json();
    return json.data;
  },

  // Progress
  async saveProgress(payload: {
    bookId: string;
    chapterId: string;
    chapterIndex: number;
    chapterTitle: string;
    scrollPercentage: number;
    completedChapters?: string[];
    totalChapters: number;
  }): Promise<ReadingProgress> {
    const res = await fetch(`${API_BASE}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return json.data;
  },

  async toggleChapterComplete(bookId: string, chapterId: string): Promise<{ isCompleted: boolean; progress: ReadingProgress }> {
    const res = await fetch(`${API_BASE}/progress/toggle-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId, chapterId }),
    });
    const json = await res.json();
    return json.data;
  },

  // History
  async getHistory(): Promise<HistoryRecord[]> {
    const res = await fetch(`${API_BASE}/history`);
    const json = await res.json();
    return json.data || [];
  },

  async addHistory(payload: {
    bookId: string;
    bookTitle: string;
    chapterId: string;
    chapterTitle: string;
    chapterIndex: number;
    totalChapters: number;
    format: 'md' | 'pdf';
    progressPercentage: number;
    readDurationSec: number;
  }): Promise<HistoryRecord> {
    const res = await fetch(`${API_BASE}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return json.data;
  },

  async deleteHistory(id: string): Promise<void> {
    await fetch(`${API_BASE}/history/${id}`, { method: 'DELETE' });
  },

  async clearHistory(): Promise<void> {
    await fetch(`${API_BASE}/history`, { method: 'DELETE' });
  },

  // Stats
  async getStats(): Promise<UserStats> {
    const res = await fetch(`${API_BASE}/stats`);
    const json = await res.json();
    return json.data;
  },

  async sendHeartbeat(seconds: number = 15): Promise<void> {
    await fetch(`${API_BASE}/stats/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seconds }),
    });
  },

  // Notes
  async getNotes(bookId?: string): Promise<NoteItem[]> {
    const url = bookId ? `${API_BASE}/notes?bookId=${bookId}` : `${API_BASE}/notes`;
    const res = await fetch(url);
    const json = await res.json();
    return json.data || [];
  },

  async addNote(payload: {
    bookId: string;
    chapterId: string;
    chapterTitle: string;
    highlightedText?: string;
    content: string;
  }): Promise<NoteItem> {
    const res = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return json.data;
  },

  async deleteNote(id: string): Promise<void> {
    await fetch(`${API_BASE}/notes/${id}`, { method: 'DELETE' });
  },

  // Search
  async search(query: string): Promise<SearchResultItem[]> {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    const json = await res.json();
    return json.data || [];
  },

  // Rescan
  async rescan(): Promise<Book[]> {
    const res = await fetch(`${API_BASE}/books/rescan`, { method: 'POST' });
    const json = await res.json();
    return json.data || [];
  },

  // Remote Repository & On-Demand Downloader
  async getRemoteBooks(refresh = false): Promise<any[]> {
    const res = await fetch(`${API_BASE}/remote/books${refresh ? '?refresh=true' : ''}`);
    const json = await res.json();
    return json.data || [];
  },

  async startDownload(payload: {
    bookName: string;
    includePdf?: boolean;
    includeAudio?: boolean;
    useMirror?: boolean;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/remote/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return json.data;
  },

  async getDownloadTasks(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/remote/tasks`);
    const json = await res.json();
    return json.data || [];
  },

  async deleteLocalBook(bookName: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/remote/local-book/${encodeURIComponent(bookName)}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    return json.deleted;
  },

  async getRepoConfig(): Promise<any> {
    const res = await fetch(`${API_BASE}/remote/config`);
    const json = await res.json();
    return json.data;
  },

  async updateRepoConfig(config: any): Promise<any> {
    const res = await fetch(`${API_BASE}/remote/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    const json = await res.json();
    return json.data;
  },
};
