import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { scanBooks } from './scanner';
import { LocalStorageManager } from './storage';
import { searchBooks } from './search';
import { GitHubService } from './github';
import { Book } from './types';

const app = express();
const PORT = process.env.PORT || 3001;

const ROOT_DIR = process.cwd();
const BOOKS_DIR = path.join(ROOT_DIR, 'books');
const DATA_DIR = path.join(ROOT_DIR, 'data');

const storage = new LocalStorageManager(DATA_DIR);

app.use(cors());
app.use(express.json());

// Serve static assets from books directory (PDFs, images, etc.)
app.use('/books-static', express.static(BOOKS_DIR));

// In-memory cache of scanned books
let cachedBooks: Book[] = [];

function refreshBooks() {
  cachedBooks = scanBooks(BOOKS_DIR);
  console.log(`[Scanner] Scanned ${cachedBooks.length} books.`);
}

const githubService = new GitHubService(DATA_DIR, BOOKS_DIR, () => {
  refreshBooks();
});

refreshBooks();

// Remote GitHub Booklet APIs
app.get('/api/remote/books', async (req, res) => {
  const forceRefresh = req.query.refresh === 'true';
  try {
    const books = await githubService.getRemoteBooks(forceRefresh);
    res.json({ success: true, data: books });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message || '获取远程目录失败' });
  }
});

app.post('/api/remote/download', async (req, res) => {
  const { bookName, includePdf = true, includeAudio = false, useMirror = true } = req.body;
  if (!bookName) {
    return res.status(400).json({ success: false, message: 'Missing bookName' });
  }
  try {
    const task = await githubService.startDownload(bookName, { includePdf, includeAudio, useMirror });
    res.json({ success: true, data: task });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message || '启动下载失败' });
  }
});

app.get('/api/remote/tasks', (_req, res) => {
  const tasks = githubService.getTasks();
  res.json({ success: true, data: tasks });
});

app.delete('/api/remote/local-book/:bookName', (req, res) => {
  const { bookName } = req.params;
  const deleted = githubService.deleteLocalBook(bookName);
  res.json({ success: true, deleted });
});

app.get('/api/remote/config', (_req, res) => {
  const config = githubService.getConfig();
  res.json({ success: true, data: config });
});

app.post('/api/remote/config', (req, res) => {
  const config = githubService.updateConfig(req.body);
  res.json({ success: true, data: config });
});

// API Routes

// 1. Get all books
app.get('/api/books', (_req, res) => {
  const data = storage.getData();
  const booksWithProgress = cachedBooks.map(book => {
    const progress = data.progress[book.id];
    const completedCount = progress?.completedChapters?.length || 0;
    const progressPercent = book.chapterCount > 0 ? Math.round((completedCount / book.chapterCount) * 100) : 0;

    return {
      ...book,
      progress: {
        lastChapterId: progress?.chapterId,
        lastChapterTitle: progress?.chapterTitle,
        lastChapterIndex: progress?.chapterIndex ?? 0,
        scrollPercentage: progress?.scrollPercentage ?? 0,
        completedCount,
        progressPercent,
        lastReadAt: progress?.lastReadAt,
      },
    };
  });
  res.json({ success: true, data: booksWithProgress });
});

// 2. Get book by ID
app.get('/api/books/:bookId', (req, res) => {
  const { bookId } = req.params;
  const book = cachedBooks.find(b => b.id === bookId);
  if (!book) {
    return res.status(404).json({ success: false, message: 'Book not found' });
  }

  const progress = storage.getProgress(bookId);
  res.json({
    success: true,
    data: {
      ...book,
      userProgress: progress || null,
    },
  });
});

// 3. Get chapter content (Markdown content or metadata)
app.get('/api/books/:bookId/chapters/:chapterId/content', (req, res) => {
  const { bookId, chapterId } = req.params;
  const book = cachedBooks.find(b => b.id === bookId);
  if (!book) {
    return res.status(404).json({ success: false, message: 'Book not found' });
  }

  const chapter = book.chapters.find(c => c.id === chapterId);
  if (!chapter) {
    return res.status(404).json({ success: false, message: 'Chapter not found' });
  }

  let markdownContent = '';
  if (chapter.mdPath) {
    const fullMdPath = path.join(BOOKS_DIR, chapter.mdPath);
    if (fs.existsSync(fullMdPath)) {
      markdownContent = fs.readFileSync(fullMdPath, 'utf-8');
    }
  }

  res.json({
    success: true,
    data: {
      chapter,
      markdownContent,
      pdfUrl: chapter.pdfPath ? `/books-static/${encodeURIComponent(book.folderName)}/${encodeURIComponent(path.basename(chapter.pdfPath))}` : null,
    },
  });
});

// 4. Update reading progress
app.post('/api/progress', (req, res) => {
  const { bookId, chapterId, chapterIndex, chapterTitle, scrollPercentage, completedChapters, totalChapters } = req.body;
  if (!bookId || !chapterId) {
    return res.status(400).json({ success: false, message: 'Missing bookId or chapterId' });
  }

  const updated = storage.updateProgress({
    bookId,
    chapterId,
    chapterIndex: chapterIndex ?? 0,
    chapterTitle: chapterTitle || '',
    scrollPercentage: scrollPercentage ?? 0,
    completedChapters: completedChapters || [],
    totalChapters: totalChapters ?? 0,
  });

  res.json({ success: true, data: updated });
});

// 5. Toggle chapter complete
app.post('/api/progress/toggle-complete', (req, res) => {
  const { bookId, chapterId } = req.body;
  if (!bookId || !chapterId) {
    return res.status(400).json({ success: false, message: 'Missing bookId or chapterId' });
  }

  const isCompleted = storage.toggleChapterComplete(bookId, chapterId);
  const progress = storage.getProgress(bookId);
  res.json({ success: true, data: { isCompleted, progress } });
});

// 6. History records
app.get('/api/history', (_req, res) => {
  const history = storage.getHistory();
  res.json({ success: true, data: history });
});

app.post('/api/history', (req, res) => {
  const { bookId, bookTitle, chapterId, chapterTitle, chapterIndex, totalChapters, format, progressPercentage, readDurationSec } = req.body;
  if (!bookId || !chapterId) {
    return res.status(400).json({ success: false, message: 'Invalid history payload' });
  }

  const record = storage.addHistory({
    bookId,
    bookTitle: bookTitle || '',
    chapterId,
    chapterTitle: chapterTitle || '',
    chapterIndex: chapterIndex || 0,
    totalChapters: totalChapters || 0,
    format: format || 'md',
    progressPercentage: progressPercentage || 0,
    readDurationSec: readDurationSec || 0,
  });

  res.json({ success: true, data: record });
});

app.delete('/api/history/:id', (req, res) => {
  storage.deleteHistoryItem(req.params.id);
  res.json({ success: true, message: 'History item deleted' });
});

app.delete('/api/history', (_req, res) => {
  storage.clearHistory();
  res.json({ success: true, message: 'History cleared' });
});

// 7. Statistics
app.get('/api/stats', (_req, res) => {
  const stats = storage.getStats();
  res.json({ success: true, data: stats });
});

app.post('/api/stats/heartbeat', (req, res) => {
  const { seconds = 15 } = req.body;
  storage.recordTime(Number(seconds));
  res.json({ success: true });
});

// 8. Notes
app.get('/api/notes', (req, res) => {
  const bookId = req.query.bookId as string | undefined;
  const notes = storage.getNotes(bookId);
  res.json({ success: true, data: notes });
});

app.post('/api/notes', (req, res) => {
  const { bookId, chapterId, chapterTitle, highlightedText, content } = req.body;
  if (!bookId || !chapterId || !content) {
    return res.status(400).json({ success: false, message: 'Invalid note data' });
  }

  const note = storage.addNote({
    bookId,
    chapterId,
    chapterTitle: chapterTitle || '',
    highlightedText,
    content,
  });

  res.json({ success: true, data: note });
});

app.delete('/api/notes/:id', (req, res) => {
  storage.deleteNote(req.params.id);
  res.json({ success: true, message: 'Note deleted' });
});

// 9. Search
app.get('/api/search', (req, res) => {
  const q = (req.query.q as string) || '';
  const results = searchBooks(cachedBooks, BOOKS_DIR, q);
  res.json({ success: true, data: results });
});

// 10. Rescan
app.post('/api/books/rescan', (_req, res) => {
  refreshBooks();
  res.json({ success: true, count: cachedBooks.length, data: cachedBooks });
});

app.listen(PORT, () => {
  console.log(`🚀 [Server] Book reader API running on http://localhost:${PORT}`);
  console.log(`📁 [Server] Reading books from: ${BOOKS_DIR}`);
});
