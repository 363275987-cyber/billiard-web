# Billiard Web V2 分析报告

> 生成时间：2026-04-05 | 分析范围：billiard-web v1/v5 全部源码

---

## 1. 项目结构

```
src/
├── main.js                          # 入口，挂载 Vue + Pinia + Router
├── App.vue                          # 根组件（底部 TabBar 导航）
├── style.css                        # 全局样式
├── lib/
│   └── supabase.js                  # Supabase 客户端初始化
├── router/
│   └── index.js                     # 路由定义（Hash 模式）
├── stores/
│   └── billiard.js                  # 核心状态管理（Pinia）— 全部业务逻辑
├── utils/
│   └── mediaStore.js                # IndexedDB 媒体存储 + 压缩工具
├── components/
│   └── BallLayoutDesigner.vue       # 球布局设计器（SVG 拖拽放置球位）
├── views/
│   ├── Home.vue                     # 首页（今日概览/登录引导）
│   ├── Training.vue                 # 实时训练计数器（全屏覆盖层）
│   ├── Record.vue                   # 手动记录训练（Keep 风格表单）
│   ├── Stats.vue                    # 数据统计（7天/本月/全部）
│   ├── Plan.vue                     # 训练计划（项目库 + 今日计划购物车）
│   ├── Profile.vue                  # 登录/注册/个人资料
│   ├── Detail.vue                   # 训练记录详情
│   ├── Square.vue                   # 训练项目广场（浏览/筛选/点赞收藏）
│   ├── SquareDetail.vue             # 广场项目详情
│   ├── Publish.vue                  # 发布训练项目
│   ├── SubjectPublish.vue           # v5 发布训练科目（含球位设计）
│   ├── SubjectTraining.vue          # v5 科目训练（分组连进计数）
│   ├── MyProjects.vue               # 我的项目（收藏+发布）
│   ├── MyStarred.vue                # 心得收藏
│   └── Admin.vue                    # 管理后台（用户/记录管理）
└── assets/
    ├── vue.svg, vite.svg, hero.png  # 静态资源
```

**技术栈**：Vue 3 + Pinia 3 + Vue Router 4 + Supabase JS 2 + Vite 8

---

## 2. 路由结构

| 路径 | 名称 | 组件 | 说明 |
|------|------|------|------|
| `/` | Home | Home.vue | 首页 |
| `/training` | Training | Training.vue | 实时训练 |
| `/record` | Record | Record.vue | 手动记录 |
| `/stats` | Stats | Stats.vue | 数据统计 |
| `/plan` | Plan | Plan.vue | 训练计划 |
| `/profile` | Profile | Profile.vue | 个人中心 |
| `/detail/:id` | Detail | Detail.vue | 记录详情 |
| `/square` | Square | Square.vue | 项目广场 |
| `/publish` | Publish | Publish.vue | 发布项目 |
| `/square-detail/:id` | SquareDetail | SquareDetail.vue | 广场详情 |
| `/my-projects` | MyProjects | MyProjects.vue | 我的项目 |
| `/my-starred` | MyStarred | MyStarred.vue | 心得收藏 |
| `/admin` | Admin | Admin.vue | 管理后台 |
| `/subject-create` | SubjectCreate | SubjectPublish.vue | v5 创建科目 |
| `/subject/:id` | SubjectTrain | SubjectTraining.vue | v5 科目训练 |

---

## 3. 数据库（Supabase）

### 3.1 SQL Schema 定义的表

| 表名 | 用途 |
|------|------|
| `profiles` | 用户资料（扩展 auth.users） |
| `projects` | 训练项目（广场） |
| `training_records` | 训练记录 |
| `favorites` | 收藏关系 |
| `likes` | 点赞关系 |
| `follows` | 教练-学员关注 |
| `homework` | 教练作业 |
| `plan_history` | 训练计划历史 |

#### profiles
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | 关联 auth.users |
| phone | TEXT UNIQUE | 手机号 |
| nickname | TEXT | 昵称（默认"球友"） |
| avatar | TEXT | 头像 |
| role | TEXT | student / coach |
| coach_code | TEXT UNIQUE | 教练邀请码 |
| created_at / updated_at | TIMESTAMPTZ | 时间戳 |

#### projects
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | |
| name | TEXT | 项目名称 |
| description | TEXT | 描述 |
| category | TEXT | basic / medium / advanced |
| publisher_id | UUID FK | 发布者 |
| likes / favs / participants | INT | 计数 |
| video_url | TEXT | 视频链接 |

#### training_records
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | |
| user_id | UUID FK | 用户 |
| project_id | UUID FK | 关联项目 |
| project_name | TEXT | 项目名冗余 |
| date | TEXT | 日期 YYYY-MM-DD |
| duration | INT | 时长（分钟） |
| total_shots | INT | 总出杆数 |
| hits | INT | 进球数 |
| hit_rate | INT | 命中率% |
| starred | BOOLEAN | 收藏标记 |
| note | TEXT | 心得笔记 |
| created_at | TIMESTAMPTZ | |

#### plan_history
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID PK | |
| user_id | UUID FK | |
| items | JSONB | 计划项目列表 |
| date | TEXT | 日期 |

#### homework / favorites / likes / follows
标准关联表，结构简单。

### 3.2 Store 代码中引用但 Schema 未定义的表

| 表名 | 说明 |
|------|------|
| `training_subjects` | v5 训练科目（含球位、计时等） |
| `training_sessions` | v5 训练会话汇总 |
| `training_groups` | v5 训练分组记录 |

#### training_subjects（从 store 代码推断）
| 字段 | 推断类型 | 说明 |
|------|----------|------|
| id | UUID PK | |
| name | TEXT | 科目名 |
| description | TEXT | 描述 |
| balls | JSONB | 球位布局数组 |
| has_position_rating | BOOLEAN | 是否评分走位 |
| success_pot_rate | INT | 进球达标率 |
| success_position_rate | INT | 走位达标率 |
| shots_per_group | INT | 每组球数 |
| is_timed | BOOLEAN | 是否计时 |
| difficulty | TEXT | beginner 等 |
| category | TEXT | 分类 |
| publisher_id | UUID FK | |
| usage_count | INT | 使用次数 |
| is_published | BOOLEAN | 是否发布 |

#### training_sessions（从 store 代码推断）
| 字段 | 推断类型 | 说明 |
|------|----------|------|
| id | UUID PK | |
| user_id | UUID FK | |
| subject_id | UUID FK | |
| group_ids | UUID[] | 分组 ID 列表 |
| group_count | INT | 分组数 |
| avg_pot_rate | NUMERIC | 平均进球率 |
| avg_position_rate | NUMERIC | 平均走位率 |
| avg_shot_time | NUMERIC | 平均每杆时间 |
| best_consecutive | INT | 最佳连进 |

#### training_groups（从 store 代码推断）
| 字段 | 推断类型 | 说明 |
|------|----------|------|
| id | UUID PK | |
| user_id | UUID FK | |
| subject_id | UUID FK | |
| session_id | UUID FK | |
| group_index | INT | 第几组 |
| shots | JSONB | 每杆记录数组 |
| pot_rate | NUMERIC | 进球率 |
| position_rate | NUMERIC | 走位率 |
| max_consecutive | INT | 最大连进 |
| avg_shot_time | NUMERIC | 平均出杆时间 |
| total_shots / total_pots | INT | 汇总 |
| total_position_success / total_position_evaluated | INT | 走位评分 |
| started_at / completed_at | TIMESTAMPTZ | 时间 |

---

## 4. 现有功能描述

### 核心页面

| 页面 | 功能 |
|------|------|
| **Home** | 首页仪表盘：今日概览（训练时长、命中率、项目数、连续天数），历史记录列表 |
| **Training** | 全屏实时训练：选择项目 → 计时器 + 进球/失误计数 → 暂停/继续 → 结束生成记录 |
| **Record** | 手动记录表单：选项目 → 填数据（进球/失误/时长）→ 添加心得 → 保存 |
| **Stats** | 数据统计：7天/本月/全部，命中率趋势图、项目对比、计划完成率 |
| **Plan** | 训练计划：项目库（分类浏览）+ 购物车式今日计划 + 推荐方案 + 历史计划 |

### 社区页面

| 页面 | 功能 |
|------|------|
| **Square** | 项目广场：按难度筛选、点赞、收藏、参与 |
| **SquareDetail** | 项目详情：视频/图片、统计数据、收藏/点赞 |
| **Publish** | 发布训练项目：名称/描述/难度/视频 |
| **MyProjects** | 我的项目：收藏列表 + 发布列表 |
| **MyStarred** | 心得收藏：标星的训练记录列表 |

### v5 科目训练

| 页面 | 功能 |
|------|------|
| **SubjectTraining** | 选择科目 → 分组训练（每组 N 杆，记录进球+走位+计时+连进） → 汇总 |
| **SubjectPublish** | 创建科目：名称/描述/球位设计器（SVG 拖拽）/参数设置 |

### 其他

| 页面 | 功能 |
|------|------|
| **Profile** | 登录/注册（手机号+密码）、个人资料编辑 |
| **Detail** | 单条记录详情：命中率环形图、数据对比 |
| **Admin** | 管理后台：用户列表、训练记录、数据概览 |

### 组件/工具

| 组件 | 功能 |
|------|------|
| **BallLayoutDesigner** | SVG 球桌，支持拖拽放置目标球和母球位置 |
| **mediaStore** | IndexedDB 封装，保存/读取/压缩图片视频文件 |

---

## 5. V2 可复用分析

### ✅ 直接复用

| 项目 | 说明 |
|------|------|
| **Supabase 客户端配置** | `lib/supabase.js` 直接复用 |
| **认证体系** | 手机号+密码登录、profiles 表结构、注册/登录逻辑 |
| **RLS 安全策略** | Row Level Security 模式值得保留 |
| **日期工具函数** | `getToday()`、`formatDate()`、`getPrevDay()` |
| **IndexedDB 媒体存储** | `mediaStore.js` 压缩+存储方案 |
| **BallLayoutDesigner** | 球位设计器组件，v2 可直接用 |
| **训练计时器核心** | `startTraining/endTraining/pauseTraining/resumeTraining` + 暂停时长计算 |
| **实时击球记录** | `recordShot/recordBatchShots/undoShot/getLiveStats` — 完美匹配 v2 批量进球+失误需求 |

### ✅ 改造后复用

| 项目 | 改造内容 |
|------|----------|
| **training_records 表** | 增加 `consecutive_max`（最大连进）、`groups`（分组数据 JSONB）、`session_type`（科目/自由/事件计时） |
| **training_subjects 表** | 可直接复用，增加 `type` 字段区分台球科目/专注力训练等 |
| **training_groups 表** | 直接复用分组记录模型 |
| **training_sessions 表** | 直接复用会话汇总模型 |
| **Stats 统计逻辑** | `getStats()` 函数框架复用，扩展支持分组/连进统计 |
| **Home 首页仪表盘** | 今日概览框架复用，卡片内容替换为 v2 指标 |
| **Vue Router 结构** | 框架复用，路由重定义 |

### ❌ 不复用（V2 替代方案）

| 项目 | 原因 |
|------|------|
| **projects 广场体系** | v2 不需要社区广场，聚焦个人训练 |
| **favorites/likes/follows** | 社交功能不做 |
| **homework 教练作业** | v2 暂不需要教练体系 |
| **Plan 购物车模式** | v2 用三级笔记系统替代训练计划 |
| **Record 手动记录页** | v2 用实时计数器统一入口 |
| **Admin 管理后台** | v2 暂不需要 |

---

## 6. V2 架构建议

### 数据模型设计方向

```
training_sessions (会话)
├── id, user_id, type (billiard/focus/custom)
├── started_at, ended_at, total_duration
├── summary (自动生成的训练日志)
└── notes[] (关联三级笔记)

training_groups (分组)
├── id, session_id, group_index
├── shots (JSONB: [{hit, time, position_rating}])
├── pot_rate, max_consecutive, avg_shot_time
└── started_at, completed_at

training_subjects (科目模板，复用 v5)
├── 复用现有结构，增加 type 字段

notes (三级笔记)
├── id, user_id, session_id (可选)
├── scope: global / project / group
├── project_id (可选，关联科目)
├── content, tags
└── created_at, updated_at

event_timers (通用事件计时)
├── id, session_id
├── event_type (distraction/focus_break/etc)
├── timestamp, duration
└── note
```

### 页面规划

| 页面 | 对应 v1 来源 | 改造要点 |
|------|-------------|----------|
| 首页仪表盘 | Home.vue | 展示最近训练、连进记录、笔记 |
| 训练（实时计数） | Training.vue + SubjectTraining.vue | 统一入口，支持科目训练+自由模式 |
| 笔记系统 | 新建 | 三级：全局/项目/分组 |
| 事件计时 | 新建 | 分神间隔等自定义事件 |
| 训练日志 | 新建 | 自动生成，基于训练数据 |
| 历史记录 | Stats.vue + Detail.vue | 按时间浏览，支持筛选 |
| 设置 | Profile.vue | 登录/个人资料 |

---

## 7. 总结

v1 项目代码质量不错，架构清晰（Pinia 单 Store 集中管理），以下核心价值可直接迁移到 v2：

1. **认证 + RLS** — 完整的用户体系
2. **实时计数器** — `recordBatchShots/recordShot` 正好是 v2 批量进球+失误的核心
3. **分组训练模型** — `training_groups/sessions/subjects` 三表结构可直接复用
4. **训练计时** — 暂停/恢复/时长计算逻辑完善
5. **球位设计器** — SVG 组件可直接用

v2 主要工作是：去掉社区模块 → 新增三级笔记系统 → 新增通用事件计时 → 训练日志自动生成。数据模型扩展优先于前端重构。
