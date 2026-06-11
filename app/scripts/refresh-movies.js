/**
 * 🎬 刷新电影缓存脚本
 * =====================
 * 本地运行：cd app && npm run refresh-movies（需要挂 VPN）
 * GitHub Actions：自动触发，无需 VPN
 *
 * 抓取 TMDb popular 榜单 5 页（~100 部），写入 Supabase movie_cache，
 * 后续 App 从此缓存中随机取 8 部展示。
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---- 1. 读取环境变量 ----
// 优先用 process.env（GitHub Actions 传参），fallback 到 .env 文件（本地开发）
function getEnv(key) {
  if (process.env[key]) return process.env[key].trim();
  try {
    const envPath = resolve(__dirname, '..', '.env');
    const envRaw = readFileSync(envPath, 'utf-8');
    const m = envRaw.match(new RegExp(`^${key}=(.+)`, 'm'));
    return m ? m[1].trim() : null;
  } catch {
    return null;
  }
}

const TMDB_KEY = getEnv('VITE_TMDB_API_KEY');
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

if (!TMDB_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ 缺少必要的环境变量，请检查：');
  console.error('   VITE_TMDB_API_KEY: ' + (TMDB_KEY ? '✅' : '❌'));
  console.error('   VITE_SUPABASE_URL: ' + (SUPABASE_URL ? '✅' : '❌'));
  console.error('   VITE_SUPABASE_ANON_KEY: ' + (SUPABASE_ANON_KEY ? '✅' : '❌'));
  process.exit(1);
}

// ---- 2. 初始化 Supabase ----
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- 3. 抓 TMDb popular（5 页 = ~100 部）----
const IMG_BASE = 'https://image.tmdb.org/t/p/w342';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 秒

async function fetchWithRetry(page, attempt = 1) {
  const url = `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&language=zh-CN&region=CN&page=${page}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.results.map((m) => ({
    title: m.title,
    year: (m.release_date || '').slice(0, 4) || '-',
    rating: m.vote_average ? m.vote_average.toFixed(1) : '0',
    poster: m.poster_path ? `${IMG_BASE}${m.poster_path}` : '',
    overview: m.overview || '',
    tmdb_id: m.id,
  }));
}

async function fetchTMDbPage(page) {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const movies = await fetchWithRetry(page, i + 1);
      if (i > 0) console.log(`    第 ${page} 页重试 ${i} 次后成功`);
      return movies;
    } catch (e) {
      if (i < MAX_RETRIES - 1) {
        console.warn(`   ⚠ 第 ${page} 页失败 (${e.message})，${RETRY_DELAY / 1000}s 后重试...`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY));
      } else {
        throw e;
      }
    }
  }
}

async function refresh() {
  console.log('🔄 开始爬取 TMDb popular...');
  const start = Date.now();

  let allMovies = [];
  for (let p = 1; p <= 5; p++) {
    try {
      const movies = await fetchTMDbPage(p);
      allMovies = allMovies.concat(movies);
      console.log(`   ✓ 第 ${p} 页: ${movies.length} 部`);
    } catch (e) {
      console.warn(`   ✗ 第 ${p} 页失败（已重试 ${MAX_RETRIES} 次）: ${e.message}`);
    }
    if (p < 5) await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n📦 共抓取 ${allMovies.length} 部电影，写入 Supabase...`);

  // 去重
  const seen = new Set();
  const unique = allMovies.filter((m) => {
    if (seen.has(m.tmdb_id)) return false;
    seen.add(m.tmdb_id);
    return true;
  });

  // 覆盖写入
  const { error: delErr } = await sb.from('movie_cache').delete().eq('source', 'popular');
  if (delErr) {
    console.error('❌ 删除旧缓存失败:', delErr.message);
    process.exit(1);
  }

  const { error: insErr } = await sb.from('movie_cache').insert({
    source: 'popular',
    data: unique,
    updated_at: new Date().toISOString(),
  });
  if (insErr) {
    console.error('❌ 写入缓存失败:', insErr.message);
    process.exit(1);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n✅ 完成！${unique.length} 部电影已写入 Supabase（去重后）`);
  console.log(`⏱  耗时 ${elapsed}s`);
}

refresh().catch((e) => {
  console.error('❌ 脚本异常:', e);
  process.exit(1);
});
