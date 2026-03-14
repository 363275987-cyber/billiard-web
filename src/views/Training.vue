<!-- src/views/Training.vue - 今日训练页 -->
<template>
  <div class="page">
    <div class="page-top">
      <span class="page-title">📋 今日训练</span>
      <span class="page-date">{{store.getToday()}}</span>
    </div>

    <!-- 正在训练的提示条 -->
    <div class="training-banner" v-if="store.currentTraining">
      <div class="banner-pulse"></div>
      <span class="banner-text">正在训练：{{activeProjectName}}</span>
      <span class="banner-timer">{{formatTime(elapsedSeconds)}}</span>
    </div>

    <!-- 今日训练计划列表 -->
    <div class="section" v-if="planItems.length > 0">
      <div class="section-title">
        <div class="title-bar"></div>
        <span>训练计划</span>
        <span class="section-count">{{completedCount}}/{{planItems.length}} 完成</span>
      </div>
      <div class="plan-list">
        <div class="plan-card" v-for="item in planItems" :key="item.projectId" :class="{active: store.currentTraining?.projectId === item.projectId}">

          <div class="plan-left" @click="store.currentTraining?.projectId !== item.projectId && !isProjectDone(item.projectId) && handleStart(item)">
            <div class="plan-icon" :class="item.category">
              {{item.category === 'basic' ? '🎯' : item.category === 'medium' ? '💪' : '🔥'}}
            </div>
            <div class="plan-info">
              <span class="plan-name">{{item.name}}</span>
              <span class="plan-meta">
                ⏱ 预计{{item.duration}}分钟 · 进球率{{item.targetRate}}% · {{item.rounds}}轮
              </span>
            </div>
          </div>

          <div class="plan-right">
            <!-- 正在训练中 -->
            <template v-if="store.currentTraining?.projectId === item.projectId">
              <div class="training-timer">
                <span class="timer-icon">⏱</span>
                <span class="timer-num">{{formatTime(elapsedSeconds)}}</span>
              </div>
              <button class="btn-end" @click="handleEnd(item)">结束训练</button>
            </template>

            <!-- 已完成（可再练） -->
            <template v-else-if="isProjectDone(item.projectId)">
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

    <!-- 历史训练计划（像外卖历史订单） -->
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
    <div class="empty-card" v-if="planItems.length === 0 && store.todayRecords.length === 0">
      <div class="empty-icon">📋</div>
      <span class="empty-text">今天还没有训练计划</span>
      <span class="empty-desc">点上方「+ 添加训练」或去项目广场挑选</span>
      <button class="btn-primary" style="margin-top:16px;" @click="$router.push('/square')">逛广场</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBilliardStore } from '../stores/billiard'

const store = useBilliardStore()
const router = useRouter()
const showAddPicker = ref(false)

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
  const doneNames = new Set(store.todayRecords.map(r => r.project))
  return planItems.value.filter(item => doneNames.has(item.name)).length
})

// 当前训练的项目名
const activeProjectName = computed(() => {
  if (!store.currentTraining) return ''
  const item = planItems.value.find(i => i.projectId === store.currentTraining.projectId)
  return item ? item.name : ''
})

function isProjectDone(projectId) {
  const item = planItems.value.find(i => i.projectId === projectId)
  if (!item) return false
  return store.todayRecords.some(r => r.project === item.name)
}

function getProjectTrainCount(projectName) {
  return store.todayRecords.filter(r => r.project === projectName).length
}

function categoryLabel(cat) {
  return { basic: '基础', medium: '进阶', advanced: '高级' }[cat] || cat
}

function handleStart(item) {
  if (store.currentTraining && store.currentTraining.projectId !== item.projectId) {
    if (!confirm('当前正在训练其他项目，要切换吗？')) return
    store.cancelTraining()
  }
  store.startTraining(item.projectId)
  startTimer()
}

function handleEnd(item) {
  if (!confirm(`结束「${item.name}」训练？已用时 ${formatTime(elapsedSeconds.value)}`)) return
  stopTimer()
  const elapsedMinutes = store.endTraining()
  router.push('/record?projectId=' + item.projectId + '&from=training&duration=' + elapsedMinutes)
}

function quickTrain(project) {
  showAddPicker.value = false
  router.push('/record?projectId=' + project.id + '&from=training')
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
  if (store.currentTraining) startTimer()
})

onUnmounted(() => { stopTimer() })
</script>

<style scoped>
.page { padding: 0 12px 24px; }
.page-top { display: flex; justify-content: space-between; align-items: baseline; padding: 16px 0; }
.page-title { font-size: 22px; font-weight: 800; color: #1a1a2e; }
.page-date { font-size: 13px; color: #b0b0b0; }

/* 训练中提示条 */
.training-banner {
  display: flex; align-items: center; gap: 10px; padding: 12px 16px;
  background: linear-gradient(135deg, #2ecc71, #27ae60); border-radius: 12px;
  margin-bottom: 12px; position: relative; overflow: hidden;
}
.banner-pulse {
  position: absolute; top: 0; left: -100%; width: 200%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
  animation: pulse 2s infinite;
}
@keyframes pulse { from { transform: translateX(-50%); } to { transform: translateX(50%); } }
.banner-text { font-size: 14px; font-weight: 600; color: #fff; position: relative; flex: 1; }
.banner-timer { font-size: 18px; font-weight: 800; color: #fff; font-variant-numeric: tabular-nums; position: relative; }

.section { margin-bottom: 16px; }
.section-title {
  display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700;
  color: #1a1a2e; margin-bottom: 10px;
}
.title-bar { width: 4px; height: 18px; background: linear-gradient(180deg, #2ecc71, #27ae60); border-radius: 2px; }
.section-count { font-size: 12px; color: #b0b0b0; font-weight: 500; margin-left: auto; }

/* 计划列表 */
.plan-list { display: flex; flex-direction: column; gap: 8px; }
.plan-card {
  background: #fff; border-radius: 12px; padding: 14px 16px; display: flex;
  justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: all 0.2s; border-left: 4px solid transparent;
}
.plan-card.active {
  border-left-color: #2ecc71; background: rgba(46,204,113,0.03);
  box-shadow: 0 2px 12px rgba(46,204,113,0.12);
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

/* 开始按钮 */
.btn-start {
  padding: 8px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 700;
  cursor: pointer; background: linear-gradient(135deg, #2ecc71, #27ae60); color: #fff;
  box-shadow: 0 2px 8px rgba(46,204,113,0.3); transition: all 0.2s;
}
.btn-start:active { opacity: 0.85; }
.btn-start:disabled { background: #f0f0f0; color: #ccc; box-shadow: none; cursor: default; }

/* 结束按钮 */
.btn-end {
  padding: 8px 16px; border: 2px solid #e74c3c; border-radius: 8px; font-size: 14px; font-weight: 700;
  cursor: pointer; background: #fff; color: #e74c3c; transition: all 0.2s;
}
.btn-end:active { background: rgba(231,76,60,0.06); }

/* 再练按钮 */
.btn-again {
  padding: 6px 14px; border: 1px solid #2ecc71; border-radius: 8px; font-size: 13px; font-weight: 600;
  cursor: pointer; background: #fff; color: #27ae60; transition: all 0.2s;
}
.btn-again:active { background: rgba(46,204,113,0.06); }

/* 训练中计时 */
.training-timer {
  display: flex; align-items: center; gap: 4px; font-variant-numeric: tabular-nums;
}
.timer-icon { font-size: 16px; }
.timer-num { font-size: 16px; font-weight: 800; color: #2ecc71; }

/* 已完成状态 */
.plan-status { font-size: 13px; font-weight: 600; }
.plan-status.done { color: #2ecc71; }
.train-count { font-size: 11px; color: #b0b0b0; }

/* 添加按钮 */
.add-area { padding: 8px 0 16px; }
.btn-add {
  width: 100%; padding: 13px 0; border: 2px dashed #2ecc71; border-radius: 10px;
  background: rgba(46,204,113,0.04); color: #27ae60; font-size: 15px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.btn-add:active { background: rgba(46,204,113,0.1); }

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

/* 今日记录 */
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

/* 空状态 */
.empty-card { text-align: center; padding: 60px 24px; }
.empty-icon { font-size: 50px; margin-bottom: 12px; display: block; }
.empty-text { display: block; font-size: 17px; font-weight: 600; color: #333; }
.empty-desc { display: block; font-size: 13px; color: #b0b0b0; margin-top: 6px; }

/* 保存计划按钮 */
.save-plan-area { padding: 4px 0 12px; text-align: center; }
.btn-save-plan {
  padding: 10px 28px; border: 2px solid #2ecc71; border-radius: 10px;
  background: #fff; color: #27ae60; font-size: 14px; font-weight: 600; cursor: pointer;
}
.btn-save-plan:active { background: rgba(46,204,113,0.06); }

/* 历史计划 */
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
.btn-reorder:active { opacity: 0.85; }
.btn-delete-history {
  padding: 7px 12px; border: none; border-radius: 8px; font-size: 13px;
  cursor: pointer; background: #f5f5f5; color: #b0b0b0;
}
.btn-delete-history:active { background: #f0f0f0; }
</style>
