-- Supabase SQL setup — 在 Supabase Dashboard → SQL Editor 中运行
-- 创建电影缓存表

CREATE TABLE IF NOT EXISTS movie_cache (
  source TEXT PRIMARY KEY,          -- 数据源标识，如 'popular'
  data JSONB NOT NULL,              -- 电影数据数组
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 允许匿名查询（需配合 Row Level Security）
ALTER TABLE movie_cache ENABLE ROW LEVEL SECURITY;

-- 允许所有用户读取
CREATE POLICY "允许读取缓存" ON movie_cache
  FOR SELECT USING (true);

-- 允许所有用户写入（upsert）
CREATE POLICY "允许写入缓存" ON movie_cache
  FOR ALL USING (true)
  WITH CHECK (true);
