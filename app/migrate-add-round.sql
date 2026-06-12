-- 🐟🐸 迁移脚本：为 quiz_results 表添加 round 和 done 列 + 更新唯一约束
-- 在 Supabase Dashboard → SQL Editor 中运行

-- 1. 添加 round 列（已有则跳过）
ALTER TABLE quiz_results
  ADD COLUMN IF NOT EXISTS round INTEGER NOT NULL DEFAULT 1;

-- 2. 添加 done 列（已有则跳过）
ALTER TABLE quiz_results
  ADD COLUMN IF NOT EXISTS done BOOLEAN NOT NULL DEFAULT false;

-- 3. 删除旧的 UNIQUE 约束（名称为自动生成）
ALTER TABLE quiz_results
  DROP CONSTRAINT IF EXISTS quiz_results_date_user_id_key;

-- 4. 添加新的 UNIQUE 约束（包含 round）
ALTER TABLE quiz_results
  ADD CONSTRAINT quiz_results_date_user_id_round_key
  UNIQUE (date, user_id, round);

-- 5. 验证迁移
SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_name = 'quiz_results'
  ORDER BY ordinal_position;
