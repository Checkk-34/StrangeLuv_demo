import { getCachedMovies, type MovieItem } from './supabase';

export type { MovieItem }; // re-export for consumers

const DAILY_KEY = 'pond-daily-movies';

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
  try { localStorage.removeItem(DAILY_KEY); } catch { /* ignore */ }
}

/**
 * 从 Supabase 池子中挑选 8 部电影
 * - 当天第一次调用：随机取 8 部，存 localStorage
 * - 当天后续调用：直接返回缓存的 8 部（不变）
 * - 手动换一批：调用 pickRandom() 覆盖当天缓存
 * - 第二天：自动重新随机
 */
export async function getMovies(): Promise<MovieItem[]> {
  try {
    const cached = await getCachedMovies('popular');
    if (!cached || !Array.isArray(cached.data) || cached.data.length === 0) return [];
    const pool: MovieItem[] = cached.data;
    const today = todayStr();
    const daily = readDaily();

    // 当天已有缓存 → 按缓存的 tmdb_id 取出，不移位
    if (daily && daily.date === today) {
      const idSet = new Set(daily.ids);
      const selected = pool.filter((m) => idSet.has(m.tmdb_id));
      // 若缓存中的 ID 在最新池子里都找得到，直接返回
      if (selected.length === daily.ids.length) return selected;
      // 池子变了（管理员刚刚 refresh-movies 了），回退到重新随机
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

/** 洗牌取 8 + 写 localStorage */
function pickAndSave(pool: MovieItem[], date: string, seeded = true): MovieItem[] {
  const rng = seeded ? createSeededRandom(date) : () => Math.random();
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const picked = shuffled.slice(0, 8);
  writeDaily(date, picked.map((m) => m.tmdb_id));
  return picked;
}
