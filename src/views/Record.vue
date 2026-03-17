<!-- src/views/Record.vue - Keep 风格训练记录 -->
<template>
  <div class="page">
    <!-- 压缩中提示 -->
    <div class="processing-hint" v-if="processing">{{processing}}</div>

    <div class="page-title-bar">
      <span class="back-btn" @click="goBack">‹ 返回</span>
      <span class="page-title">记录训练</span>
      <span class="page-title-sub">{{store.getToday()}}</span>
    </div>

    <!-- 训练项目 -->
    <div class="card">
      <div class="card-title">训练项目</div>
      <div class="project-toggle" @click="showPicker = !showPicker">
        <span :class="selectedProject ? 'selected' : 'placeholder'">{{selectedProject || '点击选择项目'}}</span>
        <span class="arrow">›</span>
      </div>

      <!-- 引导去广场（下拉为空时） -->
      <div class="guide-square" v-if="showPicker && store.myProjectList.length === 0">
        <span class="guide-text">还没有收藏项目？</span>
        <button class="btn-go-square" @click="$router.push('/square')">去项目广场看看 →</button>
      </div>

      <!-- 我的项目 -->
      <div class="project-grid" v-if="showPicker && store.myProjectList.length > 0">
        <span class="project-tag" :class="{active: selectedProject === item.name}"
              v-for="item in store.myProjectList" :key="item.id" @click="selectedProject = item.name; selectedProjectId = item.id; showPicker = false">
          {{item.name}}
        </span>
      </div>
    </div>

    <!-- 命中率 -->
    <div class="card">
      <div class="card-title">命中率</div>
      <div class="quick-rate">
        <button class="rate-btn rate-low" @click="quickHit(30)">30%</button>
        <button class="rate-btn rate-mid" @click="quickHit(50)">50%</button>
        <button class="rate-btn rate-good" @click="quickHit(70)">70%</button>
        <button class="rate-btn rate-great" @click="quickHit(90)">90%</button>
      </div>
      <div class="input-row">
        <div class="input-group">
          <span class="input-label">总出杆</span>
          <input type="number" v-model.number="totalShots" @input="calcHitRate" class="input-field" />
          <span class="input-unit">杆</span>
        </div>
        <span class="input-divider">/</span>
        <div class="input-group">
          <span class="input-label">命中</span>
          <input type="number" v-model.number="hits" @input="calcHitRate" class="input-field" />
          <span class="input-unit">杆</span>
        </div>
      </div>
      <div class="hitrate-display">
        <div class="hitrate-ring" :class="hitRate >= 70 ? 'good' : hitRate >= 50 ? 'mid' : 'bad'">
          <span class="hitrate-num">{{hitRate}}</span>
          <span class="hitrate-percent">%</span>
        </div>
      </div>
    </div>

    <!-- 训练时长 -->
    <div class="card">
      <div class="card-title">
        训练时长
        <span class="actual-tag" v-if="isActualTime">实际计时</span>
      </div>
      <input type="range" min="5" max="300" step="5" v-model.number="duration" class="slider" />
      <span class="duration-text">{{duration}} 分钟</span>
    </div>

    <!-- 媒体上传（图片+视频） -->
    <div class="card">
      <div class="card-title">训练留影</div>
      <div class="media-area">
        <!-- 已上传的图片预览 -->
        <div class="media-grid" v-if="imagePreviews.length > 0">
          <div class="media-thumb" v-for="(img, i) in imagePreviews" :key="'img'+i">
            <img :src="img.url" class="thumb-img" />
            <span class="thumb-remove" @click="removeImage(i)">✕</span>
          </div>
        </div>
        <!-- 已上传的视频预览 -->
        <div class="video-thumb" v-if="videoPreviewUrl">
          <video :src="videoPreviewUrl" playsinline class="thumb-video" />
          <span class="thumb-remove" @click="removeVideo">✕</span>
        </div>
        <!-- 上传按钮 -->
        <div class="upload-btns" v-if="imagePreviews.length < 9 && !videoPreviewUrl">
          <div class="upload-btn" @click="pickImage">
            <span class="upload-icon">📷</span>
            <span class="upload-text">拍照/相册</span>
          </div>
          <div class="upload-btn" @click="pickVideo">
            <span class="upload-icon">🎬</span>
            <span class="upload-text">录视频</span>
          </div>
        </div>
        <span class="upload-hint">图片最多9张，视频最多1个，自动压缩</span>
      </div>
      <input type="file" ref="imageInput" accept="image/*" multiple capture="environment" @change="onImageChange" style="display:none" />
      <input type="file" ref="videoInput" accept="video/*" capture="environment" @change="onVideoChange" style="display:none" />
    </div>

    <!-- 训练心得 -->
    <div class="card">
      <div class="card-title">训练心得</div>
      <textarea v-model="note" placeholder="今天感觉怎么样？有什么收获..." class="note-input"></textarea>
    </div>

    <!-- 收藏 + 保存 -->
    <div class="save-area">
      <div class="star-row" @click="starred = !starred">
        <span class="star-btn" :class="{active: starred}">{{starred ? '⭐ 已收藏' : '☆ 心得收藏'}}</span>
      </div>
      <button class="btn-primary" @click="saveRecord">保存记录</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBilliardStore } from '../stores/billiard'
import { saveFile, compressImage, compressVideo, mediaId } from '../utils/mediaStore'

const store = useBilliardStore()
const route = useRoute()
const router = useRouter()

const showPicker = ref(false)
const selectedProject = ref('')
const selectedProjectId = ref('')
const duration = ref(60)
const totalShots = ref(50)
const hits = ref(0)
const hitRate = ref(0)
const note = ref('')
const starred = ref(false)
const isActualTime = ref(false)

// 媒体
const imageInput = ref(null)
const videoInput = ref(null)
const imagePreviews = ref([])  // { url, mediaId, blob }
const videoPreviewUrl = ref('')
const videoMediaId = ref('')
const videoCompressed = ref(false)
const blobUrls = ref([])
const processing = ref('')

// ===== 媒体处理 =====
function pickImage() { imageInput.value?.click() }
function pickVideo() { videoInput.value?.click() }

async function onImageChange(e) {
  const files = Array.from(e.target.files || [])
  const remaining = 9 - imagePreviews.value.length
  if (remaining <= 0) return
  for (const file of files.slice(0, remaining)) {
    processing.value = '图片压缩中...'
    const compressed = await compressImage(file, 1280)
    const id = mediaId('img')
    const url = URL.createObjectURL(compressed)
    blobUrls.value.push(url)
    imagePreviews.value.push({ url, mediaId: id, blob: compressed })
    await saveFile(id, compressed)
  }
  processing.value = ''
  e.target.value = ''
}

async function onVideoChange(e) {
  const file = (e.target.files || [])[0]
  if (!file) return
  // 限制 200MB
  if (file.size > 200 * 1024 * 1024) {
    alert('视频太大啦，请控制在 200MB 以内')
    e.target.value = ''
    return
  }
  const url = URL.createObjectURL(file)
  blobUrls.value.push(url)
  videoPreviewUrl.value = url

  // 大于 5MB 自动压缩
  if (file.size >= 5 * 1024 * 1024) {
    processing.value = '视频压缩中，请稍候...'
    const compressed = await compressVideo(file, 1280)
    if (compressed && compressed !== file) {
      const id = mediaId('vid')
      videoMediaId.value = id
      await saveFile(id, compressed)
      videoCompressed.value = true
      // 更新预览 URL
      URL.revokeObjectURL(videoPreviewUrl.value)
      const newUrl = URL.createObjectURL(compressed)
      blobUrls.value.push(newUrl)
      videoPreviewUrl.value = newUrl
    } else {
      const id = mediaId('vid')
      videoMediaId.value = id
      await saveFile(id, file)
    }
  } else {
    const id = mediaId('vid')
    videoMediaId.value = id
    await saveFile(id, file)
  }
  processing.value = ''
  e.target.value = ''
}

function removeImage(index) {
  const item = imagePreviews.value[index]
  URL.revokeObjectURL(item.url)
  blobUrls.value = blobUrls.value.filter(u => u !== item.url)
  imagePreviews.value.splice(index, 1)
}

function removeVideo() {
  if (videoPreviewUrl.value) {
    URL.revokeObjectURL(videoPreviewUrl.value)
    blobUrls.value = blobUrls.value.filter(u => u !== videoPreviewUrl.value)
  }
  videoPreviewUrl.value = ''
  videoMediaId.value = ''
  videoCompressed.value = false
}

// 从 URL 参数自动选中项目和时长
onMounted(() => {
  const projectId = route.query.projectId
  if (projectId) {
    const project = store.getSquareProject(projectId)
    if (project) {
      selectedProject.value = project.name
      selectedProjectId.value = project.id
    }
  }
  // 从训练结束带过来的实际时长（吸附到滑块步长）
  const durationParam = route.query.duration
  if (durationParam) {
    const raw = parseInt(durationParam) || 60
    duration.value = Math.max(5, Math.min(300, Math.round(raw / 5) * 5))
    isActualTime.value = true
  }
  // 从实时计数器自动填入数据
  const shotsParam = route.query.shots
  if (shotsParam) {
    totalShots.value = parseInt(shotsParam) || 50
  }
  const hitsParam = route.query.hits
  if (hitsParam) {
    hits.value = parseInt(hitsParam) || 0
    calcHitRate()
  }
  const hitRateParam = route.query.hitRate
  if (hitRateParam && !hitsParam) {
    hitRate.value = parseInt(hitRateParam) || 0
  }
})

function calcHitRate() {
  if (totalShots.value > 0 && hits.value > totalShots.value) {
    hits.value = totalShots.value
  }
  hitRate.value = totalShots.value > 0 ? Math.round(hits.value / totalShots.value * 100) : 0
}

function quickHit(percent) {
  hits.value = Math.round(totalShots.value * percent / 100)
  if (hits.value > totalShots.value) hits.value = totalShots.value
  calcHitRate()
}

async function saveRecord() {
  if (!selectedProject.value) { alert('请选择训练项目'); return }

  const mediaIds = [
    ...imagePreviews.value.map(img => img.mediaId),
    ...(videoMediaId.value ? [videoMediaId.value] : [])
  ]

  await store.addRecord({
    id: Date.now().toString(),
    project: selectedProject.value,
    projectId: selectedProjectId.value,
    duration: duration.value,
    totalShots: totalShots.value,
    hits: hits.value,
    hitRate: hitRate.value,
    note: note.value,
    date: store.getToday(),
    starred: starred.value,
    mediaIds: mediaIds.length > 0 ? mediaIds : undefined,
    createdAt: new Date().toISOString()
  })

  alert(starred.value ? '已保存并收藏心得 ⭐' : '记录成功 ✅')
  cleanupAndGoBack()
}

// 清理 + 返回
function cleanupAndGoBack() {
  hits.value = 0; hitRate.value = 0; note.value = ''; starred.value = false
  imagePreviews.value.forEach(img => URL.revokeObjectURL(img.url))
  imagePreviews.value = []
  if (videoPreviewUrl.value) URL.revokeObjectURL(videoPreviewUrl.value)
  videoPreviewUrl.value = ''; videoMediaId.value = ''
  blobUrls.value = []
  processing.value = ''
  goBack()
}

// 智能返回
function goBack() {
  const from = route.query.from
  if (from === 'square') {
    router.back()
  } else if (from === 'training') {
    router.push('/training')
  } else {
    router.push('/')
  }
}

onUnmounted(() => {
  blobUrls.value.forEach(url => URL.revokeObjectURL(url))
})
</script>

<style scoped>
.page { padding-bottom: 140px; }
.page-title-bar { padding: 16px 12px; display: flex; align-items: baseline; gap: 8px; }
.back-btn { font-size: 22px; color: #2ecc71; cursor: pointer; font-weight: 700; }
.back-btn:active { opacity: 0.7; }
.page-title { font-size: 22px; font-weight: 800; color: #1a1a2e; }
.page-title-sub { font-size: 13px; color: #b0b0b0; margin-left: auto; }
.actual-tag { font-size: 11px; padding: 2px 8px; background: rgba(46,204,113,0.12); color: #27ae60; border-radius: 8px; font-weight: 600; margin-left: 6px; }

.picker-label { font-size: 12px; color: #b0b0b0; font-weight: 600; margin-bottom: 8px; }

.project-toggle {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px; background: #f8f9fa; border-radius: 8px; cursor: pointer;
}
.project-toggle .selected { font-size: 16px; font-weight: 600; color: #1a1a2e; }
.project-toggle .placeholder { font-size: 14px; color: #ccc; }
.arrow { font-size: 16px; color: #ccc; }

.guide-square { text-align: center; padding: 16px 0 8px; }
.guide-text { display: block; font-size: 13px; color: #b0b0b0; margin-bottom: 8px; }
.btn-go-square {
  padding: 8px 20px; background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: #fff; border: none; border-radius: 16px; font-size: 13px; font-weight: 600; cursor: pointer;
}

.project-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.project-tag {
  padding: 8px 14px; background: #f5f5f5; border-radius: 16px; font-size: 14px;
  color: #666; font-weight: 500; cursor: pointer; transition: all 0.2s;
}
.project-tag.active {
  background: linear-gradient(135deg, #2ecc71, #27ae60); color: #fff;
  box-shadow: 0 2px 8px rgba(46,204,113,0.3);
}

.quick-rate { display: flex; gap: 8px; margin-bottom: 16px; }
.rate-btn {
  flex: 1; text-align: center; padding: 10px 0; border-radius: 8px; font-size: 14px;
  font-weight: 600; border: none; cursor: pointer;
}
.rate-low { background: rgba(231,76,60,0.1); color: #e74c3c; }
.rate-mid { background: rgba(255,107,53,0.1); color: #ff6b35; }
.rate-good { background: rgba(46,204,113,0.1); color: #2ecc71; }
.rate-great { background: rgba(52,152,219,0.1); color: #3498db; }

.input-row { display: flex; align-items: center; justify-content: center; gap: 12px; }
.input-group { display: flex; align-items: center; gap: 6px; }
.input-label { font-size: 14px; color: #999; }
.input-field {
  width: 60px; text-align: center; font-size: 20px; font-weight: 800; color: #1a1a2e;
  border: none; border-bottom: 2px solid #2ecc71; background: transparent; padding: 4px 0; outline: none;
}
.input-unit { font-size: 13px; color: #b0b0b0; }
.input-divider { font-size: 18px; color: #ddd; }

.hitrate-display { display: flex; justify-content: center; margin-top: 18px; }
.hitrate-ring {
  width: 80px; height: 80px; border-radius: 50%; display: flex; flex-direction: column;
  align-items: center; justify-content: center; border: 4px solid #2ecc71; transition: all 0.3s;
}
.hitrate-ring.good { border-color: #2ecc71; background: rgba(46,204,113,0.06); }
.hitrate-ring.mid { border-color: #ff6b35; background: rgba(255,107,53,0.06); }
.hitrate-ring.bad { border-color: #e74c3c; background: rgba(231,76,60,0.06); }
.hitrate-num { font-size: 26px; font-weight: 800; color: #1a1a2e; line-height: 1; }
.hitrate-percent { font-size: 11px; color: #b0b0b0; }

.slider { width: 100%; accent-color: #2ecc71; margin: 4px 0; }
.duration-text { display: block; text-align: center; font-size: 15px; font-weight: 700; color: #2ecc71; margin-top: 8px; }

.note-input {
  width: 100%; min-height: 80px; font-size: 14px; line-height: 1.6; color: #333;
  background: #f8f9fa; border-radius: 8px; padding: 12px; border: none; outline: none; resize: vertical;
}

/* 媒体上传 */
.media-area { margin-top: 8px; }
.media-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.media-thumb, .video-thumb {
  position: relative; width: 80px; height: 80px; border-radius: 10px;
  overflow: hidden; flex-shrink: 0;
}
.thumb-img { width: 100%; height: 100%; object-fit: cover; }
.thumb-video { width: 100%; height: 100%; object-fit: cover; border-radius: 10px; }
.thumb-remove {
  position: absolute; top: 2px; right: 2px; width: 20px; height: 20px;
  background: rgba(0,0,0,0.55); color: #fff; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; cursor: pointer; line-height: 1;
}
.upload-btns { display: flex; gap: 10px; margin-bottom: 8px; }
.upload-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  padding: 14px 0; background: #f8f9fa; border-radius: 10px; cursor: pointer;
  transition: background 0.2s;
}
.upload-btn:active { background: #f0f0f0; }
.upload-icon { font-size: 24px; margin-bottom: 4px; }
.upload-text { font-size: 12px; color: #666; font-weight: 500; }
.upload-hint { display: block; font-size: 11px; color: #ccc; margin-top: 4px; }
.processing-hint {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.75); color: #fff; padding: 14px 24px;
  border-radius: 10px; font-size: 14px; z-index: 999; pointer-events: none;
}

.save-area {
  position: fixed; bottom: 60px; left: 0; right: 0; padding: 10px 24px;
  background: #fff; box-shadow: 0 -2px 12px rgba(0,0,0,0.06); max-width: 480px; margin: 0 auto;
}
.star-row { display: flex; justify-content: center; margin-bottom: 8px; cursor: pointer; }
.star-btn { font-size: 14px; color: #b0b0b0; }
.star-btn.active { color: #f39c12; font-weight: 600; }
</style>
