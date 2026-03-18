<!-- src/views/Admin.vue - 管理后台 -->
<template>
  <div class="page">
    <div class="page-title">📊 管理后台</div>

    <!-- 数据概览 -->
    <div class="stats-grid" v-if="stats">
      <div class="stat-card">
        <span class="stat-num">{{ stats.totalUsers }}</span
        ><span class="stat-label">总用户</span>
      </div>
      <div class="stat-card blue">
        <span class="stat-num">{{ stats.todayActive }}</span
        ><span class="stat-label">今日活跃</span>
      </div>
      <div class="stat-card orange">
        <span class="stat-num">{{ stats.totalRecords }}</span
        ><span class="stat-label">训练记录</span>
      </div>
      <div class="stat-card green">
        <span class="stat-num"
          >{{ Math.round(stats.totalDuration / 60)
          }}<span class="stat-unit">h</span></span
        ><span class="stat-label">总训练时长</span>
      </div>
    </div>

    <!-- Tab 切换 -->
    <div class="tabs">
      <button :class="{ active: tab === 'users' }" @click="tab = 'users'">
        👥 用户
      </button>
      <button :class="{ active: tab === 'projects' }" @click="tab = 'projects'">
        🏪 项目
      </button>
      <button :class="{ active: tab === 'daily' }" @click="tab = 'daily'">
        📈 趋势
      </button>
    </div>

    <!-- 用户列表 -->
    <div v-if="tab === 'users'" class="list">
      <div class="list-item" v-for="u in users" :key="u.id">
        <div class="list-left">
          <span class="list-name">{{ u.nickname }}</span>
          <span class="list-meta"
            >{{ u.phone }} · 注册于 {{ fmtDate(u.createdAt) }}</span
          >
        </div>
        <span class="badge" :class="u.role">{{
          u.role === 'admin' ? '管理员' : u.role === 'coach' ? '教练' : '学员'
        }}</span>
      </div>
    </div>

    <!-- 项目列表 -->
    <div v-if="tab === 'projects'" class="list">
      <div class="list-item" v-for="p in projects" :key="p.id">
        <div class="list-left">
          <span class="list-name">{{ p.name }}</span>
          <span class="list-meta"
            >{{ catLabel(p.category) }} · 👍{{ p.likes }} ⭐{{ p.favs }} 👤{{
              p.participants
            }}</span
          >
        </div>
        <button class="btn-del" @click="handleDeleteProject(p.id, p.name)">
          删除
        </button>
      </div>
    </div>

    <!-- 每日趋势 -->
    <div v-if="tab === 'daily' && dailyStats.length > 0" class="chart-card">
      <div class="chart-row" v-for="d in dailyStats" :key="d.date">
        <span class="chart-date">{{ d.date.slice(5) }}</span>
        <div class="chart-bar-wrap">
          <div
            class="chart-bar"
            :style="{ width: (d.users / maxUsers) * 100 + '%' }"
          ></div>
        </div>
        <span class="chart-val"
          >{{ d.users }}人 · {{ d.records }}条 · {{ d.avgHitRate }}%</span
        >
      </div>
    </div>
    <div v-if="tab === 'daily' && dailyStats.length === 0" class="empty">
      暂无数据
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useBilliardStore } from '../stores/billiard'

const store = useBilliardStore()
const router = useRouter()
const tab = ref('users')
const stats = ref(null)
const users = ref([])
const projects = ref([])
const dailyStats = ref([])

const maxUsers = computed(() =>
  Math.max(...dailyStats.value.map((d) => d.users), 1)
)

function catLabel(c) {
  return { basic: '基础', medium: '进阶', advanced: '高级' }[c] || c
}
function fmtDate(iso) {
  return iso ? iso.slice(0, 10) : ''
}

async function loadAdmin() {
  const token = (await supabase.auth.getSession()).data.session?.access_token
  if (!token) {
    router.push('/profile')
    return
  }
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', store.userInfo?.id)
    .single()
  if (!data || !['admin', 'coach'].includes(data.role)) {
    router.push('/')
    return
  }

  const [s, u, p, d] = await Promise.all([
    supabase.rpc('admin_stats'),
    supabase.rpc('admin_users'),
    supabase.rpc('admin_projects'),
    supabase.rpc('admin_daily_stats'),
  ])

  if (s.data && !s.data.error) stats.value = s.data
  if (u.data && !u.data.error) users.value = u.data
  if (p.data && !p.data.error) projects.value = p.data
  if (d.data && !d.data.error) dailyStats.value = d.data
}

async function handleDeleteProject(id, name) {
  if (!confirm(`确定删除「${name}」？`)) return
  await supabase.rpc('admin_delete_project', { project_id: id })
  projects.value = projects.value.filter((p) => p.id !== id)
}

onMounted(loadAdmin)
</script>

<style scoped>
.page {
  padding: 0 12px 24px;
}
.page-title {
  font-size: 22px;
  font-weight: 800;
  color: #1a1a2e;
  padding: 16px 0;
}
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}
.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.stat-card.blue {
  border-left: 4px solid #3498db;
}
.stat-card.orange {
  border-left: 4px solid #ff6b35;
}
.stat-card.green {
  border-left: 4px solid #2ecc71;
}
.stat-num {
  font-size: 28px;
  font-weight: 800;
  color: #1a1a2e;
}
.stat-unit {
  font-size: 14px;
  font-weight: 500;
}
.stat-label {
  display: block;
  font-size: 12px;
  color: #b0b0b0;
  margin-top: 4px;
}
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.tabs button {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #999;
  background: #fff;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.tabs button.active {
  background: #2ecc71;
  color: #fff;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.list-item {
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}
.list-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.list-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
}
.list-meta {
  font-size: 12px;
  color: #b0b0b0;
}
.badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 10px;
  font-weight: 600;
}
.badge.admin {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}
.badge.coach {
  background: rgba(52, 152, 219, 0.1);
  color: #3498db;
}
.badge.student {
  background: rgba(46, 204, 113, 0.1);
  color: #27ae60;
}
.btn-del {
  padding: 6px 14px;
  border: 1px solid #e74c3c;
  border-radius: 8px;
  background: #fff;
  color: #e74c3c;
  font-size: 12px;
  cursor: pointer;
}
.chart-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.chart-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.chart-date {
  font-size: 13px;
  color: #666;
  width: 40px;
}
.chart-bar-wrap {
  flex: 1;
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}
.chart-bar {
  height: 100%;
  background: linear-gradient(90deg, #2ecc71, #27ae60);
  border-radius: 10px;
  min-width: 4px;
  transition: width 0.3s;
}
.chart-val {
  font-size: 12px;
  color: #666;
  width: 120px;
  text-align: right;
}
.empty {
  text-align: center;
  padding: 40px;
  color: #b0b0b0;
  font-size: 14px;
}
</style>
