import fs from 'fs';
import path from 'path';
import { StorageData, ReadingProgress, HistoryRecord, NoteItem, UserStats } from './types';

export class LocalStorageManager {
  private filePath: string;
  private data: StorageData;

  constructor(dataDir: string) {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.filePath = path.join(dataDir, 'storage.json');
    this.data = this.load();
  }

  private load(): StorageData {
    const defaultData: StorageData = {
      progress: {},
      history: [],
      notes: [],
      bookmarks: [],
      stats: {
        totalReadingTimeSec: 0,
        booksReadCount: 0,
        chaptersCompletedCount: 0,
        currentStreakDays: 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
        dailyReadingHistory: {},
      },
    };

    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          ...defaultData,
          ...parsed,
          progress: parsed.progress || {},
          history: parsed.history || [],
          notes: parsed.notes || [],
          bookmarks: parsed.bookmarks || [],
          stats: {
            ...defaultData.stats,
            ...(parsed.stats || {}),
            dailyReadingHistory: parsed.stats?.dailyReadingHistory || {},
          },
        };
      } catch (e) {
        console.error('Failed to parse storage.json, falling back to default:', e);
      }
    }

    this.saveData(defaultData);
    return defaultData;
  }

  private saveData(data: StorageData) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  public getData(): StorageData {
    return this.data;
  }

  public getProgress(bookId: string): ReadingProgress | undefined {
    return this.data.progress[bookId];
  }

  public updateProgress(progress: Partial<ReadingProgress> & { bookId: string; chapterId: string }): ReadingProgress {
    const existing = this.data.progress[progress.bookId] || {
      bookId: progress.bookId,
      chapterId: progress.chapterId,
      chapterIndex: 0,
      chapterTitle: '',
      scrollPercentage: 0,
      completedChapters: [],
      totalChapters: 0,
      lastReadAt: new Date().toISOString(),
      totalTimeSpentSec: 0,
    };

    const updated: ReadingProgress = {
      ...existing,
      ...progress,
      lastReadAt: new Date().toISOString(),
      completedChapters: Array.from(new Set([
        ...existing.completedChapters,
        ...(progress.completedChapters || []),
      ])),
    };

    this.data.progress[progress.bookId] = updated;

    // Recalculate completed count
    const completedSet = new Set<string>();
    for (const p of Object.values(this.data.progress)) {
      p.completedChapters.forEach(c => completedSet.add(`${p.bookId}-${c}`));
    }
    this.data.stats.chaptersCompletedCount = completedSet.size;

    this.saveData(this.data);
    return updated;
  }

  public addHistory(record: Omit<HistoryRecord, 'id' | 'timestamp'>): HistoryRecord {
    const newRecord: HistoryRecord = {
      ...record,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    // Keep history sorted with newest first, limit to 200 records
    this.data.history = [newRecord, ...this.data.history.filter(h => !(h.bookId === record.bookId && h.chapterId === record.chapterId))].slice(0, 200);

    // Update daily reading stats
    const today = new Date().toISOString().split('T')[0];
    const duration = record.readDurationSec || 0;
    this.data.stats.totalReadingTimeSec += duration;
    this.data.stats.dailyReadingHistory[today] = (this.data.stats.dailyReadingHistory[today] || 0) + duration;
    this.data.stats.lastActiveDate = today;

    this.saveData(this.data);
    return newRecord;
  }

  public getHistory(): HistoryRecord[] {
    return this.data.history;
  }

  public clearHistory(): void {
    this.data.history = [];
    this.saveData(this.data);
  }

  public deleteHistoryItem(id: string): void {
    this.data.history = this.data.history.filter(h => h.id !== id);
    this.saveData(this.data);
  }

  public getNotes(bookId?: string): NoteItem[] {
    if (bookId) {
      return this.data.notes.filter(n => n.bookId === bookId);
    }
    return this.data.notes;
  }

  public addNote(note: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>): NoteItem {
    const newNote: NoteItem = {
      ...note,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.notes.unshift(newNote);
    this.saveData(this.data);
    return newNote;
  }

  public deleteNote(id: string): void {
    this.data.notes = this.data.notes.filter(n => n.id !== id);
    this.saveData(this.data);
  }

  public toggleChapterComplete(bookId: string, chapterId: string): boolean {
    const p = this.data.progress[bookId];
    if (!p) {
      this.updateProgress({
        bookId,
        chapterId,
        completedChapters: [chapterId],
      });
      return true;
    }

    const set = new Set(p.completedChapters);
    let completed = false;
    if (set.has(chapterId)) {
      set.delete(chapterId);
      completed = false;
    } else {
      set.add(chapterId);
      completed = true;
    }
    p.completedChapters = Array.from(set);
    p.lastReadAt = new Date().toISOString();
    this.saveData(this.data);
    return completed;
  }

  public recordTime(seconds: number): void {
    const today = new Date().toISOString().split('T')[0];
    this.data.stats.totalReadingTimeSec += seconds;
    this.data.stats.dailyReadingHistory[today] = (this.data.stats.dailyReadingHistory[today] || 0) + seconds;
    this.data.stats.lastActiveDate = today;
    this.saveData(this.data);
  }

  public getStats(): UserStats {
    // Count active books
    const activeBooks = Object.keys(this.data.progress).length;
    this.data.stats.booksReadCount = activeBooks;
    return this.data.stats;
  }
}
