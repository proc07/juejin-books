import fs from 'fs';
import path from 'path';
import { Book } from './types';

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

export function searchBooks(books: Book[], booksDir: string, query: string): SearchResultItem[] {
  if (!query || query.trim().length === 0) return [];
  const q = query.trim().toLowerCase();
  const results: SearchResultItem[] = [];

  for (const book of books) {
    const bookTitleMatch = book.title.toLowerCase().includes(q);

    book.chapters.forEach((chapter, index) => {
      const chapterTitleMatch = chapter.title.toLowerCase().includes(q);

      if (chapterTitleMatch) {
        results.push({
          bookId: book.id,
          bookTitle: book.title,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          chapterIndex: index,
          format: chapter.format,
          matchType: 'chapter_title',
        });
        return;
      }

      if (bookTitleMatch && index === 0) {
        results.push({
          bookId: book.id,
          bookTitle: book.title,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          chapterIndex: index,
          format: chapter.format,
          matchType: 'book_title',
        });
        return;
      }

      // Content search if markdown
      if (chapter.mdPath && results.length < 50) {
        try {
          const filePath = path.join(booksDir, chapter.mdPath);
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const lowerContent = content.toLowerCase();
            const pos = lowerContent.indexOf(q);
            if (pos !== -1) {
              const start = Math.max(0, pos - 40);
              const end = Math.min(content.length, pos + q.length + 60);
              let snippet = content.substring(start, end).replace(/[\n\r]+/g, ' ');
              if (start > 0) snippet = '...' + snippet;
              if (end < content.length) snippet = snippet + '...';

              results.push({
                bookId: book.id,
                bookTitle: book.title,
                chapterId: chapter.id,
                chapterTitle: chapter.title,
                chapterIndex: index,
                format: chapter.format,
                matchType: 'content',
                snippet,
              });
            }
          }
        } catch (e) {
          // ignore read error
        }
      }
    });
  }

  return results.slice(0, 30);
}
