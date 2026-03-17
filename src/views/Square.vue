<!-- src/views/Square.vue - 训练项目广场 -->
<template>
  <div class="page">
    <div class="page-top">
      <span class="page-title">🎱 项目广场</span>
      <button class="publish-btn" @click="$router.push('/publish')">+ 发布</button>
    </div>

    <!-- 分类筛选 -->
    <div class="category-tabs">
      <button :class="{active: category === 'all'}" @click="category = 'all'">全部</button>
      <button :class="{active: category === 'basic'}" @click="category = 'basic'">🎯 基础</button>
      <button :class="{active: category === 'medium'}" @click="category = 'medium'">💪 进阶</button>
      <button :class="{active: category === 'advanced'}" @click="category = 'advanced'">🔥 高级</button>
    </div>

    <!-- 排序 -->
    <div class="sort-bar">
      <span class="sort-label">排序：</span>
      <button :class="{active: sortBy === 'hot'}" @click="sortBy = 'hot'">🔥 最热</button>
      <button :class="{active: sortBy === 'likes'}" @click="sortBy = 'likes'">👍 点赞</button>
      <button :class="{active: sortBy === 'favs'}" @click="sortBy = 'favs'">⭐ 收藏</button>
      <button :class="{active: sortBy === 'new'}" @click="sortBy = 'new'">🆕 最新</button>
    </div>

    <!-- 项目列表 -->
    <div class="project-list">
      <div class="project-card" v-for="p in filteredProjects" :key="p.id">
        <div class="project-card-header" @click="$router.push('/square-detail/' + p.id)">
          <div class="project-card-info">
            <span class="project-name">{{p.name}}</span>
            <span class="category-tag" :class="p.category">{{categoryLabel(p.category)}}</span>
          </div>
        </div>
        <p class="project-desc" @click="$router.push('/square-detail/' + p.id)">{{p.desc}}</p>
        <div class="project-stats" @click="$router.push('/square-detail/' + p.id)">
          <span class="stat">👍 {{p.likes}}</span>
          <span class="stat">⭐ {{p.favs}}</span>
          <span class="stat">👥 {{p.participants}}</span>
          <span class="publisher">by {{p.publisher}}</span>
        </div>
        <!-- 底部按钮 -->
        <div class="card-actions">
          <button class="btn-add-plan" :class="{added: store.isInCart(p.id)}" @click.stop="openParamPanel(p)">
            {{store.isInCart(p.id) ? '✅ 已在计划中' : '+ 加入训练计划'}}
          </button>
          <button class="btn-fav" :class="{faved: store.isProjectFaved(p.id)}" @click.stop="toggleFav(p.id)">
            {{store.isProjectFaved(p.id) ? '⭐ 已收藏' : '☆ 收藏'}}
          </button>
        </div>
      </div>
    </div>

    <!-- 参数面板弹层 -->
    <div class="param-overlay" v-if="showParamPanel" @click.self="showParamPanel = false">
      <div class="param-sheet">
        <div class="param-header">
          <span class="param-title">设置训练参数</span>
          <span class="param-close" @click="showParamPanel = false">✕</span>
        </div>

        <!-- 训练时长 -->
        <div class="param-item">
          <div class="param-label">⏱ 训练时长</div>
          <div class="quick-rate duration-btns">
            <button :class="{active: paramDuration === 10}" @click="paramDuration = 10; showCustomDuration = false">10分钟</button>
            <button :class="{active: paramDuration === 15}" @click="paramDuration = 15; showCustomDuration = false">15分钟</button>
            <button :class="{active: paramDuration === 20}" @click="paramDuration = 20; showCustomDuration = false">20分钟</button>
            <button :class="{active: paramDuration === 30}" @click="paramDuration = 30; showCustomDuration = false">30分钟</button>
            <button :class="{active: paramDuration === 45}" @click="paramDuration = 45; showCustomDuration = false">45分钟</button>
            <button :class="{active: paramDuration === 60}" @click="paramDuration = 60; showCustomDuration = false">60分钟</button>
            <button :class="{active: paramDuration === 90}" @click="paramDuration = 90; showCustomDuration = false">90分钟</button>
            <button :class="{active: paramDuration === 120}" @click="paramDuration = 120; showCustomDuration = false">120分钟</button>
            <button :class="{active: showCustomDuration}" @click="showCustomDuration = true">自定义</button>
          </div>
          <div class="custom-input" v-if="showCustomDuration">
            <input type="number" v-model.number="paramDuration" min="5" max="300" class="custom-field" placeholder="输入分钟数" />
            <span class="custom-unit">分钟</span>
          </div>
        </div>

        <!-- 目标进球率 -->
        <div class="param-item">
          <div class="param-label">🎯 目标进球率</div>
          <div class="quick-rate">
            <button :class="{active: paramTarget === 30}" @click="paramTarget = 30">30%</button>
            <button :class="{active: paramTarget === 50}" @click="paramTarget = 50">50%</button>
            <button :class="{active: paramTarget === 60}" @click="paramTarget = 60">60%</button>
            <button :class="{active: paramTarget === 70}" @click="paramTarget = 70">70%</button>
            <button :class="{active: paramTarget === 90}" @click="paramTarget = 90">90%</button>
            <button :class="{active: paramTarget === 100}" @click="paramTarget = 100">100%</button>
          </div>
        </div>

        <button class="btn-confirm" @click="confirmAddPlan">✅ 确认加入训练计划</button>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty" v-if="filteredProjects.length === 0">
      <span class="empty-icon">🔍</span>
      <span class="empty-text">暂无项目</span>
      <span class="empty-desc">去发布第一个训练项目吧</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useBilliardStore } from '../stores/billiard'

const store = useBilliardStore()
const category = ref('all')
const sortBy = ref('hot')

// 参数面板
const showParamPanel = ref(false)
const paramProject = ref(null)
const paramDuration = ref(30)
const paramTarget = ref(60)
const showCustomDuration = ref(false)

function categoryLabel(cat) {
  return { basic: '基础', medium: '进阶', advanced: '高级' }[cat] || cat
}

const filteredProjects = computed(() => {
  let list = [...store.squareProjects]
  if (category.value !== 'all') {
    list = list.filter(p => p.category === category.value)
  }
  switch (sortBy.value) {
    case 'hot': list.sort((a, b) => (b.likes * 2 + b.favs * 3 + b.participants) - (a.likes * 2 + a.favs * 3 + a.participants)); break
    case 'likes': list.sort((a, b) => b.likes - a.likes); break
    case 'favs': list.sort((a, b) => b.favs - a.favs); break
    case 'new': list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break
  }
  return list
})

function openParamPanel(project) {
  if (!store.isLoggedIn) { alert('请先登录'); return }
  if (store.isInCart(project.id)) return
  paramProject.value = project
  paramDuration.value = 30
  paramTarget.value = 60
  showCustomDuration.value = false
  showParamPanel.value = true
}

function confirmAddPlan() {
  if (!paramProject.value) return
  store.addToCart({
    projectId: paramProject.value.id,
    name: paramProject.value.name,
    category: paramProject.value.category,
    duration: paramDuration.value,
    targetRate: paramTarget.value
  })
  showParamPanel.value = false
}

async function toggleFav(id) {
  if (!store.isLoggedIn) { alert('请先登录'); return }
  await store.toggleFavProject(id)
}
</script>

<style scoped>
.page { padding: 0 12px 24px; }
.page-top { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; }
.page-title { font-size: 22px; font-weight: 800; color: #1a1a2e; }
.publish-btn {
  background: linear-gradient(135deg, #2ecc71, #27ae60); color: #fff; border: none;
  border-radius: 20px; padding: 8px 18px; font-size: 13px; font-weight: 600; cursor: pointer;
  box-shadow: 0 2px 8px rgba(46,204,113,0.3);
}
.publish-btn:active { opacity: 0.9; }

.category-tabs {
  display: flex; background: #fff; border-radius: 8px; padding: 4px; margin-bottom: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
}
.category-tabs button {
  flex: 1; text-align: center; padding: 8px 0; font-size: 12px; font-weight: 500;
  color: #999; border: none; border-radius: 6px; background: transparent; cursor: pointer; transition: all 0.2s;
}
.category-tabs button.active {
  background: #2ecc71; color: #fff; font-weight: 600; box-shadow: 0 2px 8px rgba(46,204,113,0.3);
}

.sort-bar {
  display: flex; align-items: center; gap: 6px; padding: 8px 4px; font-size: 12px; flex-wrap: wrap;
}
.sort-label { color: #999; margin-right: 2px; }
.sort-bar button {
  padding: 5px 10px; background: #f5f5f5; border: none; border-radius: 12px; font-size: 11px;
  color: #999; cursor: pointer; transition: all 0.2s;
}
.sort-bar button.active { background: rgba(46,204,113,0.12); color: #27ae60; font-weight: 600; }

.project-list { display: flex; flex-direction: column; gap: 10px; }
.project-card {
  background: #fff; border-radius: 12px; padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: transform 0.1s;
}
.project-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; cursor: pointer; }
.project-card-info { display: flex; align-items: center; gap: 8px; flex: 1; }
.project-name { font-size: 16px; font-weight: 700; color: #1a1a2e; }
.category-tag { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
.category-tag.basic { background: rgba(46,204,113,0.12); color: #27ae60; }
.category-tag.medium { background: rgba(255,107,53,0.12); color: #e55a2b; }
.category-tag.advanced { background: rgba(231,76,60,0.12); color: #e74c3c; }

.project-desc {
  font-size: 13px; color: #666; line-height: 1.6; margin-bottom: 10px; cursor: pointer;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

.project-stats { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; cursor: pointer; }
.stat { font-size: 11px; color: #b0b0b0; }
.publisher { font-size: 11px; color: #2ecc71; margin-left: auto; }

/* 底部操作按钮 */
.card-actions { display: flex; gap: 8px; }
.btn-add-plan {
  flex: 1; padding: 10px 0; border: none; border-radius: 8px; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
  background: linear-gradient(135deg, #2ecc71, #27ae60); color: #fff;
  box-shadow: 0 2px 8px rgba(46,204,113,0.3);
}
.btn-add-plan.added { background: #f0f0f0; color: #b0b0b0; box-shadow: none; cursor: default; }
.btn-fav {
  padding: 10px 16px; border: 1px solid #eee; border-radius: 8px; font-size: 13px; font-weight: 600;
  cursor: pointer; background: #fff; color: #999; transition: all 0.2s;
}
.btn-fav.faved { color: #f39c12; border-color: rgba(243,156,18,0.3); background: rgba(243,156,18,0.06); }

/* 参数面板 */
.param-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4);
  z-index: 1000; display: flex; align-items: flex-end; justify-content: center;
}
.param-sheet {
  width: 100%; max-width: 480px; background: #fff; border-radius: 16px 16px 0 0;
  padding: 0 20px 30px; animation: slideUp 0.25s ease-out;
}
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.param-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 0 14px; border-bottom: 1px solid #f0f0f0; }
.param-title { font-size: 17px; font-weight: 700; color: #1a1a2e; }
.param-close { font-size: 18px; color: #b0b0b0; cursor: pointer; padding: 4px 8px; }

.param-item { padding: 16px 0; }
.param-label { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 12px; }
.param-slider { width: 100%; accent-color: #2ecc71; margin: 8px 0; }
.param-value { display: block; text-align: center; font-size: 22px; font-weight: 800; color: #2ecc71; margin-top: 4px; }

.duration-btns { gap: 6px !important; }
.duration-btns button { min-width: 60px; font-size: 13px !important; }
.custom-input { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 12px; }
.custom-field {
  width: 80px; text-align: center; font-size: 20px; font-weight: 800; color: #1a1a2e;
  border: 2px solid #2ecc71; border-radius: 8px; padding: 8px; outline: none;
}
.custom-unit { font-size: 14px; color: #b0b0b0; }

.stepper { display: flex; align-items: center; justify-content: center; gap: 20px; }
.stepper-btn {
  width: 40px; height: 40px; border-radius: 50%; border: 2px solid #2ecc71; background: #fff;
  font-size: 20px; font-weight: 700; color: #2ecc71; cursor: pointer; display: flex;
  align-items: center; justify-content: center;
}
.stepper-btn:active { background: rgba(46,204,113,0.1); }
.stepper-value { font-size: 24px; font-weight: 800; color: #1a1a2e; min-width: 60px; text-align: center; }

.quick-rate { display: flex; gap: 8px; flex-wrap: wrap; }
.quick-rate button {
  flex: 1; min-width: 54px; padding: 10px 0; border-radius: 8px; font-size: 14px; font-weight: 600;
  border: 2px solid #f0f0f0; background: #fff; color: #666; cursor: pointer; transition: all 0.2s; text-align: center;
}
.quick-rate button.active {
  border-color: #2ecc71; background: rgba(46,204,113,0.08); color: #27ae60;
}

.btn-confirm {
  width: 100%; padding: 15px 0; margin-top: 8px; border: none; border-radius: 12px;
  font-size: 16px; font-weight: 700; cursor: pointer;
  background: linear-gradient(135deg, #2ecc71, #27ae60); color: #fff;
  box-shadow: 0 4px 16px rgba(46,204,113,0.35);
}
.btn-confirm:active { opacity: 0.9; }

.empty { text-align: center; padding: 60px 24px; }
.empty-icon { font-size: 40px; display: block; margin-bottom: 8px; }
.empty-text { display: block; font-size: 16px; font-weight: 600; color: #333; }
.empty-desc { display: block; font-size: 13px; color: #b0b0b0; margin-top: 4px; }
</style>
