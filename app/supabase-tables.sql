-- 🐟🐸 池塘奇遇 — 数据表
-- 在 Supabase Dashboard → SQL Editor 中运行

-- =============================================
-- 1. 用户表
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,            -- 'fish' | 'frog'
  display_name TEXT NOT NULL,           -- '小鱼' | '蛙蛙'
  password_hash TEXT NOT NULL,          -- SHA-256 hex
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- 登录时需要查询用户，允许所有读取
CREATE POLICY "允许读取用户" ON users FOR SELECT USING (true);

-- =============================================
-- 2. 活动清单表（同步给双方看）
-- =============================================
CREATE TABLE IF NOT EXISTS activities (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,                -- 'fish' | 'frog'
  text TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual', -- 'wheel' | 'slots' | 'quiz' | 'manual'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "允许读写活动" ON activities
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 3. 默契问卷结果表
-- =============================================
CREATE TABLE IF NOT EXISTS quiz_results (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date TEXT NOT NULL,                    -- '2026-06-11'
  user_id TEXT NOT NULL,                 -- 'fish' | 'frog'
  picks JSONB NOT NULL,                  -- ["看电影","吃火锅"]
  done BOOLEAN NOT NULL DEFAULT false,   -- 是否已完成（双方都完成后自动清理）
  UNIQUE (date, user_id)
);

ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "允许读写问卷" ON quiz_results
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 4. 弹幕留言表
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,                 -- 'fish' | 'frog'
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "允许读写留言" ON messages
  FOR ALL USING (true) WITH CHECK (true);
