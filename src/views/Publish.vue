<!-- src/views/Publish.vue - 发布训练项目 -->
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

    <div class="card">
      <div class="card-title">演示视频（选填）</div>
      <div class="video-upload" @click="pickVideo">
        <template v-if="!videoPreview">
          <span class="upload-icon">🎬</span>
          <span class="upload-text">点击上传演示视频</span>
          <span class="upload-hint">支持 mp4 格式，最长30秒</span>
        </template>
        <template v-else>
          <span class="video-ok">✅ 视频已选择</span>
          <span class="video-name">{{videoName}}</span>
        </template>
      </div>
      <input type="file" ref="videoInput" accept="video/mp4" @change="onVideoChange" style="display:none" />
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
      <button class="btn-primary" @click="handlePublish">发布到广场</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useBilliardStore } from '../stores/billiard'

const store = useBilliardStore()
const router = useRouter()

const videoInput = ref(null)
const videoPreview = ref(false)
const videoName = ref('')

const form = reactive({
  name: '',
  category: 'basic',
  desc: '',
  videoUrl: ''
})

function pickVideo() {
  videoInput.value?.click()
}

function onVideoChange(e) {
  const file = e.target.files?.[0]
  if (file) {
    videoPreview.value = true
    videoName.value = file.name
    form.videoUrl = 'local_' + file.name
  }
}

function handlePublish() {
  if (!store.isLoggedIn) { alert('请先登录'); router.push('/profile'); return }
  if (!form.name.trim()) { alert('请输入项目名称'); return }
  if (!form.desc.trim()) { alert('请输入项目说明'); return }

  store.publishProject({
    id: 'user_' + Date.now(),
    name: form.name.trim(),
    desc: form.desc.trim(),
    category: form.category,
    videoUrl: form.videoUrl,
    publisher: store.userInfo.nickName,
    publisherId: store.userInfo.id || 'local_' + Date.now(),
    likes: 0,
    favs: 0,
    participants: 0,
    createdAt: store.formatDate(new Date())
  })

  alert('发布成功 🎉')
  router.push('/square')
}
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

.video-upload {
  background: #f8f9fa; border-radius: 10px; padding: 24px; text-align: center; cursor: pointer;
}
.upload-icon { font-size: 32px; display: block; margin-bottom: 6px; }
.upload-text { display: block; font-size: 14px; color: #666; }
.upload-hint { display: block; font-size: 12px; color: #b0b0b0; margin-top: 4px; }
.video-ok { display: block; font-size: 15px; color: #2ecc71; font-weight: 600; }
.video-name { display: block; font-size: 12px; color: #b0b0b0; margin-top: 4px; }

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
