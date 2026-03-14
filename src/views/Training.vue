<!-- src/views/Training.vue - 今日训练页（v3 实时计数器版） -->
<template>
  <div class="page">

    <!-- ====== 全屏实时训练覆盖层 ====== -->
    <div class="live-overlay" v-if="store.currentTraining && liveMode">
      <div class="live-header">
        <button class="btn-back" @click="handleExitLive">←</button>
        <span class="live-project-name">{{activeProjectName}}</span>
        <span class="live-timer-wrap">
          <span class="live-timer" :class="elapsedSeconds >= 3600 ? 'warn' : ''">{{formatTime(elapsedSeconds)}}</span>
          <button class="btn-pause" @click="togglePause">{{paused ? '▶ 继续' : '⏸ 暂停'}}</button>
        </span>
      </div>

      <!-- 暂停遮罩 -->
      <div class="pause-overlay" v-if="paused">
        <span class="pause-icon">⏸</span>
        <span class="pause-text">训练暂停中</span>
        <button class="btn-resume" @click="togglePause">▶ 继续训练</button>
      </div>

      <template v-else>
        <div class="live-stats">
          <div class="live-stat">
            <span class="live-stat-num">{{liveStats.total}}</span>
            <span class="live-stat-label">总杆数</span>
          </div>
          <div class="live-stat-divider"></div>
          <div class="live-stat">
            <span class="live-stat-num good">{{liveStats.hits}}</span>
            <span class="live-stat-label">进球</span>
          </div>
          <div class="live-stat-divider"></div>
          <div class="live-stat">
            <span class="live-stat-num" :class="liveStats.hitRate >= 70 ? 'good' : liveStats.hitRate >= 50 ? 'mid' : 'bad'">{{liveStats.hitRate}}%</span>
            <span class="live-stat-label">进球率</span>
          </div>
        </div>

        <!-- 批量输入区 -->
        <div class="batch-area">
          <div class="batch-row">
            <span class="batch-label">一组</span>
            <div class="batch-stepper">
              <button class="stepper-btn" @click="batchCount = Math.max(1, batchCount - 1)">−</button>
              <input class="batch-input" type="number" v-model.number="batchCount" min="1" max="200" />
              <button class="stepper-btn" @click="batchCount = Math.min(200, batchCount + 1)">+</button>
            </div>
            <span class="batch-unit">颗</span>
          </div>
          <div class="batch-buttons">
            <button class="btn-batch-hit" @click="handleBatch(true)">
              ✅ 进球 {{batchCount}}颗
            </button>
            <button class="btn-batch-miss" @click="handleBatch(false)">
              ❌ 失误 {{batchCount}}颗
            </button>
          </div>
        </div>

        <!-- 单杆按钮 -->
        <div class="live-buttons">
          <button class="btn-hit" @click="store.recordShot(true)">
            <span class="btn-hit-icon">✅</span>
            <span class="btn-hit-text">进球</span>
          </button>
          <button class="btn-miss" @click="store.recordShot(false)">
            <span class="btn-miss-icon">❌</span>
            <span class="btn-miss-text">失误</span>
          </button>
        </div>

        <div class="live-actions">
          <button class="btn-undo" @click="store.undoShot()" :disabled="liveStats.total === 0">↩️ 撤销</button>
          <button class="btn-end-live" @click="handleEndLive">🏁 结束训练</button>
        </div>
      </template>
    </div>

    <!-- ====== 正常训练页 ====== -->
    <template v-if="!liveMode || !store.currentTraining">

      <div class="page-top">
        <span class="page-title">📋 今日训练</span>
        <span class="page-date">{{store.getToday()}}</span>
      </div>

      <!-- 教练作业（学员视角） -->
      <div class="section" v-if="studentHomework.length > 0 && !store.isCoach">
        <div class="section-title">
          <div class="title-bar" style="background:linear-gradient(180deg,#3498db,#2980b9)"></div>
          <span>📝 教练作业</span>
          <span class="section-count">{{studentHomework.length}}项</span>
        </div>
        <div class="homework-list">
          <div class="homework-card" v-for="hw in studentHomework" :key="hw.id">
            <div class="homework-top">
              <span class="homework-note" v-if="hw.note">{{hw.note}}</span>
              <span class="homework-date">{{formatDate(hw.createdAt)}}</span>
            </div>
            <div class="homework-items">
              <span class="homework-tag" v-for="(item, i) in hw.items" :key="i">
                {{item.name || item.projectId}}
              </span>
            </div>
            <button class="btn-load-homework" @click="loadHomeworkToCart(hw)">🛒 加入今日计划</button>
            <button class="btn-done-homework" @click="store.completeHomework(hw.id)">✅ 标记完成</button>
          </div>
        </div>
      </div>

      <!-- 推荐训练方案（计划为空时显示） -->
      <div class="section" v-if="planItems.length === 0 && studentHomework.length === 0">
        <div class="section-title">
          <div class="title-bar" style="background:linear-gradient(180deg,#f39c12,#e67e22)"></div>
          <span>推荐训练方案</span>
        </div>
        <div class="rec-grid">
          <div class="rec-card" v-for="plan in store.recommendedPlans" :key="plan.id">
            <span class="rec-name">{{plan.name}}</span>
            <span class="rec-desc">{{plan.desc}}</span>
            <span class="rec-items">{{plan.items.length}}个训练项目</span>
            <button class="btn-load-rec" @click="handleLoadRec(plan.id)">一键加载</button>
          </div>
        </div>
      </div>

      <!-- 今日训练计划列表 -->
      <div class="section" v-if="planItems.length > 0">
        <div class="section-title">
          <div class="title-bar"></div>
          <span>训练计划</span>
          <span class="section-count">{{completedCount}}/{{planItems.length}} 完成</span>
        </div>
        <div class="plan-list">
          <div class="plan-card" v-for="item in planItems" :key="item.projectId">

            <div class="plan-left" @click="handleStart(item)">
              <div class="plan-icon" :class="item.category">
                {{item.category === 'basic' ? '🎯' : item.category === 'medium' ? '💪' : '🔥'}}
              </div>
              <div class="plan-info">
                <span class="plan-name">{{item.name}}</span>
                <span class="plan-meta">
                  ⏱ 预计{{item.duration}}分钟 · 进球率{{item.targetRate}}%
                </span>
              </div>
            </div>

            <div class="plan-right">
              <!-- 已完成 -->
              <template v-if="isProjectDone(item.projectId)">
                <span class="plan-status done">✅ 已完成</span>
                <span class="train-count" v-if="getProjectTrainCount(item.name) > 0">
                  已练{{getProjectTrainCount(item.name)}}次
                </span>
                <button class="btn-again" @click="handleStart(item)">再练</button>
              </template>

              <!-- 待训练 -->
              <template v-else>
                <button class="btn-start" @click="handleStart(item)" :disabled="!!store.currentTraining">
                  开始
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- 保存本次计划 -->
      <div class="save-plan-area" v-if="planItems.length > 0">
        <button class="btn-save-plan" @click="handleSavePlan">📌 保存本次计划</button>
      </div>

      <!-- 添加训练按钮 -->
      <div class="add-area">
        <button class="btn-add" @click="showAddPicker = true">+ 添加训练</button>
      </div>

      <!-- 选择项目弹层 -->
      <div class="picker-overlay" v-if="showAddPicker" @click.self="showAddPicker = false">
        <div class="picker-sheet">
          <div class="picker-header">
            <span class="picker-title">选择训练项目</span>
            <span class="picker-close" @click="showAddPicker = false">✕</span>
          </div>
          <template v-if="store.myProjectList.length > 0">
            <div class="picker-list">
              <div class="picker-item" v-for="p in store.myProjectList" :key="p.id" @click="quickTrain(p)">
                <span class="picker-item-name">{{p.name}}</span>
                <span class="picker-item-cat" :class="p.category">{{categoryLabel(p.category)}}</span>
              </div>
            </div>
          </template>
          <template v-if="store.myProjectList.length === 0">
            <div class="picker-empty">
              <span class="picker-empty-icon">🏪</span>
              <span class="picker-empty-text">还没有收藏项目</span>
              <span class="picker-empty-desc">去项目广场看看吧</span>
              <button class="btn-go-square" @click="$router.push('/square')">逛广场</button>
            </div>
          </template>
        </div>
      </div>

      <!-- 今日训练记录 -->
      <div class="section" v-if="store.todayRecords.length > 0">
        <div class="section-title">
          <div class="title-bar"></div>
          <span>今日记录</span>
          <span class="section-count">{{store.todayRecords.length}}次</span>
        </div>
        <div class="record-list">
          <div class="record-card" v-for="r in store.todayRecords" :key="r.id" @click="$router.push('/detail/' + r.id)">
            <div class="record-left">
              <div class="record-icon" :class="r.hitRate >= 70 ? 'good' : r.hitRate >= 50 ? 'mid' : 'bad'">
                {{r.hitRate >= 70 ? '🔥' : r.hitRate >= 50 ? '💪' : '🎯'}}
              </div>
              <div class="record-info">
                <span class="record-name">{{r.project}}</span>
                <span class="record-meta">{{r.duration}}分钟 · {{r.totalShots}}杆</span>
              </div>
            </div>
            <div class="record-right">
              <span class="record-rate" :class="r.hitRate >= 70 ? 'good' : r.hitRate >= 50 ? 'mid' : 'bad'">{{r.hitRate}}%</span>
              <span class="card-arrow">›</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 教练作业（教练视角） -->
      <div class="section" v-if="store.isCoach && coachHomework.length > 0">
        <div class="section-title">
          <div class="title-bar" style="background:linear-gradient(180deg,#3498db,#2980b9)"></div>
          <span>我布置的作业</span>
        </div>
        <div class="homework-list">
          <div class="homework-card" v-for="hw in coachHomework" :key="hw.id">
            <div class="homework-top">
              <span class="homework-note" v-if="hw.note">{{hw.note}}</span>
              <span class="homework-status" :class="hw.completed ? 'done' : 'pending'">
                {{hw.completed ? '✅ 已完成' : '⏳ 进行中'}}
              </span>
            </div>
            <div class="homework-student">
              学员：{{store.getStudentById(hw.studentId)?.name || '未知'}}
            </div>
            <div class="homework-meta">{{formatDate(hw.createdAt)}}</div>
          </div>
        </div>
      </div>

      <!-- 历史训练计划 -->
      <div class="section" v-if="store.planHistory.length > 0">
        <div class="section-title">
          <div class="title-bar"></div>
          <span>历史计划</span>
          <span class="section-count">{{store.planHistory.length}}个</span>
        </div>
        <div class="history-list">
          <div class="history-card" v-for="plan in store.planHistory" :key="plan.id">
            <div class="history-top">
              <span class="history-date">{{plan.date}}</span>
              <span class="history-meta">{{plan.items.length}}个项目 · 共{{planTotalDuration(plan)}}分钟</span>
            </div>
            <div class="history-items">
              <span class="history-tag" v-for="item in plan.items.slice(0, 5)" :key="item.projectId">
                {{item.name}}
              </span>
              <span class="history-tag more" v-if="plan.items.length > 5">+{{plan.items.length - 5}}</span>
            </div>
            <div class="history-actions">
              <button class="btn-reorder" @click="handleRestore(plan.id)">🔄 再来一次</button>
              <button class="btn-delete-history" @click="handleDeleteHistory(plan.id)">删除</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="empty-card" v-if="planItems.length === 0 && store.todayRecords.length === 0 && studentHomework.length === 0">
        <div class="empty-icon">📋</div>
        <span class="empty-text">今天还没有训练计划</span>
        <span class="empty-desc">选择推荐方案，或去项目广场挑选</span>
        <button class="btn-primary" style="margin-top:16px;" @click="$router.push('/square')">逛广场</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBilliardStore } from '../stores/billiard'

const store = useBilliardStore()
const router = useRouter()
const showAddPicker = ref(false)
const liveMode = ref(false)
const batchCount = ref(15)
const paused = ref(false)

// 计时器
const elapsedSeconds = ref(0)
let timerInterval = null

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return store.formatDate(d)
}

function startTimer() {
  stopTimer()
  elapsedSeconds.value = store.getElapsedSeconds()
  timerInterval = setInterval(() => {
    elapsedSeconds.value = store.getElapsedSeconds()
  }, 1000)
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
}

// 计划项
const planItems = computed(() => store.cart.filter(item => item.projectId))

const completedCount = computed(() => {
  const doneIds = new Set(store.todayRecords.map(r => r.projectId))
  return planItems.value.filter(item => doneIds.has(item.projectId)).length
})

// 当前训练的项目名
const activeProjectName = computed(() => {
  if (!store.currentTraining) return ''
  const item = planItems.value.find(i => i.projectId === store.currentTraining.projectId)
  return item ? item.name : '训练中'
})

// 实时统计
const liveStats = computed(() => store.getLiveStats())

function isProjectDone(projectId) {
  return store.todayRecords.some(r => r.projectId === projectId)
}

function getProjectTrainCount(projectName) {
  return store.todayRecords.filter(r => r.project === projectName).length
}

function categoryLabel(cat) {
  return { basic: '基础', medium: '进阶', advanced: '高级' }[cat] || cat
}

// ===== 训练操作 =====
function handleStart(item) {
  if (store.currentTraining) {
    if (!confirm('当前正在训练其他项目，要切换吗？')) return
    store.cancelTraining()
    liveMode.value = false
  }
  liveMode.value = true
  paused.value = false
  store.startTraining(item.projectId)
  startTimer()
}

// ===== 暂停/恢复 =====
function togglePause() {
  if (paused.value) {
    store.resumeTraining()
    paused.value = false
  } else {
    store.pauseTraining()
    paused.value = true
  }
}

// ===== 批量记录 =====
function handleBatch(hit) {
  store.recordBatchShots(hit, batchCount.value)
}

// ===== 返回退出 =====
function handleExitLive() {
  if (liveStats.value.total > 0) {
    if (!confirm('训练进行中，确定退出？数据将丢失')) return
  }
  stopTimer()
  store.cancelTraining()
  liveMode.value = false
  paused.value = false
}

function handleEndLive() {
  if (!confirm(`结束「${activeProjectName.value}」训练？已用时 ${formatTime(elapsedSeconds.value)}`)) return
  stopTimer()
  const result = store.endTraining()
  liveMode.value = false
  if (result) {
    const params = new URLSearchParams({
      projectId: result.projectId,
      from: 'training',
      duration: String(result.elapsed),
      shots: String(result.shots),
      hits: String(result.hits),
      hitRate: String(result.hitRate)
    })
    router.push('/record?' + params.toString())
  } else {
    router.push('/training')
  }
}

function quickTrain(project) {
  showAddPicker.value = false
  router.push('/record?projectId=' + project.id + '&from=training')
}

// ===== 推荐方案 =====
function handleLoadRec(planId) {
  store.loadRecommendedPlan(planId)
}

// ===== 教练作业 =====
const studentHomework = computed(() => store.getStudentHomework())
const coachHomework = computed(() => store.getCoachHomework())

function loadHomeworkToCart(hw) {
  hw.items.forEach(item => {
    if (!store.isInCart(item.projectId || item.id)) {
      const project = store.getSquareProject(item.projectId || item.id)
      if (project) {
        store.addToCart({
          projectId: project.id,
          name: project.name,
          category: project.category,
          duration: item.duration || 30,
          targetRate: item.targetRate || 60
        })
      }
    }
  })
}

function handleSavePlan() {
  store.savePlanToHistory()
  alert('计划已保存 ✅')
}

function handleRestore(historyId) {
  if (store.cart.filter(i => i.projectId).length > 0) {
    if (!confirm('当前已有训练计划，要替换吗？')) return
  }
  store.restorePlanFromHistory(historyId)
}

function handleDeleteHistory(historyId) {
  if (!confirm('确定删除这个历史计划吗？')) return
  store.deletePlanHistory(historyId)
}

function planTotalDuration(plan) {
  return plan.items.reduce((s, i) => s + (i.duration || 0), 0)
}

onMounted(() => {
  if (store.currentTraining) {
    liveMode.value = true
    paused.value = store.isTrainingPaused()
    startTimer()
  }
})

onUnmounted(() => { stopTimer() })
</script>

<style scoped>
.page { padding: 0 12px 24px; }
.page-top { display: flex; justify-content: space-between; align-items: baseline; padding: 16px 0; }
.page-title { font-size: 22px; font-weight: 800; color: #1a1a2e; }
.page-date { font-size: 13px; color: #b0b0b0; }

/* ====== 全屏实时训练覆盖层 ====== */
.live-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 1000;
  background: linear-gradient(160deg, #1a1a2e 0%, #2c3e50 100%);
  display: flex; flex-direction: column; align-items: center;
  padding: 20px; max-width: 480px; margin: 0 auto;
}
.live-header {
  width: 100%; display: flex; justify-content: space-between; align-items: center;
  padding: 16px 0 20px; border-bottom: 1px solid rgba(255,255,255,0.08);
}
.btn-back {
  width: 36px; height: 36px; border-radius: 50%; border: none;
  background: rgba(255,255,255,0.1); color: #fff; font-size: 18px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.btn-back:active { background: rgba(255,255,255,0.2); }
.live-project-name { font-size: 18px; font-weight: 700; color: rgba(255,255,255,0.9); flex: 1; text-align: center; }
.live-timer-wrap { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.live-timer {
  font-size: 28px; font-weight: 800; color: #2ecc71;
  font-variant-numeric: tabular-nums; letter-spacing: 1px;
}
.live-timer.warn { color: #f39c12; }
.btn-pause {
  padding: 2px 10px; border: 1px solid rgba(255,255,255,0.2); border-radius: 10px;
  background: transparent; color: rgba(255,255,255,0.6); font-size: 11px;
  cursor: pointer;
}
.btn-pause:active { background: rgba(255,255,255,0.1); }

/* 暂停遮罩 */
.pause-overlay {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
}
.pause-icon { font-size: 48px; opacity: 0.5; }
.pause-text { font-size: 18px; color: rgba(255,255,255,0.5); font-weight: 600; }
.btn-resume {
  padding: 16px 48px; border: none; border-radius: 14px; font-size: 18px; font-weight: 700;
  background: linear-gradient(135deg, #2ecc71, #27ae60); color: #fff; cursor: pointer;
  box-shadow: 0 4px 20px rgba(46,204,113,0.4);
}

.live-stats {
  display: flex; align-items: center; gap: 0; width: 100%;
  background: rgba(255,255,255,0.06); border-radius: 16px;
  padding: 24px 0; margin: 24px 0;
}
.live-stat { flex: 1; text-align: center; }
.live-stat-num { display: block; font-size: 36px; font-weight: 800; color: #fff; line-height: 1.1; font-variant-numeric: tabular-nums; }
.live-stat-num.good { color: #2ecc71; }
.live-stat-num.mid { color: #ff6b35; }
.live-stat-num.bad { color: #e74c3c; }
.live-stat-label { display: block; font-size: 12px; color: rgba(255,255,255,0.45); margin-top: 6px; }
.live-stat-divider { width: 1px; height: 40px; background: rgba(255,255,255,0.1); flex-shrink: 0; }

/* 批量输入 */
.batch-area {
  background: rgba(255,255,255,0.04); border-radius: 14px; padding: 14px 16px;
  margin-bottom: 16px;
}
.batch-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.batch-label { font-size: 14px; color: rgba(255,255,255,0.5); font-weight: 600; }
.batch-stepper { display: flex; align-items: center; background: rgba(0,0,0,0.3); border-radius: 10px; overflow: hidden; }
.stepper-btn {
  width: 36px; height: 36px; border: none; background: transparent; color: #fff;
  font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.stepper-btn:active { background: rgba(255,255,255,0.1); }
.batch-input {
  width: 48px; text-align: center; font-size: 18px; font-weight: 700; color: #fff;
  background: transparent; border: none; outline: none;
  -moz-appearance: textfield;
}
.batch-input::-webkit-outer-spin-button,
.batch-input::-webkit-inner-spin-button { -webkit-appearance: none; }
.batch-unit { font-size: 13px; color: rgba(255,255,255,0.4); }
.batch-buttons { display: flex; gap: 10px; }
.btn-batch-hit, .btn-batch-miss {
  flex: 1; padding: 12px 0; border: none; border-radius: 10px;
  font-size: 15px; font-weight: 700; cursor: pointer;
}
.btn-batch-hit { background: rgba(46,204,113,0.15); color: #2ecc71; }
.btn-batch-hit:active { background: rgba(46,204,113,0.25); }
.btn-batch-miss { background: rgba(231,76,60,0.12); color: #e74c3c; }
.btn-batch-miss:active { background: rgba(231,76,60,0.2); }

.live-buttons {
  display: flex; gap: 16px; width: 100%; flex: 1; min-height: 0;
  padding: 20px 0;
}
.btn-hit, .btn-miss {
  flex: 1; border: none; border-radius: 16px; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 4px; transition: all 0.15s; min-height: 140px;
  position: relative; overflow: hidden;
}
.btn-hit {
  background: linear-gradient(160deg, #2ecc71, #27ae60);
  box-shadow: 0 8px 24px rgba(46,204,113,0.4);
}
.btn-hit:active { transform: scale(0.96); box-shadow: 0 4px 12px rgba(46,204,113,0.3); }
.btn-miss {
  background: linear-gradient(160deg, #e74c3c, #c0392b);
  box-shadow: 0 8px 24px rgba(231,76,60,0.4);
}
.btn-miss:active { transform: scale(0.96); box-shadow: 0 4px 12px rgba(231,76,60,0.3); }

.btn-hit-icon, .btn-miss-icon { font-size: 36px; }
.btn-hit-text { font-size: 18px; font-weight: 700; color: #fff; }
.btn-miss-text { font-size: 18px; font-weight: 700; color: #fff; }
.btn-hit-count { font-size: 14px; font-weight: 800; color: rgba(255,255,255,0.7); position: absolute; top: 12px; right: 14px; }
.btn-miss-count { font-size: 14px; font-weight: 800; color: rgba(255,255,255,0.7); position: absolute; top: 12px; right: 14px; }

.live-actions {
  width: 100%; display: flex; gap: 12px; padding: 16px 0; padding-bottom: max(16px, env(safe-area-inset-bottom));
}
.btn-undo {
  flex: 1; padding: 16px; border: 2px solid rgba(255,255,255,0.15); border-radius: 12px;
  background: transparent; color: rgba(255,255,255,0.6); font-size: 15px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.btn-undo:active { background: rgba(255,255,255,0.06); }
.btn-undo:disabled { opacity: 0.3; cursor: default; }
.btn-end-live {
  flex: 2; padding: 16px; border: none; border-radius: 12px;
  background: linear-gradient(135deg, #f39c12, #e67e22); color: #fff;
  font-size: 16px; font-weight: 700; cursor: pointer;
  box-shadow: 0 4px 16px rgba(243,156,18,0.4); transition: all 0.2s;
}
.btn-end-live:active { opacity: 0.9; }

/* ====== 推荐方案 ====== */
.rec-grid { display: flex; flex-direction: column; gap: 10px; }
.rec-card {
  background: #fff; border-radius: 12px; padding: 16px; position: relative;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04); overflow: hidden;
}
.rec-card::before {
  content: ''; position: absolute; top: -15px; right: -15px;
  width: 60px; height: 60px; border-radius: 50%; opacity: 0.08;
  background: #f39c12;
}
.rec-name { display: block; font-size: 17px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
.rec-desc { display: block; font-size: 13px; color: #b0b0b0; margin-bottom: 4px; }
.rec-items { display: block; font-size: 12px; color: #999; margin-bottom: 12px; }
.btn-load-rec {
  width: 100%; padding: 11px 0; border: none; border-radius: 8px;
  background: linear-gradient(135deg, #f39c12, #e67e22); color: #fff;
  font-size: 14px; font-weight: 600; cursor: pointer;
  box-shadow: 0 2px 8px rgba(243,156,18,0.3);
}
.btn-load-rec:active { opacity: 0.85; }

/* ====== 教练作业 ====== */
.homework-list { display: flex; flex-direction: column; gap: 10px; }
.homework-card {
  background: #fff; border-radius: 12px; padding: 14px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04); border-left: 4px solid #3498db;
}
.homework-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.homework-note { font-size: 15px; font-weight: 600; color: #1a1a2e; }
.homework-status { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 10px; }
.homework-status.done { background: rgba(46,204,113,0.12); color: #27ae60; }
.homework-status.pending { background: rgba(243,156,18,0.12); color: #e67e22; }
.homework-date { font-size: 12px; color: #b0b0b0; }
.homework-student { font-size: 13px; color: #666; margin-bottom: 4px; }
.homework-items { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.homework-tag {
  padding: 4px 10px; background: rgba(52,152,219,0.08); border-radius: 10px;
  font-size: 12px; color: #3498db; font-weight: 500;
}
.homework-meta { font-size: 11px; color: #ccc; }
.btn-load-homework {
  width: 100%; padding: 9px 0; margin-top: 8px; border: none; border-radius: 8px;
  background: linear-gradient(135deg, #3498db, #2980b9); color: #fff;
  font-size: 13px; font-weight: 600; cursor: pointer;
}
.btn-done-homework {
  width: 100%; padding: 9px 0; margin-top: 6px; border: 1px solid #2ecc71; border-radius: 8px;
  background: #fff; color: #27ae60; font-size: 13px; font-weight: 600; cursor: pointer;
}

/* ====== 通用样式 ====== */
.section { margin-bottom: 16px; }
.section-title {
  display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700;
  color: #1a1a2e; margin-bottom: 10px;
}
.title-bar { width: 4px; height: 18px; background: linear-gradient(180deg, #2ecc71, #27ae60); border-radius: 2px; }
.section-count { font-size: 12px; color: #b0b0b0; font-weight: 500; margin-left: auto; }

.plan-list { display: flex; flex-direction: column; gap: 8px; }
.plan-card {
  background: #fff; border-radius: 12px; padding: 14px 16px; display: flex;
  justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.plan-left { display: flex; align-items: center; gap: 10px; flex: 1; cursor: pointer; }
.plan-icon {
  width: 38px; height: 38px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; font-size: 18px;
}
.plan-icon.basic { background: rgba(46,204,113,0.12); }
.plan-icon.medium { background: rgba(255,107,53,0.12); }
.plan-icon.advanced { background: rgba(231,76,60,0.1); }
.plan-name { display: block; font-size: 15px; font-weight: 600; color: #1a1a2e; }
.plan-meta { display: block; font-size: 12px; color: #b0b0b0; margin-top: 2px; }
.plan-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

.btn-start {
  padding: 8px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 700;
  cursor: pointer; background: linear-gradient(135deg, #2ecc71, #27ae60); color: #fff;
  box-shadow: 0 2px 8px rgba(46,204,113,0.3);
}
.btn-start:active { opacity: 0.85; }
.btn-start:disabled { background: #f0f0f0; color: #ccc; box-shadow: none; cursor: default; }
.btn-again {
  padding: 6px 14px; border: 1px solid #2ecc71; border-radius: 8px; font-size: 13px; font-weight: 600;
  cursor: pointer; background: #fff; color: #27ae60;
}
.plan-status { font-size: 13px; font-weight: 600; }
.plan-status.done { color: #2ecc71; }
.train-count { font-size: 11px; color: #b0b0b0; }

.add-area { padding: 8px 0 16px; }
.btn-add {
  width: 100%; padding: 13px 0; border: 2px dashed #2ecc71; border-radius: 10px;
  background: rgba(46,204,113,0.04); color: #27ae60; font-size: 15px; font-weight: 600;
  cursor: pointer;
}
.btn-add:active { background: rgba(46,204,113,0.1); }

.save-plan-area { padding: 4px 0 12px; text-align: center; }
.btn-save-plan {
  padding: 10px 28px; border: 2px solid #2ecc71; border-radius: 10px;
  background: #fff; color: #27ae60; font-size: 14px; font-weight: 600; cursor: pointer;
}

/* 弹层 */
.picker-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4);
  z-index: 1000; display: flex; align-items: flex-end; justify-content: center;
}
.picker-sheet {
  width: 100%; max-width: 480px; max-height: 70vh; background: #fff;
  border-radius: 16px 16px 0 0; overflow-y: auto;
}
.picker-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 18px; border-bottom: 1px solid #f0f0f0; position: sticky; top: 0; background: #fff; z-index: 1;
}
.picker-title { font-size: 17px; font-weight: 700; color: #1a1a2e; }
.picker-close { font-size: 18px; color: #b0b0b0; cursor: pointer; padding: 4px; }
.picker-list { padding: 12px; }
.picker-item {
  display: flex; justify-content: space-between; align-items: center; padding: 12px 14px;
  background: #f8f9fa; border-radius: 10px; margin-bottom: 6px; cursor: pointer;
}
.picker-item:active { background: #f0f0f0; }
.picker-item-name { font-size: 15px; font-weight: 600; color: #333; }
.picker-item-cat { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
.picker-item-cat.basic { background: rgba(46,204,113,0.12); color: #27ae60; }
.picker-item-cat.medium { background: rgba(255,107,53,0.12); color: #e55a2b; }
.picker-item-cat.advanced { background: rgba(231,76,60,0.12); color: #e74c3c; }
.picker-empty { text-align: center; padding: 40px 24px; }
.picker-empty-icon { font-size: 40px; display: block; margin-bottom: 8px; }
.picker-empty-text { display: block; font-size: 16px; font-weight: 600; color: #333; }
.picker-empty-desc { display: block; font-size: 13px; color: #b0b0b0; margin-top: 4px; }
.btn-go-square {
  margin-top: 16px; padding: 12px 32px; background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: #fff; border: none; border-radius: 20px; font-size: 14px; font-weight: 600; cursor: pointer;
}

.record-list { display: flex; flex-direction: column; gap: 8px; }
.record-card {
  background: #fff; border-radius: 12px; padding: 14px 16px; display: flex;
  justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.04); cursor: pointer;
}
.record-left { display: flex; align-items: center; gap: 10px; }
.record-icon {
  width: 36px; height: 36px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center; font-size: 18px;
}
.record-icon.good { background: rgba(46,204,113,0.12); }
.record-icon.mid { background: rgba(255,107,53,0.12); }
.record-icon.bad { background: rgba(231,76,60,0.1); }
.record-name { display: block; font-size: 15px; font-weight: 600; color: #1a1a2e; }
.record-meta { display: block; font-size: 12px; color: #b0b0b0; margin-top: 2px; }
.record-right { display: flex; align-items: center; gap: 4px; }
.record-rate { font-size: 19px; font-weight: 800; }
.record-rate.good { color: #2ecc71; }
.record-rate.mid { color: #ff6b35; }
.record-rate.bad { color: #e74c3c; }
.card-arrow { font-size: 18px; color: #ddd; }

.empty-card { text-align: center; padding: 60px 24px; }
.empty-icon { font-size: 50px; margin-bottom: 12px; display: block; }
.empty-text { display: block; font-size: 17px; font-weight: 600; color: #333; }
.empty-desc { display: block; font-size: 13px; color: #b0b0b0; margin-top: 6px; }

.history-list { display: flex; flex-direction: column; gap: 10px; }
.history-card {
  background: #fff; border-radius: 12px; padding: 14px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.history-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.history-date { font-size: 15px; font-weight: 700; color: #1a1a2e; }
.history-meta { font-size: 12px; color: #b0b0b0; }
.history-items { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.history-tag {
  padding: 4px 10px; background: rgba(46,204,113,0.08); border-radius: 12px;
  font-size: 12px; color: #27ae60; font-weight: 500;
}
.history-tag.more { background: #f5f5f5; color: #999; }
.history-actions { display: flex; justify-content: flex-end; gap: 10px; }
.btn-reorder {
  padding: 7px 16px; border: none; border-radius: 8px; font-size: 13px; font-weight: 600;
  cursor: pointer; background: linear-gradient(135deg, #2ecc71, #27ae60); color: #fff;
}
.btn-delete-history {
  padding: 7px 12px; border: none; border-radius: 8px; font-size: 13px;
  cursor: pointer; background: #f5f5f5; color: #b0b0b0;
}
</style>
