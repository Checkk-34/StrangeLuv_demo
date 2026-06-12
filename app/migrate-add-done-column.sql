-- 🐟🐸 迁移脚本：为 quiz_results 表添加 done 列
-- 在 Supabase Dashboard → SQL Editor 中运行
-- 适用于已有 quiz_results 表的项目

ALTER TABLE quiz_results
  ADD COLUMN IF NOT EXISTS done BOOLEAN NOT NULL DEFAULT false;

-- 验证迁移
SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_name = 'quiz_results' AND column_name = 'done';
