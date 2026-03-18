<!-- src/views/MyStarred.vue - 心得收藏 -->
<template>
  <div class="page">
    <div class="page-top">
      <span class="back-btn" @click="$router.back()">‹ 返回</span>
      <span class="page-title">⭐ 心得收藏</span>
      <span class="page-count">{{ store.starredRecords.length }}条</span>
    </div>

    <div class="starred-list" v-if="store.starredRecords.length > 0">
      <div
        class="starred-item"
        v-for="r in store.starredRecords"
        :key="r.id"
        @click="$router.push('/detail/' + r.id)"
      >
        <div class="starred-left">
          <div
            class="starred-icon"
            :class="r.hitRate >= 70 ? 'good' : r.hitRate >= 50 ? 'mid' : 'bad'"
          >
            {{ r.hitRate >= 70 ? '🔥' : r.hitRate >= 50 ? '💪' : '🎯' }}
          </div>
          <div>
            <span class="starred-name">{{ r.project }}</span>
            <span class="starred-meta"
              >{{ r.date }} · {{ r.duration }}分钟 · {{ r.totalShots }}杆</span
            >
            <span class="starred-note" v-if="r.note">{{ r.note }}</span>
          </div>
        </div>
        <div class="starred-right">
          <span
            class="starred-rate"
            :class="r.hitRate >= 70 ? 'good' : r.hitRate >= 50 ? 'mid' : 'bad'"
            >{{ r.hitRate }}%</span
          >
          <span class="item-arrow">›</span>
        </div>
      </div>
    </div>

    <div class="empty-card" v-else>
      <div class="empty-icon">⭐</div>
      <span class="empty-text">还没有收藏的心得</span>
      <span class="empty-desc">记录训练时点击「心得收藏」即可收藏</span>
    </div>
  </div>
</template>

<script setup>
import { useBilliardStore } from '../stores/billiard'

const store = useBilliardStore()
</script>

<style scoped>
.page {
  padding: 0 12px 24px;
}
.page-top {
  display: flex;
  align-items: baseline;
  padding: 16px 0;
  gap: 8px;
}
.back-btn {
  font-size: 22px;
  color: #2ecc71;
  cursor: pointer;
  font-weight: 700;
}
.back-btn:active {
  opacity: 0.7;
}
.page-title {
  font-size: 22px;
  font-weight: 800;
  color: #1a1a2e;
}
.page-count {
  font-size: 13px;
  color: #b0b0b0;
  margin-left: auto;
}

.starred-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.starred-item {
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer;
}
.starred-item:active {
  background: #fafafa;
}
.starred-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
}
.starred-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.starred-icon.good {
  background: rgba(46, 204, 113, 0.12);
}
.starred-icon.mid {
  background: rgba(255, 107, 53, 0.12);
}
.starred-icon.bad {
  background: rgba(231, 76, 60, 0.1);
}
.starred-name {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
}
.starred-meta {
  display: block;
  font-size: 12px;
  color: #b0b0b0;
  margin-top: 2px;
}
.starred-note {
  display: block;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}
.starred-right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.starred-rate {
  font-size: 19px;
  font-weight: 800;
}
.starred-rate.good {
  color: #2ecc71;
}
.starred-rate.mid {
  color: #ff6b35;
}
.starred-rate.bad {
  color: #e74c3c;
}
.item-arrow {
  font-size: 18px;
  color: #ddd;
}

.empty-card {
  text-align: center;
  padding: 60px 24px;
}
.empty-icon {
  font-size: 50px;
  margin-bottom: 12px;
  display: block;
}
.empty-text {
  display: block;
  font-size: 17px;
  font-weight: 600;
  color: #333;
}
.empty-desc {
  display: block;
  font-size: 13px;
  color: #b0b0b0;
  margin-top: 6px;
}
</style>
