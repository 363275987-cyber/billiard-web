<!-- src/views/Detail.vue - Keep 风格详情 -->
<template>
  <div class="page" v-if="record">
    <div
      class="detail-hero"
      :class="
        record.hitRate >= 70 ? 'good' : record.hitRate >= 50 ? 'mid' : 'bad'
      "
    >
      <span class="detail-emoji">🎱</span>
      <span class="detail-project">{{ record.project }}</span>
      <span class="detail-date">{{ record.date }}</span>
    </div>

    <div class="data-card">
      <div class="data-main">
        <div
          class="data-ring"
          :class="
            record.hitRate >= 70 ? 'good' : record.hitRate >= 50 ? 'mid' : 'bad'
          "
        >
          <span class="data-ring-num">{{ record.hitRate }}</span>
          <span class="data-ring-unit">%</span>
        </div>
        <span class="data-ring-label">命中率</span>
      </div>
      <div class="data-divider"></div>
      <div class="data-side">
        <div class="data-side-item">
          <span class="data-side-num"
            >{{ record.hits
            }}<span class="data-side-unit">/{{ record.totalShots }}</span></span
          >
          <span class="data-side-label">命中/出杆</span>
        </div>
        <div class="data-side-item">
          <span class="data-side-num"
            >{{ record.duration }}<span class="data-side-unit">分钟</span></span
          >
          <span class="data-side-label">训练时长</span>
        </div>
      </div>
    </div>

    <div class="section">
      <!-- 媒体展示 -->
      <div class="card" v-if="mediaFiles.length > 0">
        <div class="card-title">训练留影</div>
        <div class="media-gallery">
          <template v-for="(m, i) in mediaFiles" :key="'media' + i">
            <img
              v-if="m.type === 'image'"
              :src="m.url"
              class="gallery-img"
              @click="previewImage(i)"
            />
            <video
              v-else
              :src="m.url"
              controls
              playsinline
              class="gallery-video"
            />
          </template>
        </div>
      </div>
      <div class="card" v-if="record.note">
        <div class="card-title">训练心得</div>
        <p class="note-text">{{ record.note }}</p>
      </div>
      <div
        class="card"
        v-else-if="!record.mediaIds || record.mediaIds.length === 0"
      >
        <p class="no-note">本次训练没有记录心得</p>
      </div>
    </div>

    <div class="time-row">
      <span class="time-text">记录时间：{{ record.createdAt }}</span>
    </div>

    <div class="actions">
      <button
        class="action-btn"
        :class="{ starred: record.starred }"
        @click="handleToggleStar"
      >
        {{ record.starred ? '⭐ 已收藏' : '☆ 收藏' }}
      </button>
      <button class="action-btn danger" @click="handleDelete">🗑 删除</button>
    </div>
  </div>

  <div class="empty" v-else>
    <p class="empty-text">记录不存在或已被删除</p>
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

const record = computed(() => store.getRecord(route.params.id))
const mediaFiles = ref([]) // { url, type: 'image'|'video' }
const blobUrls = ref([])

onMounted(async () => {
  const rec = record.value
  if (rec?.mediaIds?.length) {
    for (const id of rec.mediaIds) {
      try {
        const blob = await getFile(id)
        if (blob) {
          const url = URL.createObjectURL(blob)
          blobUrls.value.push(url)
          const isVideo = blob.type?.startsWith('video/')
          mediaFiles.value.push({ url, type: isVideo ? 'video' : 'image' })
        }
      } catch (e) {
        /* 文件可能已丢失 */
      }
    }
  }
})

onUnmounted(() => {
  blobUrls.value.forEach((url) => URL.revokeObjectURL(url))
})

function previewImage(index) {
  // 点击图片可全屏预览（简单实现：直接打开）
  const img = mediaFiles.value[index]
  if (img) window.open(img.url, '_blank')
}

async function handleToggleStar() {
  await store.toggleStar(record.value.id)
}

async function handleDelete() {
  if (confirm('确定要删除这条训练记录吗？')) {
    await store.deleteRecord(record.value.id)
    router.back()
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: 24px;
}

.detail-hero {
  padding: 30px 24px;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.detail-hero.good {
  background: linear-gradient(160deg, #2ecc71, #27ae60);
}
.detail-hero.mid {
  background: linear-gradient(160deg, #ff6b35, #e55a2b);
}
.detail-hero.bad {
  background: linear-gradient(160deg, #e74c3c, #c0392b);
}
.detail-emoji {
  display: block;
  font-size: 32px;
  margin-bottom: 8px;
}
.detail-project {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
}
.detail-date {
  display: block;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.data-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 22px 18px;
  margin: -15px 12px 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 1;
}
.data-main {
  flex: 1;
  text-align: center;
}
.data-ring {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 4px;
  border: 4px solid;
}
.data-ring.good {
  border-color: #2ecc71;
  background: rgba(46, 204, 113, 0.06);
}
.data-ring.mid {
  border-color: #ff6b35;
  background: rgba(255, 107, 53, 0.06);
}
.data-ring.bad {
  border-color: #e74c3c;
  background: rgba(231, 76, 60, 0.06);
}
.data-ring-num {
  font-size: 24px;
  font-weight: 800;
  color: #1a1a2e;
  line-height: 1;
}
.data-ring-unit {
  font-size: 12px;
  color: #999;
}
.data-ring-label {
  display: block;
  font-size: 12px;
  color: #b0b0b0;
}
.data-divider {
  width: 1px;
  height: 40px;
  background: #f0f0f0;
}
.data-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.data-side-item {
  text-align: center;
}
.data-side-num {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
}
.data-side-unit {
  font-size: 13px;
  color: #b0b0b0;
}
.data-side-label {
  display: block;
  font-size: 11px;
  color: #b0b0b0;
  margin-top: 2px;
}

.section {
  padding: 0 12px;
}
.note-text {
  font-size: 14px;
  line-height: 1.8;
  color: #555;
}
.no-note {
  font-size: 14px;
  color: #ccc;
}

/* 媒体展示 */
.media-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.gallery-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.15s;
}
.gallery-img:active {
  transform: scale(0.95);
}
.gallery-video {
  width: 100%;
  max-height: 240px;
  border-radius: 8px;
  background: #000;
}
.time-row {
  padding: 0 18px;
  margin-top: 12px;
}
.time-text {
  font-size: 12px;
  color: #ccc;
}

.actions {
  display: flex;
  gap: 12px;
  padding: 0 12px;
  margin-top: 16px;
}
.action-btn {
  flex: 1;
  text-align: center;
  padding: 14px 0;
  background: #fff;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
  border: none;
  cursor: pointer;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}
.action-btn.starred {
  color: #f39c12;
  font-weight: 600;
}
.action-btn.danger {
  color: #e74c3c;
}
.action-btn:active {
  background: #f5f5f5;
}

.empty {
  text-align: center;
  padding: 100px 24px;
}
.empty-text {
  font-size: 15px;
  color: #ccc;
}
</style>
