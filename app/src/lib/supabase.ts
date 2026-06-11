import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key);
  }
  return client;
}

export interface MovieCacheRow {
  source: string;
  data: MovieItem[];
  updated_at: string;
}

export interface MovieItem {
  title: string;
  year: string;
  rating: string;
  poster: string;       // 完整 TMDb 图片 URL
  overview: string;     // 简介（备用）
  tmdb_id: number;
}

const TABLE = 'movie_cache';

/**
 * 从 Supabase 读缓存
 */
export async function getCachedMovies(source: string): Promise<MovieCacheRow | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb
    .from(TABLE)
    .select('*')
    .eq('source', source)
    .maybeSingle();
  return data as MovieCacheRow | null;
}

/**
 * 写入缓存到 Supabase（upsert by source）
 */
export async function setCachedMovies(source: string, movies: MovieItem[]): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from(TABLE).upsert(
    { source, data: movies, updated_at: new Date().toISOString() },
    { onConflict: 'source' },
  );
}
