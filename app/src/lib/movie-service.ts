import { getCachedMovies, type MovieItem } from './supabase';

export type { MovieItem }; // re-export for consumers

const DAILY_KEY = 'pond-daily-movies';
const MOVIES_CACHE_KEY = 'pond-movies-data';

interface DailyCache {
  date: string;        // '2026-06-11'
  ids: number[];       // 选中的 8 部 tmdb_id
}

/** 字符串种子 → 确定性伪随机数生成器 [0,1) — 两人同一天看到同一批电影 */
function createSeededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h) + seed.charCodeAt(i);
    h |= 0;
  }
  let s = h >>> 0;
  return () => {
    s |= 0;
    s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** 今天日期字符串 */
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 读 localStorage 中的每日缓存 */
function readDaily(): DailyCache | null {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/** 写每日缓存到 localStorage */
function writeDaily(date: string, ids: number[]) {
  try { localStorage.setItem(DAILY_KEY, JSON.stringify({ date, ids })); } catch { /* ignore */ }
}

/** 清空每日缓存（强制下次重新随机） */
export function clearDailyCache() {
  try { localStorage.removeItem(DAILY_KEY); localStorage.removeItem(MOVIES_CACHE_KEY); } catch { /* ignore */ }
}

/** 读 localStorage 中的完整影片数据缓存 */
function readMoviesData(date: string): MovieItem[] | null {
  try {
    const raw = localStorage.getItem(MOVIES_CACHE_KEY);
    if (!raw) return null;
    const { d, ids } = JSON.parse(raw);
    if (d !== date) return null;
    // ids 是 map: { [tmdb_id]: MovieItem }
    return Object.values(ids) as MovieItem[];
  } catch { return null; }
}

/** 写完整影片数据到 localStorage */
function writeMoviesData(date: string, movies: MovieItem[]) {
  try {
    const ids: Record<number, MovieItem> = {};
    for (const m of movies) ids[m.tmdb_id] = m;
    localStorage.setItem(MOVIES_CACHE_KEY, JSON.stringify({ d: date, ids }));
  } catch { /* ignore */ }
}

/**
 * 从 Supabase 池子中挑选 8 部电影
 * - 当天第一次调用：随机取 8 部，存 localStorage
 * - 当天后续调用：直接返回缓存（含完整影片数据，无需 Supabase 查询）
 * - 手动换一批：调用 pickRandom() 覆盖当天缓存
 * - 第二天：自动重新随机
 */
export async function getMovies(): Promise<MovieItem[]> {
  try {
    const today = todayStr();

    // 先读 localStorage 完整缓存 → 立即显示
    const dataCache = readMoviesData(today);
    if (dataCache) return dataCache;

    // 无缓存 → 走 Supabase
    const cached = await getCachedMovies('popular');
    if (!cached || !Array.isArray(cached.data) || cached.data.length === 0) return [];
    const pool: MovieItem[] = cached.data;
    const daily = readDaily();

    // 当天已有 ID 缓存 → 从池子中取出
    if (daily && daily.date === today) {
      const idSet = new Set(daily.ids);
      const selected = pool.filter((m) => idSet.has(m.tmdb_id));
      if (selected.length === daily.ids.length) {
        writeMoviesData(today, selected); // 写入完整缓存供下次秒开
        return selected;
      }
    }

    // 随机取 8 部并缓存
    return pickAndSave(pool, today);
  } catch {
    return [];
  }
}

/**
 * 从池子中随机取 8 部，覆写当天缓存
 * 公开给 🔄 按钮调用
 */
export async function pickRandom(): Promise<MovieItem[]> {
  const cached = await getCachedMovies('popular');
  if (!cached || !Array.isArray(cached.data) || cached.data.length === 0) return [];
  return pickAndSave(cached.data, todayStr(), false);
}

/** 洗牌取 8 + 写 localStorage（id 列表 + 完整数据） */
function pickAndSave(pool: MovieItem[], date: string, seeded = true): MovieItem[] {
  const rng = seeded ? createSeededRandom(date) : () => Math.random();
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const picked = shuffled.slice(0, 8);
  writeDaily(date, picked.map((m) => m.tmdb_id));
  writeMoviesData(date, picked);
  return picked;
}
