<!-- src/views/Record.vue - Keep 风格训练记录 -->
<template>
  <div class="page">
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBilliardStore } from '../stores/billiard'

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
  // 从训练结束带过来的实际时长
  const durationParam = route.query.duration
  if (durationParam) {
    duration.value = parseInt(durationParam) || 60
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
  hitRate.value = totalShots.value > 0 ? Math.round(hits.value / totalShots.value * 100) : 0
}

function quickHit(percent) {
  hits.value = Math.round(totalShots.value * percent / 100)
  hitRate.value = percent
}

function saveRecord() {
  if (!selectedProject.value) { alert('请选择训练项目'); return }

  store.addRecord({
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
    createdAt: new Date().toISOString()
  })

  alert(starred.value ? '已保存并收藏心得 ⭐' : '记录成功 ✅')
  hits.value = 0; hitRate.value = 0; note.value = ''; starred.value = false
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

.save-area {
  position: fixed; bottom: 60px; left: 0; right: 0; padding: 10px 24px;
  background: #fff; box-shadow: 0 -2px 12px rgba(0,0,0,0.06); max-width: 480px; margin: 0 auto;
}
.star-row { display: flex; justify-content: center; margin-bottom: 8px; cursor: pointer; }
.star-btn { font-size: 14px; color: #b0b0b0; }
.star-btn.active { color: #f39c12; font-weight: 600; }
</style>
