<!-- src/views/Publish.vue - 发布训练项目（视频+图片） -->
<template>
  <div class="page">
    <div class="page-top">
      <span class="back" @click="$router.back()">‹ 返回</span>
      <span class="page-title">发布训练项目</span>
      <span style="width:32px"></span>
    </div>

    <div class="card">
      <div class="card-title">项目名称</div>
      <input class="name-input" v-model="form.name" placeholder="给你的训练项目起个名字" maxlength="20" />
      <span class="char-count">{{form.name.length}}/20</span>
    </div>

    <div class="card">
      <div class="card-title">难度分类</div>
      <div class="diff-group">
        <button :class="{active: form.category === 'basic'}" @click="form.category = 'basic'">🎯 基础</button>
        <button :class="{active: form.category === 'medium'}" @click="form.category = 'medium'">💪 进阶</button>
        <button :class="{active: form.category === 'advanced'}" @click="form.category = 'advanced'">🔥 高级</button>
      </div>
    </div>

    <!-- 演示视频 -->
    <div class="card">
      <div class="card-title">🎬 演示视频（选填）</div>
      <div class="video-upload" @click="!videoPreview && pickVideo()">
        <template v-if="!videoPreview && !compressing">
          <span class="upload-icon">🎬</span>
          <span class="upload-text">点击上传演示视频</span>
          <span class="upload-hint">支持 mp4/webm，最大 50MB，自动压缩至 720p</span>
        </template>
        <template v-if="compressing">
          <div class="compress-loading">
            <div class="compress-spinner"></div>
            <span class="compress-text">正在压缩视频...</span>
            <span class="compress-hint">大文件需要一些时间，请稍候</span>
          </div>
        </template>
        <template v-if="videoPreview && !compressing">
          <video :src="videoPreviewUrl" controls playsinline class="video-preview" />
          <span class="video-name">{{videoName}} ({{formatSize(videoFileSize)}})</span>
          <span class="video-remove" @click.stop="removeVideo">重新选择</span>
        </template>
      </div>
      <input type="file" ref="videoInput" accept="video/*" @change="onVideoChange" style="display:none" />
    </div>

    <!-- 项目图片 -->
    <div class="card">
      <div class="card-title">📸 项目图片（选填，最多9张）</div>
      <div class="image-grid">
        <div class="image-thumb" v-for="(img, i) in imagePreviews" :key="i">
          <img :src="img.url" class="thumb-img" />
          <span class="thumb-remove" @click="removeImage(i)">✕</span>
        </div>
        <div class="image-add" @click="pickImages" v-if="imagePreviews.length < 9">
          <span class="add-icon">+</span>
          <span class="add-text">添加图片</span>
        </div>
      </div>
      <span class="image-hint" v-if="imagePreviews.length > 0">大图自动压缩至 1280px</span>
      <input type="file" ref="imageInput" accept="image/*" multiple @change="onImageChange" style="display:none" />
    </div>

    <div class="card">
      <div class="card-title">项目说明</div>
      <textarea class="desc-input" v-model="form.desc" placeholder="详细描述训练方法、要点、注意事项..." maxlength="500"></textarea>
      <span class="char-count">{{form.desc.length}}/500</span>
    </div>

    <div class="publish-info">
      <span class="info-label">发布人</span>
      <span class="info-value">{{store.userInfo?.nickName || '未登录'}}</span>
    </div>

    <div class="publish-area">
      <button class="btn-primary" @click="handlePublish" :disabled="publishing">
        {{publishing ? '发布中...' : '发布到广场'}}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBilliardStore } from '../stores/billiard'
import { saveFile, compressImage, compressVideo, mediaId } from '../utils/mediaStore'

const store = useBilliardStore()
const router = useRouter()

const videoInput = ref(null)
const imageInput = ref(null)
const videoPreview = ref(false)
const videoPreviewUrl = ref('')
const videoName = ref('')
const videoFileSize = ref(0)
const compressing = ref(false)
const publishing = ref(false)
const imagePreviews = ref([]) // { url: blobUrl, file: File|Blob, mediaId: string }
const blobUrls = ref([]) // track for cleanup

const form = reactive({
  name: '',
  category: 'basic',
  desc: '',
})

function formatSize(bytes) {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / 1024 / 1024).toFixed(1) + 'MB'
}

function pickVideo() {
  videoInput.value?.click()
}

async function onVideoChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > 50 * 1024 * 1024) {
    alert('视频文件不能超过 50MB')
    return
  }

  videoName.value = file.name
  videoFileSize.value = file.size
  videoPreview.value = true
  compressing.value = true

  try {
    const compressed = await compressVideo(file, 1280)
    const url = URL.createObjectURL(compressed)
    blobUrls.value.push(url)
    videoPreviewUrl.value = url
    videoFileSize.value = compressed.size
    // Store the blob for later IndexedDB save
    videoPreview.value = true
    videoPreview._blob = compressed
    videoPreview._mediaId = mediaId('vid')
  } catch(e) {
    console.error('Video compression failed:', e)
    // Fallback: use original file
    const url = URL.createObjectURL(file)
    blobUrls.value.push(url)
    videoPreviewUrl.value = url
    videoFileSize.value = file.size
    videoPreview._blob = file
    videoPreview._mediaId = mediaId('vid')
  }
  compressing.value = false
}

function removeVideo() {
  videoPreview.value = false
  videoPreviewUrl.value = ''
  videoName.value = ''
  videoFileSize.value = 0
  if (videoInput.value) videoInput.value.value = ''
}

function pickImages() {
  imageInput.value?.click()
}

async function onImageChange(e) {
  const files = Array.from(e.target.files || [])
  const remaining = 9 - imagePreviews.value.length
  if (remaining <= 0) return

  for (const file of files.slice(0, remaining)) {
    try {
      const compressed = await compressImage(file, 1280)
      const url = URL.createObjectURL(compressed)
      blobUrls.value.push(url)
      imagePreviews.value.push({
        url,
        blob: compressed,
        mediaId: mediaId('img')
      })
    } catch(e) {
      console.error('Image compression failed:', e)
      const url = URL.createObjectURL(file)
      blobUrls.value.push(url)
      imagePreviews.value.push({
        url,
        blob: file,
        mediaId: mediaId('img')
      })
    }
  }
  // Reset input
  if (imageInput.value) imageInput.value.value = ''
}

function removeImage(index) {
  const item = imagePreviews.value[index]
  if (item) {
    const urlIndex = blobUrls.value.indexOf(item.url)
    if (urlIndex >= 0) blobUrls.value.splice(urlIndex, 1)
    URL.revokeObjectURL(item.url)
  }
  imagePreviews.value.splice(index, 1)
}

async function handlePublish() {
  if (!store.isLoggedIn) { alert('请先登录'); router.push('/profile'); return }
  if (!form.name.trim()) { alert('请输入项目名称'); return }
  if (!form.desc.trim()) { alert('请输入项目说明'); return }

  publishing.value = true

  try {
    // Save video to IndexedDB
    let videoMediaId = null
    if (videoPreview.value && videoPreview._blob) {
      videoMediaId = videoPreview._mediaId
      await saveFile(videoMediaId, videoPreview._blob)
    }

    // Save images to IndexedDB
    const imageMediaIds = []
    for (const img of imagePreviews.value) {
      if (img.blob && img.mediaId) {
        await saveFile(img.mediaId, img.blob)
        imageMediaIds.push(img.mediaId)
      }
    }

    store.publishProject({
      id: 'user_' + Date.now(),
      name: form.name.trim(),
      desc: form.desc.trim(),
      category: form.category,
      videoMediaId,
      imageMediaIds,
      publisher: store.userInfo.nickName,
      publisherId: store.userInfo.id || 'local_' + Date.now(),
      likes: 0,
      favs: 0,
      participants: 0,
      createdAt: store.formatDate(new Date())
    })

    alert('发布成功 🎉')
    router.push('/square')
  } catch(e) {
    console.error('Publish failed:', e)
    alert('发布失败，请重试')
  } finally {
    publishing.value = false
  }
}

// Cleanup blob URLs
onUnmounted(() => {
  blobUrls.value.forEach(url => {
    try { URL.revokeObjectURL(url) } catch(e) {}
  })
})
</script>

<style scoped>
.page { padding: 0 12px 140px; }
.page-top { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; }
.back { font-size: 24px; color: #333; cursor: pointer; padding: 4px 8px; }
.page-title { font-size: 18px; font-weight: 700; color: #1a1a2e; }

.name-input {
  width: 100%; padding: 12px; font-size: 16px; font-weight: 600; border: none;
  background: #f8f9fa; border-radius: 8px; outline: none;
}
.char-count { display: block; text-align: right; font-size: 11px; color: #ccc; margin-top: 6px; }

.diff-group { display: flex; gap: 8px; }
.diff-group button {
  flex: 1; padding: 10px; border: 2px solid #f0f0f0; border-radius: 8px; font-size: 13px;
  background: #fff; cursor: pointer; transition: all 0.2s; color: #666;
}
.diff-group button.active {
  border-color: #2ecc71; background: rgba(46,204,113,0.06); color: #27ae60; font-weight: 600;
}

/* 视频上传 */
.video-upload {
  background: #f8f9fa; border-radius: 10px; padding: 24px; text-align: center; cursor: pointer;
}
.upload-icon { font-size: 32px; display: block; margin-bottom: 6px; }
.upload-text { display: block; font-size: 14px; color: #666; }
.upload-hint { display: block; font-size: 12px; color: #b0b0b0; margin-top: 4px; }
.video-preview { width: 100%; border-radius: 8px; margin-bottom: 8px; max-height: 200px; }
.video-name { display: block; font-size: 12px; color: #b0b0b0; margin-top: 4px; }
.video-remove { display: inline-block; font-size: 13px; color: #e74c3c; margin-top: 8px; cursor: pointer; }

/* 压缩加载 */
.compress-loading { padding: 20px 0; }
.compress-spinner {
  width: 36px; height: 36px; border: 3px solid #e0e0e0; border-top-color: #2ecc71;
  border-radius: 50%; margin: 0 auto 12px;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.compress-text { display: block; font-size: 15px; font-weight: 600; color: #333; }
.compress-hint { display: block; font-size: 12px; color: #b0b0b0; margin-top: 4px; }

/* 图片上传 */
.image-grid {
  display: flex; flex-wrap: wrap; gap: 8px;
}
.image-thumb {
  width: 100px; height: 100px; border-radius: 8px; overflow: hidden; position: relative;
}
.thumb-img { width: 100%; height: 100%; object-fit: cover; }
.thumb-remove {
  position: absolute; top: 2px; right: 2px; width: 20px; height: 20px;
  background: rgba(0,0,0,0.5); color: #fff; border-radius: 50%;
  font-size: 11px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; line-height: 1;
}
.image-add {
  width: 100px; height: 100px; border: 2px dashed #ddd; border-radius: 8px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
}
.image-add:active { border-color: #2ecc71; background: rgba(46,204,113,0.04); }
.add-icon { font-size: 24px; color: #ccc; }
.add-text { font-size: 10px; color: #ccc; margin-top: 2px; }
.image-hint { display: block; font-size: 11px; color: #b0b0b0; margin-top: 8px; }

.desc-input {
  width: 100%; min-height: 120px; padding: 12px; font-size: 14px; line-height: 1.6;
  border: none; background: #f8f9fa; border-radius: 8px; outline: none; resize: vertical;
}

.publish-info {
  display: flex; justify-content: space-between; align-items: center; padding: 14px 4px;
}
.info-label { font-size: 14px; color: #999; }
.info-value { font-size: 14px; color: #2ecc71; font-weight: 600; }

.publish-area {
  position: fixed; bottom: 60px; left: 0; right: 0; padding: 12px 24px;
  background: #fff; box-shadow: 0 -2px 12px rgba(0,0,0,0.06); max-width: 480px; margin: 0 auto;
}
</style>
