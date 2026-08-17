import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Book, Chapter } from './types';

// Helper to calculate natural order from filename
export function extractOrderAndTitle(filename: string): { order: number; cleanTitle: string } {
  // Strip extension
  const nameWithoutExt = filename.replace(/\.(md|markdown|pdf)$/i, '').trim();

  // Match leading numbers like "0万里长征...", "01_...", "10-...", "第1章..."
  const numMatch = nameWithoutExt.match(/^(?:第\s*)?(\d+)(?:章|节|讲|篇|\s*[-_—.]*\s*)?/);
  let order = 9999;
  if (numMatch && numMatch[1]) {
    order = parseInt(numMatch[1], 10);
  }

  return {
    order,
    cleanTitle: nameWithoutExt,
  };
}

// Generate consistent ID
export function generateId(str: string): string {
  return crypto.createHash('md5').update(str).digest('hex').substring(0, 12);
}

// Extract headings from markdown content
export function extractHeadings(content: string): Array<{ level: number; text: string; id: string }> {
  const headings: Array<{ level: number; text: string; id: string }> = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/[#*`_~]/g, '').trim();
      const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '') || `heading-${headings.length}`;
      headings.push({ level, text, id });
    }
  }

  return headings;
}

// Determine book category / color
export function detectCategory(title: string): { category: string; coverColor: string } {
  const lower = title.toLowerCase();
  if (lower.includes('mysql') || lower.includes('sql') || lower.includes('database') || lower.includes('db')) {
    return { category: '数据库 & 存储', coverColor: 'linear-gradient(135deg, #00758F 0%, #F29111 100%)' };
  }
  if (lower.includes('redis')) {
    return { category: '缓存 & 架构', coverColor: 'linear-gradient(135deg, #D82C20 0%, #8A150D 100%)' };
  }
  if (lower.includes('react') || lower.includes('vue') || lower.includes('前端') || lower.includes('css') || lower.includes('javascript') || lower.includes('js') || lower.includes('ts')) {
    return { category: '前端全栈', coverColor: 'linear-gradient(135deg, #007acc 0%, #20b2aa 100%)' };
  }
  if (lower.includes('java') || lower.includes('spring') || lower.includes('golang') || lower.includes('后端') || lower.includes('node')) {
    return { category: '后端进阶', coverColor: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)' };
  }
  if (lower.includes('算法') || lower.includes('leetcode') || lower.includes('数据结构')) {
    return { category: '算法 & 算力', coverColor: 'linear-gradient(135deg, #e17055 0%, #fab1a0 100%)' };
  }
  if (lower.includes('网络') || lower.includes('http') || lower.includes('tcp') || lower.includes('linux')) {
    return { category: '系统与网络', coverColor: 'linear-gradient(135deg, #0984e3 0%, #74b9ff 100%)' };
  }
  return { category: '技术小册', coverColor: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' };
}

// Scan books directory
export function scanBooks(booksDir: string): Book[] {
  if (!fs.existsSync(booksDir)) {
    fs.mkdirSync(booksDir, { recursive: true });
    return [];
  }

  const entries = fs.readdirSync(booksDir, { withFileTypes: true });
  const books: Book[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;

    const fullPath = path.join(booksDir, entry.name);
    if (entry.isDirectory()) {
      const bookTitle = entry.name;
      const bookId = generateId(bookTitle);
      const { category, coverColor } = detectCategory(bookTitle);

      const chapterFiles = fs.readdirSync(fullPath);
      // Group by base name (without extension)
      const chapterMap = new Map<string, { md?: string; pdf?: string }>();

      for (const file of chapterFiles) {
        if (file.startsWith('.')) continue;
        const ext = path.extname(file).toLowerCase();
        if (ext === '.md' || ext === '.markdown') {
          const base = file.replace(/\.(md|markdown)$/i, '');
          const existing = chapterMap.get(base) || {};
          existing.md = file;
          chapterMap.set(base, existing);
        } else if (ext === '.pdf') {
          const base = file.replace(/\.pdf$/i, '');
          const existing = chapterMap.get(base) || {};
          existing.pdf = file;
          chapterMap.set(base, existing);
        }
      }

      const chapters: Chapter[] = [];
      let mdCount = 0;
      let pdfCount = 0;

      for (const [baseName, files] of chapterMap.entries()) {
        const { order, cleanTitle } = extractOrderAndTitle(baseName);
        const chapterId = generateId(`${bookId}-${baseName}`);

        let format: 'md' | 'pdf' | 'both' = 'md';
        if (files.md && files.pdf) {
          format = 'both';
          mdCount++;
          pdfCount++;
        } else if (files.pdf) {
          format = 'pdf';
          pdfCount++;
        } else {
          format = 'md';
          mdCount++;
        }

        let wordCount = 0;
        let readTimeMin = 5;
        let headings: Array<{ level: number; text: string; id: string }> = [];
        let sizeBytes = 0;

        if (files.md) {
          const mdFilePath = path.join(fullPath, files.md);
          const stat = fs.statSync(mdFilePath);
          sizeBytes = stat.size;
          try {
            const content = fs.readFileSync(mdFilePath, 'utf-8');
            wordCount = content.length;
            readTimeMin = Math.max(1, Math.ceil(wordCount / 400));
            headings = extractHeadings(content);
          } catch (e) {
            console.error(`Error reading ${mdFilePath}:`, e);
          }
        } else if (files.pdf) {
          const pdfFilePath = path.join(fullPath, files.pdf);
          const stat = fs.statSync(pdfFilePath);
          sizeBytes = stat.size;
        }

        chapters.push({
          id: chapterId,
          order,
          title: cleanTitle,
          filename: files.md || files.pdf || baseName,
          format,
          mdPath: files.md ? path.join(bookTitle, files.md) : undefined,
          pdfPath: files.pdf ? path.join(bookTitle, files.pdf) : undefined,
          sizeBytes,
          wordCount,
          readTimeMin,
          headings,
        });
      }

      // Natural Sort by order, then by title
      chapters.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.title.localeCompare(b.title, 'zh-Hans-CN', { numeric: true });
      });

      const stat = fs.statSync(fullPath);

      books.push({
        id: bookId,
        title: bookTitle,
        folderName: entry.name,
        category,
        coverColor,
        chapterCount: chapters.length,
        mdCount,
        pdfCount,
        chapters,
        lastModified: stat.mtime.toISOString(),
      });
    }
  }

  // Sort books by name
  books.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'));
  return books;
}
