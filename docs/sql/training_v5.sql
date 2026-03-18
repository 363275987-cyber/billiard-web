-- 台球训练大师 v5.0 - Supabase 建表 SQL
-- 请在 Supabase SQL Editor 中执行

-- 1. 训练科目表
CREATE TABLE IF NOT EXISTS training_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  balls JSONB NOT NULL DEFAULT '[]',
  -- [{number: 0, x: 50, y: 25}, {number: 1, x: 30, y: 50}, ...]
  has_position_rating BOOLEAN DEFAULT false,
  success_pot_rate INTEGER DEFAULT 80,
  success_position_rate INTEGER DEFAULT 60,
  shots_per_group INTEGER NOT NULL DEFAULT 5,
  is_timed BOOLEAN DEFAULT false,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  category TEXT DEFAULT 'basic',
  is_published BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 训练组表
CREATE TABLE IF NOT EXISTS training_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  subject_id UUID REFERENCES training_subjects(id),
  session_id UUID,
  group_index INTEGER DEFAULT 1,
  shots JSONB NOT NULL DEFAULT '[]',
  -- [{potted: true, position_result: 'success'|'fail'|'pending', timestamp: '2026-03-19T...', shot_time: 12.5}, ...]
  pot_rate FLOAT,
  position_rate FLOAT,
  max_consecutive INTEGER DEFAULT 0,
  avg_shot_time FLOAT,
  total_shots INTEGER DEFAULT 0,
  total_pots INTEGER DEFAULT 0,
  total_position_success INTEGER DEFAULT 0,
  total_position_evaluated INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 3. 训练会话表
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  subject_id UUID REFERENCES training_subjects(id),
  group_ids UUID[] DEFAULT '{}',
  group_count INTEGER DEFAULT 0,
  avg_pot_rate FLOAT,
  avg_position_rate FLOAT,
  avg_shot_time FLOAT,
  best_consecutive INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 4. RLS 策略
ALTER TABLE training_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

-- 所有人可读
CREATE POLICY "Subjects are readable by everyone" ON training_subjects FOR SELECT USING (true);
CREATE POLICY "Groups are readable by everyone" ON training_groups FOR SELECT USING (true);
CREATE POLICY "Sessions are readable by everyone" ON training_sessions FOR SELECT USING (true);

-- 登录用户可创建
CREATE POLICY "Authenticated users can create subjects" ON training_subjects FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create groups" ON training_groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create sessions" ON training_sessions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 发布者可修改自己的科目
CREATE POLICY "Publishers can update their subjects" ON training_subjects FOR UPDATE USING (publisher_id = auth.uid());
CREATE POLICY "Users can update their own groups" ON training_groups FOR UPDATE USING (user_id = auth.uid());

-- 5. 使用次数 RPC（科目被训练时 +1）
CREATE OR REPLACE FUNCTION increment_subject_usage(subject_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE training_subjects SET usage_count = COALESCE(usage_count, 0) + 1 WHERE id = subject_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 索引
CREATE INDEX idx_groups_user_subject ON training_groups(user_id, subject_id);
CREATE INDEX idx_groups_session ON training_groups(session_id);
CREATE INDEX idx_sessions_user_subject ON training_sessions(user_id, subject_id);
CREATE INDEX idx_sessions_completed ON training_sessions(user_id, completed_at DESC NULLS LAST);
CREATE INDEX idx_subjects_published ON training_subjects(is_published, created_at DESC);
