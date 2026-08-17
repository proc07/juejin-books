export interface Chapter {
  id: string;
  order: number;
  title: string;
  filename: string;
  format: 'md' | 'pdf' | 'both';
  mdPath?: string;
  pdfPath?: string;
  sizeBytes?: number;
  wordCount?: number;
  readTimeMin?: number;
  headings?: Array<{ level: number; text: string; id: string }>;
}

export interface BookProgress {
  lastChapterId?: string;
  lastChapterTitle?: string;
  lastChapterIndex?: number;
  scrollPercentage?: number;
  completedCount: number;
  progressPercent: number;
  lastReadAt?: string;
}

export interface Book {
  id: string;
  title: string;
  folderName: string;
  coverColor?: string;
  category?: string;
  author?: string;
  description?: string;
  chapterCount: number;
  mdCount: number;
  pdfCount: number;
  chapters: Chapter[];
  lastModified: string;
  progress?: BookProgress;
}

export interface ReadingProgress {
  bookId: string;
  chapterId: string;
  chapterIndex: number;
  chapterTitle: string;
  scrollPercentage: number;
  scrollPosition?: number;
  completedChapters: string[];
  totalChapters: number;
  lastReadAt: string;
  totalTimeSpentSec: number;
}

export interface HistoryRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  chapterId: string;
  chapterTitle: string;
  chapterIndex: number;
  totalChapters: number;
  format: 'md' | 'pdf';
  progressPercentage: number;
  readDurationSec: number;
  timestamp: string;
}

export interface NoteItem {
  id: string;
  bookId: string;
  chapterId: string;
  chapterTitle: string;
  highlightedText?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookmarkItem {
  id: string;
  bookId: string;
  chapterId: string;
  chapterTitle: string;
  scrollPercentage: number;
  headingText?: string;
  createdAt: string;
}

export interface UserStats {
  totalReadingTimeSec: number;
  booksReadCount: number;
  chaptersCompletedCount: number;
  currentStreakDays: number;
  lastActiveDate: string;
  dailyReadingHistory: Record<string, number>;
}

export interface SearchResultItem {
  bookId: string;
  bookTitle: string;
  chapterId: string;
  chapterTitle: string;
  chapterIndex: number;
  format: string;
  matchType: 'book_title' | 'chapter_title' | 'content';
  snippet?: string;
}

export type ReaderTheme = 'light' | 'sepia' | 'dark' | 'forest';
export type ReaderWidth = 'narrow' | 'normal' | 'wide' | 'full';

export interface ReaderSettings {
  theme: ReaderTheme;
  fontSize: number;
  lineHeight: number;
  fontFamily: 'sans' | 'serif' | 'mono';
  contentWidth: ReaderWidth;
  autoScrollSave: boolean;
}

export interface RemoteBook {
  name: string;
  path: string;
  sha: string;
  size: number;
  category: string;
  coverColor: string;
  isDownloaded: boolean;
}

export interface DownloadTask {
  id: string;
  bookName: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number;
  currentFile: string;
  totalFiles: number;
  downloadedFiles: number;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface RepoConfig {
  repoUrl: string;
  owner: string;
  repo: string;
  branch: string;
  token?: string;
  useMirror: boolean;
  mirrorPrefix: string;
}
