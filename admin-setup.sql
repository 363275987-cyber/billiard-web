-- 台球训练记录 - 管理后台 SQL（在 Supabase Dashboard → SQL Editor 执行）

-- ===== 1. 扩展 role 约束，增加 admin 角色 =====
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student', 'coach', 'admin'));

-- ===== 2. 管理后台 RPC 函数 =====

-- 概览统计
CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS JSON AS $$
DECLARE
  total_users INT;
  today_active INT;
  total_records INT;
  total_duration BIGINT;
BEGIN
  SELECT COUNT(*) INTO total_users FROM public.profiles;
  SELECT COUNT(DISTINCT user_id) INTO today_active
    FROM public.training_records WHERE date = to_char(NOW() AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD');
  SELECT COUNT(*), COALESCE(SUM(duration), 0) INTO total_records, total_duration FROM public.training_records;
  RETURN json_build_object(
    'totalUsers', total_users,
    'todayActive', today_active,
    'totalRecords', total_records,
    'totalDuration', total_duration
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 用户列表
CREATE OR REPLACE FUNCTION public.admin_users()
RETURNS TABLE(
  id UUID, phone TEXT, nickname TEXT, role TEXT, created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.phone, p.nickname, p.role, p.created_at
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 项目列表
CREATE OR REPLACE FUNCTION public.admin_projects()
RETURNS TABLE(
  id UUID, name TEXT, description TEXT, category TEXT,
  likes INT, favs INT, participants INT, publisher_id UUID, created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.description, p.category,
         p.likes, p.favs, p.participants, p.publisher_id, p.created_at
  FROM public.projects p
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 删除项目（级联删除相关数据）
CREATE OR REPLACE FUNCTION public.admin_delete_project(project_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.favorites WHERE project_id = project_id;
  DELETE FROM public.likes WHERE project_id = project_id;
  DELETE FROM public.training_records WHERE project_id = project_id;
  DELETE FROM public.projects WHERE id = project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 每日趋势（最近 14 天）
CREATE OR REPLACE FUNCTION public.admin_daily_stats()
RETURNS TABLE(
  date TEXT, users INT, records INT, avg_hit_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tr.date,
    COUNT(DISTINCT tr.user_id) AS users,
    COUNT(*) AS records,
    CASE WHEN SUM(tr.total_shots) > 0
      THEN ROUND(SUM(tr.hits)::numeric / SUM(tr.total_shots)::numeric * 100, 1)
      ELSE 0
    END AS avg_hit_rate
  FROM public.training_records tr
  WHERE tr.date >= to_char((NOW() AT TIME ZONE 'Asia/Shanghai') - INTERVAL '13 days', 'YYYY-MM-DD')
  GROUP BY tr.date
  ORDER BY tr.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 3. 给测试账号设置 admin 角色 =====
-- 13888888888 对应的 email 是 13888888888@billiard.app
-- 需要先查到 user id，再更新 role
UPDATE public.profiles
SET role = 'admin'
WHERE phone = '13888888888';
