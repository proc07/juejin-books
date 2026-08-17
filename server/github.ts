import fs from 'fs';
import path from 'path';
import { RemoteBook, DownloadTask, RepoConfig } from './types';
import { detectCategory } from './scanner';

const DEFAULT_REPO = 'https://github.com/lm-rebooter/NuggetsBooklet.git';

export class GitHubService {
  private configPath: string;
  private cachePath: string;
  private booksDir: string;
  private config: RepoConfig;
  private tasks: Map<string, DownloadTask> = new Map();
  private onBookDownloadedCallback?: () => void;

  constructor(dataDir: string, booksDir: string, onBookDownloaded?: () => void) {
    this.booksDir = booksDir;
    this.onBookDownloadedCallback = onBookDownloaded;
    this.configPath = path.join(dataDir, 'repo-config.json');
    this.cachePath = path.join(dataDir, 'remote-cache.json');

    this.config = this.loadConfig();
  }

  public parseRepoUrl(url: string): { owner: string; repo: string } {
    const cleanUrl = url.trim().replace(/\.git$/, '');
    const match = cleanUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/) || cleanUrl.match(/^([^\/]+)\/([^\/]+)$/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
    return { owner: 'lm-rebooter', repo: 'NuggetsBooklet' };
  }

  private loadConfig(): RepoConfig {
    const { owner, repo } = this.parseRepoUrl(DEFAULT_REPO);
    const defaultConfig: RepoConfig = {
      repoUrl: DEFAULT_REPO,
      owner,
      repo,
      branch: 'master',
      token: '',
      useMirror: true,
      mirrorPrefix: 'https://ghfast.top/',
    };

    if (fs.existsSync(this.configPath)) {
      try {
        const raw = fs.readFileSync(this.configPath, 'utf-8');
        return { ...defaultConfig, ...JSON.parse(raw) };
      } catch (e) {
        console.error('Failed to load repo config:', e);
      }
    }

    fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    return defaultConfig;
  }

  public getConfig(): RepoConfig {
    return this.config;
  }

  public updateConfig(newConfig: Partial<RepoConfig>): RepoConfig {
    if (newConfig.repoUrl && newConfig.repoUrl !== this.config.repoUrl) {
      const { owner, repo } = this.parseRepoUrl(newConfig.repoUrl);
      newConfig.owner = owner;
      newConfig.repo = repo;
    }
    this.config = { ...this.config, ...newConfig };
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    return this.config;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': 'Antigravity-Book-Reader',
      'Accept': 'application/vnd.github.v3+json',
    };
    if (this.config.token && this.config.token.trim()) {
      headers['Authorization'] = `token ${this.config.token.trim()}`;
    }
    return headers;
  }

  // Fetch all directory names from remote repository
  public async getRemoteBooks(forceRefresh = false): Promise<RemoteBook[]> {
    // Check local cache
    if (!forceRefresh && fs.existsSync(this.cachePath)) {
      try {
        const raw = fs.readFileSync(this.cachePath, 'utf-8');
        const cached = JSON.parse(raw) as RemoteBook[];
        return this.enrichWithLocalStatus(cached);
      } catch (e) {
        console.error('Failed to parse remote cache:', e);
      }
    }

    const { owner, repo, branch } = this.config;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents?ref=${branch}`;

    try {
      const res = await fetch(apiUrl, { headers: this.getHeaders() });
      if (!res.ok) {
        throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
      }

      const items = (await res.json()) as Array<{
        name: string;
        path: string;
        sha: string;
        size: number;
        type: string;
      }>;

      // Filter only directories (each directory is a book/course)
      const dirs = items.filter(item => item.type === 'dir' && !item.name.startsWith('.'));

      const remoteBooks: RemoteBook[] = dirs.map(dir => {
        const { category, coverColor } = detectCategory(dir.name);
        return {
          name: dir.name,
          path: dir.path,
          sha: dir.sha,
          size: dir.size,
          category,
          coverColor,
          isDownloaded: false,
        };
      });

      // Sort alphabetically
      remoteBooks.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));

      // Save to cache
      fs.writeFileSync(this.cachePath, JSON.stringify(remoteBooks, null, 2), 'utf-8');

      return this.enrichWithLocalStatus(remoteBooks);
    } catch (e: any) {
      console.error('Failed to fetch remote books from GitHub API:', e);
      // Fallback to cache if available
      if (fs.existsSync(this.cachePath)) {
        const raw = fs.readFileSync(this.cachePath, 'utf-8');
        return this.enrichWithLocalStatus(JSON.parse(raw));
      }
      throw e;
    }
  }

  private enrichWithLocalStatus(remoteBooks: RemoteBook[]): RemoteBook[] {
    return remoteBooks.map(book => {
      const targetLocalPath = path.join(this.booksDir, book.name);
      const isDownloaded = fs.existsSync(targetLocalPath);
      return {
        ...book,
        isDownloaded,
      };
    });
  }

  // Get current active or recent tasks
  public getTasks(): DownloadTask[] {
    return Array.from(this.tasks.values()).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  // Start downloading a specific booklet folder on demand
  public async startDownload(
    bookName: string,
    options: { includePdf?: boolean; includeAudio?: boolean; useMirror?: boolean } = {}
  ): Promise<DownloadTask> {
    const existingTask = Array.from(this.tasks.values()).find(
      t => t.bookName === bookName && (t.status === 'downloading' || t.status === 'pending')
    );
    if (existingTask) {
      return existingTask;
    }

    const taskId = `dl-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const task: DownloadTask = {
      id: taskId,
      bookName,
      status: 'pending',
      progress: 0,
      currentFile: '正在获取章节文件清单...',
      totalFiles: 0,
      downloadedFiles: 0,
      startedAt: new Date().toISOString(),
    };

    this.tasks.set(taskId, task);

    // Execute download asynchronously
    this.executeDownload(task, options).catch(err => {
      task.status = 'failed';
      task.error = err.message || '下载失败';
      console.error(`Task ${taskId} failed:`, err);
    });

    return task;
  }

  private async executeDownload(
    task: DownloadTask,
    options: { includePdf?: boolean; includeAudio?: boolean; useMirror?: boolean }
  ): Promise<void> {
    const { owner, repo, branch } = this.config;
    const { includePdf = true, includeAudio = false } = options;

    task.status = 'downloading';
    task.currentFile = '正在获取章节目录...';

    // 1. Fetch directory contents for this booklet
    const folderUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(task.bookName)}?ref=${branch}`;
    const res = await fetch(folderUrl, { headers: this.getHeaders() });
    if (!res.ok) {
      throw new Error(`无法获取目录文件列表: ${res.status} ${res.statusText}`);
    }

    const files = (await res.json()) as Array<{
      name: string;
      path: string;
      download_url: string;
      type: string;
      size: number;
    }>;

    // Filter files: always download .md/.markdown; optionally .pdf; skip .mp3/.zip unless requested
    const targetFiles = files.filter(f => {
      if (f.type !== 'file') return false;
      const ext = path.extname(f.name).toLowerCase();
      if (ext === '.md' || ext === '.markdown') return true;
      if (ext === '.pdf') return includePdf;
      if (ext === '.mp3' || ext === '.wav') return includeAudio;
      if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.svg' || ext === '.gif') return true;
      return false;
    });

    if (targetFiles.length === 0) {
      throw new Error('未在该小册目录中找到可下载的文件');
    }

    task.totalFiles = targetFiles.length;
    task.downloadedFiles = 0;

    // Create target folder in books/
    const targetFolder = path.join(this.booksDir, task.bookName);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const useMirror = options.useMirror ?? this.config.useMirror;
    const mirrors = [
      this.config.mirrorPrefix || 'https://ghfast.top/',
      'https://mirror.ghproxy.com/',
      'https://ghproxy.net/',
      '', // direct
    ];

    const downloadSingleFile = async (file: typeof targetFiles[0]): Promise<void> => {
      let rawUrl = file.download_url;
      if (!rawUrl) {
        rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${encodeURIComponent(task.bookName)}/${encodeURIComponent(file.name)}`;
      }

      let downloaded = false;
      let lastErr: any = null;

      const mirrorList = useMirror ? mirrors : [''];

        for (const m of mirrorList) {
        const fetchUrl = m ? `${m}${rawUrl}` : rawUrl;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000);

          const fileRes = await fetch(fetchUrl, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          });
          clearTimeout(timeoutId);

          if (fileRes.ok) {
            const arrayBuffer = await fileRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const filePath = path.join(targetFolder, file.name);
            fs.writeFileSync(filePath, buffer);
            downloaded = true;
            break;
          }
        } catch (e) {
          lastErr = e;
        }
      }

      if (!downloaded) {
        throw new Error(`下载文件 ${file.name} 失败: ${lastErr?.message || '网络连接超时'}`);
      }

      task.downloadedFiles += 1;
      task.progress = Math.round((task.downloadedFiles / task.totalFiles) * 100);
      task.currentFile = file.name;
    };

    // Download in parallel with concurrency = 3
    const concurrency = 3;
    for (let i = 0; i < targetFiles.length; i += concurrency) {
      const chunk = targetFiles.slice(i, i + concurrency);
      await Promise.all(chunk.map(f => downloadSingleFile(f)));
    }

    task.status = 'completed';
    task.progress = 100;
    task.currentFile = '下载完成！已自动添加到书架';
    task.completedAt = new Date().toISOString();

    // Trigger local scan
    if (this.onBookDownloadedCallback) {
      this.onBookDownloadedCallback();
    }
  }

  // Delete local downloaded book folder
  public deleteLocalBook(bookName: string): boolean {
    const targetFolder = path.join(this.booksDir, bookName);
    if (fs.existsSync(targetFolder)) {
      fs.rmSync(targetFolder, { recursive: true, force: true });
      if (this.onBookDownloadedCallback) {
        this.onBookDownloadedCallback();
      }
      return true;
    }
    return false;
  }
}
