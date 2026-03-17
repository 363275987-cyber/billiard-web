-- 台球训练记录 - Supabase 数据库初始化
-- 在 Supabase 控制台 → SQL Editor 中执行此文件

-- ===== 1. 创建表 =====

-- 用户资料（Supabase Auth 自带 auth.users，这是扩展信息）
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  phone TEXT UNIQUE,
  nickname TEXT DEFAULT '球友',
  avatar TEXT DEFAULT '',
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'coach')),
  coach_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 训练项目（广场）
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'basic' CHECK (category IN ('basic', 'medium', 'advanced')),
  publisher_id UUID REFERENCES public.profiles(id),
  likes INT DEFAULT 0,
  favs INT DEFAULT 0,
  participants INT DEFAULT 0,
  video_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 训练记录
CREATE TABLE IF NOT EXISTS public.training_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  project_id UUID REFERENCES public.projects(id),
  project_name TEXT NOT NULL,
  date TEXT NOT NULL,
  duration INT DEFAULT 0,
  total_shots INT DEFAULT 0,
  hits INT DEFAULT 0,
  hit_rate INT DEFAULT 0,
  starred BOOLEAN DEFAULT FALSE,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 收藏
CREATE TABLE IF NOT EXISTS public.favorites (
  user_id UUID REFERENCES public.profiles(id),
  project_id UUID REFERENCES public.projects(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, project_id)
);

-- 点赞
CREATE TABLE IF NOT EXISTS public.likes (
  user_id UUID REFERENCES public.profiles(id),
  project_id UUID REFERENCES public.projects(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, project_id)
);

-- 关注关系（教练-学员）
CREATE TABLE IF NOT EXISTS public.follows (
  coach_id UUID REFERENCES public.profiles(id),
  student_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (coach_id, student_id)
);

-- 教练作业
CREATE TABLE IF NOT EXISTS public.homework (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES public.profiles(id) NOT NULL,
  student_id UUID REFERENCES public.profiles(id) NOT NULL,
  note TEXT DEFAULT '',
  items JSONB DEFAULT '[]',
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 训练计划历史
CREATE TABLE IF NOT EXISTS public.plan_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  items JSONB DEFAULT '[]',
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 2. 索引 =====
CREATE INDEX IF NOT EXISTS idx_training_records_user_date ON public.training_records(user_id, date);
CREATE INDEX IF NOT EXISTS idx_training_records_date ON public.training_records(date);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_publisher ON public.projects(publisher_id);
CREATE INDEX IF NOT EXISTS idx_homework_student ON public.homework(student_id);
CREATE INDEX IF NOT EXISTS idx_homework_coach ON public.homework(coach_id);

-- ===== 3. Row Level Security =====
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_history ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- projects（所有人可读，登录可发）
CREATE POLICY "projects_public_read" ON public.projects FOR SELECT USING (true);
CREATE POLICY "projects_auth_insert" ON public.projects FOR INSERT WITH CHECK (auth.uid() = publisher_id);
CREATE POLICY "projects_owner_update" ON public.projects FOR UPDATE USING (auth.uid() = publisher_id);

-- training_records（只能操作自己的）
CREATE POLICY "records_self_read" ON public.training_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "records_self_insert" ON public.training_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "records_self_update" ON public.training_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "records_self_delete" ON public.training_records FOR DELETE USING (auth.uid() = user_id);

-- favorites
CREATE POLICY "favs_self_all" ON public.favorites FOR ALL USING (auth.uid() = user_id);

-- likes
CREATE POLICY "likes_self_all" ON public.likes FOR ALL USING (auth.uid() = user_id);

-- follows
CREATE POLICY "follows_related_all" ON public.follows FOR ALL USING (auth.uid() = coach_id OR auth.uid() = student_id);
CREATE POLICY "follows_related_read" ON public.follows FOR SELECT USING (auth.uid() = coach_id OR auth.uid() = student_id);

-- homework（教练看自己发的，学员看收到的）
CREATE POLICY "homework_related_read" ON public.homework FOR SELECT USING (auth.uid() = coach_id OR auth.uid() = student_id);
CREATE POLICY "homework_coach_insert" ON public.homework FOR INSERT WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "homework_student_update" ON public.homework FOR UPDATE USING (auth.uid() = student_id);

-- plan_history（只能操作自己的）
CREATE POLICY "plan_history_self_all" ON public.plan_history FOR ALL USING (auth.uid() = user_id);

-- ===== 4. 自动创建 profile 的触发器 =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, nickname)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'nickname',
      '球友'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ===== 5. 插入预设广场项目（种子数据） =====
INSERT INTO public.projects (name, description, category, publisher_id, likes, favs, participants) VALUES
  ('中袋直线球', '最基础的中袋练习，保持出杆稳定性。每次练习50杆以上，目标命中率70%。', 'basic', NULL, 328, 156, 1243),
  ('五分点中袋', '从五分点位置练习中袋进球，锻炼角度控制能力。', 'basic', NULL, 256, 98, 876),
  ('远台薄切', '远距离薄切球练习，考验出杆精准度和力度控制。建议从简单角度开始。', 'medium', NULL, 189, 87, 654),
  ('K球分离练习', '练习K球后的母球走位，提高连续得分能力。', 'medium', NULL, 145, 72, 432),
  ('安全球防守', '练习将母球送到安全位置，不给对手留下进球机会。', 'medium', NULL, 134, 65, 398),
  ('连续围球', '斯诺克连续得分围球练习，从红黑开始尽量连续得分。', 'advanced', NULL, 267, 142, 567),
  ('九球走位', '九球专项走位训练，练习母球绕台走位，提高连续清台能力。', 'advanced', NULL, 198, 89, 445),
  ('高低杆进阶', '高低杆精确控制练习，包括跟进球、拉回球、定球等高级杆法。', 'advanced', NULL, 176, 93, 523)
ON CONFLICT DO NOTHING;
