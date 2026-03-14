<!-- src/views/SquareDetail.vue - 广场项目详情（支持视频+图片） -->
<template>
  <div class="page" v-if="project">
    <!-- 头部 -->
    <div class="detail-hero" :class="project.category">
      <span class="detail-cat">{{categoryLabel(project.category)}}</span>
      <h1 class="detail-name">{{project.name}}</h1>
      <p class="detail-publisher">by {{project.publisher}}</p>
    </div>

    <!-- 数据卡片 -->
    <div class="stats-card">
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-num">{{project.likes}}</span>
          <span class="stat-label">👍 点赞</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-num">{{project.favs}}</span>
          <span class="stat-label">⭐ 收藏</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-num">{{project.participants}}</span>
          <span class="stat-label">👥 参与训练</span>
        </div>
      </div>
    </div>

    <!-- 点赞 + 收藏 -->
    <div class="action-bar">
      <button class="action-btn like-btn" :class="{liked}" @click="handleLike">
        👍 {{liked ? '已点赞' : '点赞'}} {{project.likes}}
      </button>
      <button class="action-btn fav-btn" :class="{faved: store.isProjectFaved(project.id)}" @click="handleFav">
        {{store.isProjectFaved(project.id) ? '⭐ 已收藏' : '☆ 收藏'}} {{project.favs}}
      </button>
    </div>

    <!-- 项目说明 -->
    <div class="card">
      <div class="card-title">📋 项目说明</div>
      <p class="detail-desc">{{project.desc}}</p>
    </div>

    <!-- 演示视频 -->
    <div class="card" v-if="videoUrl">
      <div class="card-title">🎥 演示视频</div>
      <video :src="videoUrl" controls playsinline class="detail-video" />
    </div>

    <!-- 项目图片 -->
    <div class="card" v-if="imageUrls.length > 0">
      <div class="card-title">📸 项目图片</div>
      <div class="image-gallery">
        <div class="gallery-item" v-for="(url, i) in imageUrls" :key="i" @click="viewImage(i)">
          <img :src="url" class="gallery-img" />
        </div>
      </div>
    </div>

    <!-- 图片查看器 -->
    <div class="viewer-overlay" v-if="viewingImage !== null" @click="viewingImage = null">
      <img :src="imageUrls[viewingImage]" class="viewer-img" />
      <span class="viewer-close">✕</span>
    </div>

    <!-- 加入训练计划 -->
    <div class="card">
      <button class="btn-add-plan" :class="{added: store.isInCart(project.id)}" @click="openParamPanel">
        {{store.isInCart(project.id) ? '✅ 已加入今日训练计划' : '🛒 加入今日训练计划'}}
      </button>
    </div>

    <!-- 开始训练 -->
    <div class="card">
      <button class="btn-start-train" @click="goTrain">
        🎱 开始训练「{{project.name}}」
      </button>
    </div>

    <!-- 发布时间 -->
    <div class="time-info">发布于 {{project.createdAt}}</div>

    <!-- 参数面板弹层 -->
    <div class="param-overlay" v-if="showParamPanel" @click.self="showParamPanel = false">
      <div class="param-sheet">
        <div class="param-header">
          <span class="param-title">设置训练参数</span>
          <span class="param-close" @click="showParamPanel = false">✕</span>
        </div>

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
  </div>

  <div class="empty" v-else>
    <p class="empty-text">项目不存在</p>
    <button class="btn-primary" style="margin-top:16px;" @click="$router.push('/square')">返回广场</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBilliardStore } from '../stores/billiard'
import { getFile } from '../utils/mediaStore'

const store = useBilliardStore()
const route = useRoute()
const router = useRouter()
const liked = ref(false)
const viewingImage = ref(null)

// 媒体资源
const videoUrl = ref('')
const imageUrls = ref([])
const blobUrls = []

// 参数面板
const showParamPanel = ref(false)
const paramDuration = ref(30)
const paramTarget = ref(60)
const showCustomDuration = ref(false)

const project = computed(() => store.getSquareProject(route.params.id))

function categoryLabel(cat) {
  return { basic: '🎯 基础', medium: '💪 进阶', advanced: '🔥 高级' }[cat] || cat
}

// 加载媒体资源
async function loadMedia() {
  if (!project.value) return

  // 向后兼容：旧的 videoUrl（base64）
  if (project.value.videoUrl && !project.value.videoMediaId) {
    videoUrl.value = project.value.videoUrl
  }

  // 新的 IndexedDB 视频
  if (project.value.videoMediaId) {
    try {
      const blob = await getFile(project.value.videoMediaId)
      if (blob) {
        const url = URL.createObjectURL(blob)
        blobUrls.push(url)
        videoUrl.value = url
      }
    } catch(e) {
      console.warn('Failed to load video from IndexedDB:', e)
    }
  }

  // 图片
  if (project.value.imageMediaIds && project.value.imageMediaIds.length > 0) {
    for (const id of project.value.imageMediaIds) {
      try {
        const blob = await getFile(id)
        if (blob) {
          const url = URL.createObjectURL(blob)
          blobUrls.push(url)
          imageUrls.value.push(url)
        }
      } catch(e) {
        console.warn('Failed to load image:', id, e)
      }
    }
  }
}

function viewImage(index) {
  viewingImage.value = index
}

function handleLike() {
  if (liked.value) return
  liked.value = true
  store.likeProject(project.value.id)
}

function handleFav() {
  if (!store.isLoggedIn) { alert('请先登录'); return }
  store.toggleFavProject(project.value.id)
}

function openParamPanel() {
  if (!store.isLoggedIn) { alert('请先登录'); return }
  if (store.isInCart(project.value.id)) return
  paramDuration.value = 30
  paramTarget.value = 60
  showCustomDuration.value = false
  showParamPanel.value = true
}

function confirmAddPlan() {
  store.addToCart({
    projectId: project.value.id,
    name: project.value.name,
    category: project.value.category,
    duration: paramDuration.value,
    targetRate: paramTarget.value
  })
  showParamPanel.value = false
}

function goTrain() {
  router.push('/record?projectId=' + project.value.id + '&from=square')
}

onMounted(() => {
  loadMedia()
})

onUnmounted(() => {
  blobUrls.forEach(url => {
    try { URL.revokeObjectURL(url) } catch(e) {}
  })
})
</script>

<style scoped>
.page { padding-bottom: 24px; }

.detail-hero { padding: 30px 18px; text-align: center; position: relative; overflow: hidden; }
.detail-hero.basic { background: linear-gradient(160deg, #2ecc71, #27ae60); }
.detail-hero.medium { background: linear-gradient(160deg, #ff6b35, #e55a2b); }
.detail-hero.advanced { background: linear-gradient(160deg, #e74c3c, #c0392b); }
.detail-cat { display: inline-block; background: rgba(255,255,255,0.2); color: #fff; font-size: 12px; padding: 4px 12px; border-radius: 12px; margin-bottom: 8px; }
.detail-name { font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 6px; }
.detail-publisher { font-size: 13px; color: rgba(255,255,255,0.75); }

.stats-card {
  display: flex; background: #fff; border-radius: 12px; padding: 20px 18px;
  margin: -15px 12px 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); position: relative; z-index: 1;
}
.stats-row { display: flex; justify-content: space-around; width: 100%; }
.stat-item { text-align: center; flex: 1; }
.stat-num { display: block; font-size: 22px; font-weight: 800; color: #1a1a2e; }
.stat-label { display: block; font-size: 11px; color: #b0b0b0; margin-top: 4px; }
.stat-divider { width: 1px; height: 30px; background: #f0f0f0; }

.action-bar { display: flex; gap: 10px; padding: 12px; }
.action-btn {
  flex: 1; text-align: center; padding: 12px 0; border: none; border-radius: 10px;
  font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.like-btn { background: #fff; color: #333; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.like-btn.liked { background: rgba(46,204,113,0.1); color: #27ae60; }
.fav-btn { background: #fff; color: #333; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.fav-btn.faved { background: rgba(243,156,18,0.1); color: #f39c12; }

.detail-desc { font-size: 14px; line-height: 1.8; color: #555; }

.detail-video { width: 100%; border-radius: 10px; max-height: 240px; background: #000; }

/* 图片画廊 */
.image-gallery { display: flex; flex-wrap: wrap; gap: 8px; }
.gallery-item {
  width: calc(33.33% - 6px); border-radius: 8px; overflow: hidden; cursor: pointer;
  aspect-ratio: 4/3;
}
.gallery-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.2s; }
.gallery-item:active .gallery-img { transform: scale(0.96); }

/* 图片查看器 */
.viewer-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 2000;
  background: rgba(0,0,0,0.92); display: flex; align-items: center; justify-content: center;
}
.viewer-img { max-width: 95%; max-height: 85vh; border-radius: 8px; object-fit: contain; }
.viewer-close {
  position: absolute; top: 16px; right: 16px; width: 36px; height: 36px;
  background: rgba(255,255,255,0.15); color: #fff; border-radius: 50%;
  font-size: 18px; display: flex; align-items: center; justify-content: center; cursor: pointer;
}

.btn-add-plan {
  width: 100%; padding: 14px 0; border: none; border-radius: 10px; font-size: 15px; font-weight: 700;
  cursor: pointer; transition: all 0.2s;
  background: linear-gradient(135deg, #2ecc71, #27ae60); color: #fff;
  box-shadow: 0 4px 14px rgba(46,204,113,0.35);
}
.btn-add-plan.added { background: #f0f0f0; color: #b0b0b0; box-shadow: none; cursor: default; }
.btn-add-plan:active:not(.added) { opacity: 0.85; }

.btn-start-train {
  width: 100%; padding: 14px 0; border: 2px solid #2ecc71; border-radius: 10px; font-size: 15px; font-weight: 700;
  cursor: pointer; background: #fff; color: #27ae60; transition: all 0.2s;
}
.btn-start-train:active { background: rgba(46,204,113,0.06); }

.time-info { text-align: center; padding: 16px; font-size: 12px; color: #ccc; }

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
.quick-rate button.active { border-color: #2ecc71; background: rgba(46,204,113,0.08); color: #27ae60; }

.btn-confirm {
  width: 100%; padding: 15px 0; margin-top: 8px; border: none; border-radius: 12px;
  font-size: 16px; font-weight: 700; cursor: pointer;
  background: linear-gradient(135deg, #2ecc71, #27ae60); color: #fff;
  box-shadow: 0 4px 16px rgba(46,204,113,0.35);
}
.btn-confirm:active { opacity: 0.9; }

.empty { text-align: center; padding: 80px 24px; }
.empty-text { font-size: 15px; color: #ccc; }
</style>
