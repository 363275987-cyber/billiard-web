<!-- src/views/MyProjects.vue - 我的项目 -->
<template>
  <div class="page">
    <div class="page-top">
      <span class="back-btn" @click="$router.back()">‹ 返回</span>
      <span class="page-title">📚 我的项目</span>
      <span class="page-placeholder"></span>
    </div>

    <div class="sub-tabs">
      <button :class="{ active: tab === 'fav' }" @click="tab = 'fav'">
        ⭐ 收藏的训练 ({{ store.myFavList.length }})
      </button>
      <button :class="{ active: tab === 'pub' }" @click="tab = 'pub'">
        📝 我发布的 ({{ store.myPublishedList.length }})
      </button>
    </div>

    <!-- 收藏的 -->
    <div v-if="tab === 'fav'">
      <div class="project-list" v-if="store.myFavList.length > 0">
        <div
          class="project-item"
          v-for="p in store.myFavList"
          :key="p.id"
          @click="$router.push('/square-detail/' + p.id)"
        >
          <div class="project-left">
            <span class="category-dot" :class="p.category"></span>
            <div>
              <span class="project-name">{{ p.name }}</span>
              <span class="category-tag" :class="p.category">{{
                categoryLabel(p.category)
              }}</span>
              <span class="project-meta"
                >by {{ p.publisher }} · ⭐ {{ p.favs }}</span
              >
            </div>
          </div>
          <span class="item-arrow">›</span>
        </div>
      </div>
      <div class="empty-card" v-else>
        <div class="empty-icon">⭐</div>
        <span class="empty-text">还没有收藏训练项目</span>
        <button
          class="btn-primary"
          style="margin-top: 16px"
          @click="$router.push('/square')"
        >
          去广场看看
        </button>
      </div>
    </div>

    <!-- 发布的 -->
    <div v-if="tab === 'pub'">
      <div class="project-list" v-if="store.myPublishedList.length > 0">
        <div
          class="project-item"
          v-for="p in store.myPublishedList"
          :key="p.id"
          @click="$router.push('/square-detail/' + p.id)"
        >
          <div class="project-left">
            <span class="category-dot" :class="p.category"></span>
            <div>
              <span class="project-name">{{ p.name }}</span>
              <span class="category-tag" :class="p.category">{{
                categoryLabel(p.category)
              }}</span>
              <span class="project-meta"
                >👍 {{ p.likes }} · ⭐ {{ p.favs }} · 👥
                {{ p.participants }}</span
              >
            </div>
          </div>
          <span class="item-arrow">›</span>
        </div>
      </div>
      <div class="empty-card" v-else>
        <div class="empty-icon">📝</div>
        <span class="empty-text">还没有发布过项目</span>
        <button
          class="btn-primary"
          style="margin-top: 16px"
          @click="$router.push('/publish')"
        >
          去发布
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useBilliardStore } from '../stores/billiard'

const store = useBilliardStore()
const tab = ref('fav')

function categoryLabel(cat) {
  return { basic: '基础', medium: '进阶', advanced: '高级' }[cat] || cat
}
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
.page-placeholder {
  width: 40px;
}

.sub-tabs {
  display: flex;
  background: #fff;
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}
.sub-tabs button {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 13px;
  font-weight: 500;
  color: #999;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
}
.sub-tabs button.active {
  background: #2ecc71;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(46, 204, 113, 0.3);
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.project-item {
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer;
}
.project-item:active {
  background: #fafafa;
}
.project-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}
.category-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.category-dot.basic {
  background: #2ecc71;
}
.category-dot.medium {
  background: #ff6b35;
}
.category-dot.advanced {
  background: #e74c3c;
}
.project-name {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
}
.category-tag {
  display: inline-block;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
  margin-left: 6px;
}
.category-tag.basic {
  background: rgba(46, 204, 113, 0.12);
  color: #27ae60;
}
.category-tag.medium {
  background: rgba(255, 107, 53, 0.12);
  color: #e55a2b;
}
.category-tag.advanced {
  background: rgba(231, 76, 60, 0.12);
  color: #e74c3c;
}
.project-meta {
  display: block;
  font-size: 12px;
  color: #b0b0b0;
  margin-top: 3px;
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
</style>
