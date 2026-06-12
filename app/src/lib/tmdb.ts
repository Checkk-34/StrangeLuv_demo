import type { MovieItem } from './supabase';

const BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w342';

interface TMDBMovie {
  id: number;
  title: string;
  release_date: string;
  vote_average: number;
  poster_path: string | null;
  overview: string;
}

interface TMDBResponse {
  results: TMDBMovie[];
}

/**
 * 从 TMDb 拉取 popular 电影列表
 */
export async function fetchPopularMovies(): Promise<MovieItem[]> {
  const key = import.meta.env.VITE_TMDB_API_KEY;
  if (!key) throw new Error('VITE_TMDB_API_KEY 未配置');

  const res = await fetch(
    `${BASE}/movie/popular?api_key=${key}&language=zh-CN&region=CN&page=1`,
  );

  if (!res.ok) {
    throw new Error(`TMDb API 请求失败: ${res.status}`);
  }

  const data: TMDBResponse = await res.json();

  // 取前 8 条
  return data.results.slice(0, 8).map((m) => ({
    title: m.title,
    year: m.release_date?.slice(0, 4) || '-',
    rating: m.vote_average.toFixed(1),
    poster: m.poster_path
      ? `${IMG_BASE}${m.poster_path}`
      : '',
    overview: m.overview || '',
    tmdb_id: m.id,
  }));
}
