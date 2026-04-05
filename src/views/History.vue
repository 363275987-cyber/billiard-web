<!-- src/views/History.vue - 训练历史 -->
<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">📅 训练历史</h1>
    </div>

    <div v-if="!store.isLoggedIn" class="empty-state">
      <span class="empty-icon">🔒</span>
      <span class="empty-text">请先登录查看历史记录</span>
    </div>

    <div v-else-if="store.records.length === 0" class="empty-state">
      <span class="empty-icon">🎯</span>
      <span class="empty-text">还没有训练记录</span>
      <button class="btn-primary" style="margin-top: 20px; width: auto; padding: 12px 32px;" @click="$router.push('/record')">
        开始训练
      </button>
    </div>

    <div v-else class="history-list">
      <div class="history-card" v-for="r in store.records.slice(0, 30)" :key="r.id">
        <div class="history-date">{{ r.date }}</div>
        <div class="history-project">{{ r.project || '未命名项目' }}</div>
        <div class="history-stats">
          <span>{{ r.duration }}分钟</span>
          <span>·</span>
          <span>{{ r.totalShots }}杆</span>
          <span>·</span>
          <span :class="r.hitRate >= 70 ? 'rate-good' : r.hitRate >= 50 ? 'rate-mid' : 'rate-bad'">{{ r.hitRate }}%</span>
        </div>
        <div class="history-note" v-if="r.note">{{ r.note }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useBilliardStore } from '../stores/billiard'
const store = useBilliardStore()
</script>

<style scoped>
.page { padding: 16px 12px 120px; }
.page-header { margin-bottom: 16px; }
.page-title { font-size: 22px; font-weight: 800; color: #1a1a2e; }
.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 48px; display: block; margin-bottom: 12px; }
.empty-text { font-size: 15px; color: #b0b0b0; display: block; }
.history-list { display: flex; flex-direction: column; gap: 10px; }
.history-card {
  background: #fff; border-radius: 12px; padding: 14px 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}
.history-date { font-size: 12px; color: #b0b0b0; margin-bottom: 4px; }
.history-project { font-size: 16px; font-weight: 600; color: #1a1a2e; margin-bottom: 6px; }
.history-stats { font-size: 13px; color: #666; display: flex; gap: 6px; }
.rate-good { color: #2ecc71; font-weight: 700; }
.rate-mid { color: #ff6b35; font-weight: 700; }
.rate-bad { color: #e74c3c; font-weight: 700; }
.history-note { font-size: 13px; color: #999; margin-top: 6px; padding-top: 6px; border-top: 1px solid #f0f0f0; }
</style>
