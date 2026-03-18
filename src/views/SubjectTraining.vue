<template>
  <div class="page">
    <!-- 选择科目 -->
    <template v-if="!active">
      <div class="page-top">
        <button class="btn-back" @click="$router.back()">← 返回</button>
        <span class="page-title">🎯 选择训练科目</span>
      </div>

      <!-- 预设分类筛选 -->
      <div class="category-bar">
        <button
          :class="['cat-btn', { active: selectedCat === 'all' }]"
          @click="selectedCat = 'all'"
        >
          全部
        </button>
        <button
          v-for="cat in categories"
          :key="cat"
          :class="['cat-btn', { active: selectedCat === cat }]"
          @click="selectedCat = cat"
        >
          {{ cat }}
        </button>
      </div>

      <div v-if="store.loading" class="loading-wrap">
        <span class="loading-spinner">⏳</span>
        <span>加载中...</span>
      </div>

      <div v-else-if="subjects.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>暂无训练科目</p>
        <button class="btn-link" @click="$router.push('/subject-create')">
          去发布一个 →
        </button>
      </div>

      <div v-else class="subject-list">
        <div
          class="card subject-card"
          v-for="sub in filteredSubjects"
          :key="sub.id"
          @click="startTraining(sub)"
        >
          <div class="subject-top">
            <div class="subject-info">
              <span class="subject-name">{{ sub.name }}</span>
              <span class="subject-meta"
                >{{ sub.shots_per_group }}球/组 ·
                {{
                  sub.difficulty === 'beginner'
                    ? '入门'
                    : sub.difficulty === 'intermediate'
                      ? '进阶'
                      : '高级'
                }}</span
              >
            </div>
            <div class="subject-stats">
              <span class="usage-count">{{ sub.usage_count || 0 }}人练过</span>
            </div>
          </div>
          <div class="subject-desc" v-if="sub.description">
            {{ sub.description }}
          </div>
          <div class="subject-tags">
            <span class="tag" v-if="sub.has_position_rating">🎯 有到位率</span>
            <span class="tag">{{ categoryLabel(sub.category) }}</span>
          </div>
        </div>
      </div>

      <div class="section" style="padding-bottom: 20px">
        <button class="btn-primary" @click="$router.push('/subject-create')">
          + 发布新科目
        </button>
      </div>
    </template>

    <!-- 训练中 -->
    <template v-else>
      <div class="train-header">
        <div class="train-info">
          <span class="train-name">{{ active.name }}</span>
          <span class="train-meta">
            第{{ groupCount }}组 · {{ active.shots_per_group }}球/组
            <span v-if="active.has_position_rating" class="pos-badge"
              >🎯 到位率</span
            >
          </span>
        </div>
        <div class="train-actions-top">
          <button class="btn-text" @click="confirmExit">退出训练</button>
        </div>
      </div>

      <!-- 实时统计 -->
      <div class="live-stats">
        <div class="live-stat">
          <span class="live-stat-num">{{ currentGroup.potted }}</span>
          <span class="live-stat-label">进球</span>
        </div>
        <div class="live-stat-divider"></div>
        <div class="live-stat">
          <span class="live-stat-num" :class="rateClass(currentGroup.potRate)"
            >{{ currentGroup.potRate }}%</span
          >
          <span class="live-stat-label">进球率</span>
        </div>
        <div v-if="active.has_position_rating">
          <div class="live-stat-divider"></div>
          <div class="live-stat">
            <span
              class="live-stat-num"
              :class="rateClass(currentGroup.positionRate)"
              >{{ currentGroup.positionRate }}%</span
            >
            <span class="live-stat-label">到位率</span>
          </div>
        </div>
        <div class="live-stat-divider"></div>
        <div class="live-stat">
          <span class="live-stat-num">{{ currentGroup.maxConsecutive }}</span>
          <span class="live-stat-label">连进</span>
        </div>
        <div class="live-stat-divider"></div>
        <div class="live-stat">
          <span class="live-stat-num">{{ currentGroup.avgShotTime }}s</span>
          <span class="live-stat-label">均速</span>
        </div>
      </div>

      <!-- 到位率待判定提示 -->
      <div v-if="pendingPosition" class="position-pending">
        <span class="pending-dot">⏳</span>
        <span>上一杆到位判定中... 下一杆将自动确认（或点「走位失误」）</span>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="btn-action hit" @click="recordShot(true)">
          ✅ 进球
        </button>
        <button class="btn-action miss" @click="recordShot(false)">
          ❌ 失误
        </button>
        <button
          v-if="active.has_position_rating"
          class="btn-action position-fail"
          @click="recordPositionFail"
        >
          ⚠️ 走位失误
        </button>
      </div>

      <div class="action-buttons" style="margin-top: 8px">
        <button class="btn-secondary" @click="undoShot">↩️ 撤销</button>
        <button class="btn-complete" @click="completeGroup">🏁 完成本组</button>
      </div>

      <!-- 本组结果弹窗 -->
      <div
        v-if="showGroupResult"
        class="modal-overlay"
        @click.self="showGroupResult = false"
      >
        <div class="modal-content">
          <h3>📋 本组结果</h3>
          <div class="result-grid">
            <div class="result-item">
              <span class="result-label">进球</span>
              <span class="result-value"
                >{{ currentGroup.potted }}/{{ currentGroup.totalShots }}</span
              >
              <span class="result-rate" :class="rateClass(currentGroup.potRate)"
                >{{ currentGroup.potRate }}%</span
              >
            </div>
            <div v-if="active.has_position_rating" class="result-item">
              <span class="result-label">到位</span>
              <span class="result-value"
                >{{ currentGroup.positionSuccess }}/{{
                  currentGroup.positionEvaluated
                }}</span
              >
              <span
                class="result-rate"
                :class="rateClass(currentGroup.positionRate)"
                >{{ currentGroup.positionRate }}%</span
              >
            </div>
            <div class="result-item">
              <span class="result-label">连进</span>
              <span class="result-value">{{
                currentGroup.maxConsecutive
              }}</span>
            </div>
            <div class="result-item">
              <span class="result-label">均速</span>
              <span class="result-value">{{ currentGroup.avgShotTime }}秒</span>
            </div>
          </div>
          <div class="modal-buttons">
            <button
              class="btn-secondary"
              @click="
                showGroupResult = false
                resetForNext()
              "
            >
              再来一组
            </button>
            <button
              class="btn-primary"
              @click="
                showGroupResult = false
                showSessionSummary = true
              "
            >
              结束训练
            </button>
          </div>
        </div>
      </div>

      <!-- 训练总结弹窗 -->
      <div
        v-if="showSessionSummary"
        class="modal-overlay"
        @click.self="showSessionSummary = false"
      >
        <div class="modal-content summary-modal">
          <h3>📊 训练总结 — {{ active.name }}</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-label">完成组数</span>
              <span class="summary-value">{{ groupCount }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">平均进球率</span>
              <span
                class="summary-value"
                :class="rateClass(sessionStats.avgPotRate)"
                >{{ sessionStats.avgPotRate }}%</span
              >
            </div>
            <div v-if="active.has_position_rating" class="summary-item">
              <span class="summary-label">平均到位率</span>
              <span
                class="summary-value"
                :class="rateClass(sessionStats.avgPositionRate)"
                >{{ sessionStats.avgPositionRate }}%</span
              >
            </div>
            <div class="summary-item">
              <span class="summary-label">最高连进</span>
              <span class="summary-value">{{
                sessionStats.bestConsecutive
              }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">平均出杆</span>
              <span class="summary-value"
                >{{ sessionStats.avgShotTime }}秒</span
              >
            </div>
          </div>
          <button
            class="btn-primary"
            style="margin-top: 16px"
            @click="
              showSessionSummary = false
              finishTraining()
            "
          >
            确认保存
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { useBilliardStore } from '../stores/billiard'

const router = useRouter()
const store = useBilliardStore()

// 科目数据
const subjects = ref([])
const selectedCat = ref('all')
const categories = ['basic', 'angle', 'position', 'combo', 'other']
const categoryLabels = {
  basic: '基础',
  angle: '角度球',
  position: '走位',
  combo: '组合',
  other: '其他',
}

const filteredSubjects = computed(() => {
  if (selectedCat.value === 'all') return subjects.value
  return subjects.value.filter((s) => s.category === selectedCat.value)
})

// 训练状态
const active = ref(null)
const groupCount = ref(0)
const showGroupResult = ref(false)
const showSessionSummary = ref(false)
const pendingPosition = ref(false)
const exiting = ref(false)

// 当前组数据
const currentGroup = reactive({
  shots: [],
  totalShots: 0,
  potted: 0,
  maxConsecutive: 0,
  consecutive: 0,
  positionPending: false, // 上一杆进球后到位率待判定
  positionSuccess: 0,
  positionFail: 0,
  positionEvaluated: 0,
  startTime: null,
  avgShotTime: 0,
})

// 会话统计
const sessionStats = computed(() => {
  if (groupCount.value === 0)
    return {
      avgPotRate: 0,
      avgPositionRate: 0,
      avgShotTime: 0,
      bestConsecutive: 0,
    }
  const groups = completedGroups.value
  const totalPots = groups.reduce((s, g) => s + g.potted, 0)
  const totalShots = groups.reduce((s, g) => s + g.totalShots, 0)
  const totalPosEval = groups.reduce((s, g) => s + g.positionEvaluated, 0)
  const totalPosSuc = groups.reduce((s, g) => s + g.positionSuccess, 0)
  const totalTime = groups.reduce((s, g) => s + g.totalTime, 0)
  return {
    avgPotRate: totalShots > 0 ? Math.round((totalPots / totalShots) * 100) : 0,
    avgPositionRate:
      totalPosEval > 0 ? Math.round((totalPosSuc / totalPosEval) * 100) : 0,
    avgShotTime: groups.length > 0 ? Math.round(totalTime / groups.length) : 0,
    bestConsecutive: Math.max(...groups.map((g) => g.maxConsecutive), 0),
  }
})

const completedGroups = computed(() => {
  return currentGroup.completed ? [getGroupSnapshot()] : []
})

function getGroupSnapshot() {
  return {
    potted: currentGroup.potted,
    totalShots: currentGroup.totalShots,
    potRate:
      currentGroup.totalShots > 0
        ? Math.round((currentGroup.potted / currentGroup.totalShots) * 100)
        : 0,
    positionRate:
      currentGroup.positionEvaluated > 0
        ? Math.round(
            (currentGroup.positionSuccess / currentGroup.positionEvaluated) *
              100
          )
        : 0,
    maxConsecutive: currentGroup.maxConsecutive,
    avgShotTime: currentGroup.avgShotTime,
    positionSuccess: currentGroup.positionSuccess,
    positionFail: currentGroup.positionFail,
    positionEvaluated: currentGroup.positionEvaluated,
    totalTime: currentGroup.totalTime || 0,
  }
}

function rateClass(rate) {
  return rate >= 70 ? 'good' : rate >= 50 ? 'mid' : 'bad'
}

onMounted(async () => {
  try {
    await store.loadTrainingSubjects()
    subjects.value = store.trainingSubjects || []
  } catch (e) {
    console.error('loadTrainingSubjects error:', e)
    subjects.value = []
  }
})

function startTraining(sub) {
  active.value = sub
  groupCount.value = 0
  resetForNext()
}

function recordShot(hit) {
  const now = Date.now()

  // 计算出杆时间
  if (currentGroup.shots.length > 0) {
    const prevTime = currentGroup.shots[currentGroup.shots.length - 1].timestamp
    const shotTime = Math.round((now - prevTime) / 1000)
    if (shotTime < 5) return // 排除异常（太短说明是误触）
    currentGroup.avgShotTime =
      currentGroup.avgShotTime === 0
        ? shotTime
        : Math.round(
            (currentGroup.avgShotTime * (currentGroup.shots.length - 1) +
              shotTime) /
              currentGroup.shots.length
          )
  }

  currentGroup.shots.push({
    potted: hit,
    positionResult: null,
    timestamp: now,
    shotTime: 0,
  })
  currentGroup.totalShots++

  if (hit) {
    currentGroup.potted++
    // 连进计数
    currentGroup.consecutive++
    if (currentGroup.consecutive > currentGroup.maxConsecutive) {
      currentGroup.maxConsecutive = currentGroup.consecutive
    }
    // 标记上一杆到位率待判定
    if (currentGroup.positionPending && currentGroup.shots.length >= 2) {
      currentGroup.positionSuccess++
      currentGroup.positionEvaluated++
      currentGroup.positionPending = false
      pendingPosition.value = false
    }
    // 本杆进球，标记到位率待判定
    currentGroup.positionPending = true
    pendingPosition.value = true
  } else {
    // 没进，连进归零
    currentGroup.consecutive = 0
    // 如果上一杆有到位率待判定，自动确认
    if (currentGroup.positionPending) {
      currentGroup.positionSuccess++
      currentGroup.positionEvaluated++
      currentGroup.positionPending = false
      pendingPosition.value = false
    }
  }
}

function recordPositionFail() {
  if (currentGroup.positionPending) {
    currentGroup.positionFail++
    currentGroup.positionEvaluated++
    currentGroup.positionPending = false
    pendingPosition.value = false
  }
}

function undoShot() {
  if (currentGroup.shots.length === 0) return
  const removed = currentGroup.shots.pop()
  currentGroup.totalShots--

  if (removed.potted) {
    currentGroup.potted--
    // 恢复连进计数（简化：用数组重算）
    recalcConsecutive()
  }
  // 移除后，重新判定到位率
  recalcPositions()
  currentGroup.avgShotTime = recalcAvgShotTime()

  // 如果移除的是有 positionPending 的那一杆
  // 简化处理：positionPending 状态重置
  if (currentGroup.positionPending) {
    currentGroup.positionPending = false
    pendingPosition.value = false
  }
}

function recalcConsecutive() {
  let max = 0,
    cur = 0
  for (const s of currentGroup.shots) {
    if (s.potted) {
      cur++
      max = Math.max(max, cur)
    } else {
      cur = 0
    }
  }
  currentGroup.maxConsecutive = max
  currentGroup.consecutive = cur
}

function recalcPositions() {
  let success = 0,
    evaluated = 0
  for (const s of currentGroup.shots) {
    if (s.potted && s.positionResult === 'success') success++
    if (s.potted && s.positionResult) evaluated++
  }
  currentGroup.positionSuccess = success
  currentGroup.positionFail = evaluated - success
  currentGroup.positionEvaluated = evaluated
}

function recalcAvgShotTime() {
  if (currentGroup.shots.length < 2) {
    currentGroup.avgShotTime = 0
    return
  }
  let total = 0,
    count = 0
  for (let i = 1; i < currentGroup.shots.length; i++) {
    const prev = currentGroup.shots[i - 1]
    const diff =
      (new Date(currentGroup.shots[i].timestamp) - new Date(prev.timestamp)) /
      1000
    if (diff > 5) {
      total += diff
      count++
    }
  }
  currentGroup.avgShotTime = count > 0 ? Math.round(total / count) : 0
}

function completeGroup() {
  if (currentGroup.totalShots === 0) return
  // 组结束时，未关闭的 pending 自动成功
  if (currentGroup.positionPending) {
    currentGroup.positionSuccess++
    currentGroup.positionEvaluated++
    currentGroup.positionPending = false
    pendingPosition.value = false
  }
  currentGroup.completed = true
  currentGroup.potRate =
    currentGroup.totalShots > 0
      ? Math.round((currentGroup.potted / currentGroup.totalShots) * 100)
      : 0
  currentGroup.positionRate =
    currentGroup.positionEvaluated > 0
      ? Math.round(
          (currentGroup.positionSuccess / currentGroup.positionEvaluated) * 100
        )
      : 0
  currentGroup.endTime = Date.now()
  currentGroup.totalTime =
    (currentGroup.endTime - currentGroup.startTime) / 1000

  groupCount.value++
  showGroupResult.value = true
}

function resetForNext() {
  const prevTime = currentGroup.startTime
  currentGroup.shots = []
  currentGroup.totalShots = 0
  currentGroup.potted = 0
  currentGroup.maxConsecutive = 0
  currentGroup.consecutive = 0
  currentGroup.positionPending = false
  currentGroup.positionSuccess = 0
  currentGroup.positionFail = 0
  currentGroup.positionEvaluated = 0
  currentGroup.startTime = Date.now()
  currentGroup.avgShotTime = 0
  currentGroup.completed = false
  currentGroup.endTime = null
  currentGroup.totalTime = 0
  pendingPosition.value = false
}

function confirmExit() {
  exiting.value = true
}

function finishTraining() {
  showSessionSummary.value = false
  exiting.value = false
  router.push('/training')
}

onBeforeRouteLeave(() => {
  if (active.value && !exiting.value) {
    exiting.value = false
    return false
  }
})
</script>

<style scoped>
.category-bar {
  display: flex;
  gap: 0;
  padding: 12px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  background: #f5f5f5;
  border-radius: 0;
}

.cat-btn {
  flex-shrink: 0;
  padding: 8px 16px;
  border: none;
  background: transparent;
  font-size: 13px;
  color: #999;
  white-space: nowrap;
}

.cat-btn.active {
  background: var(--keep-green);
  color: #fff;
  border-radius: 20px;
  font-weight: 600;
}

.subject-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 12px;
}

.subject-card {
  cursor: pointer;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}

.subject-card:active {
  transform: scale(0.98);
}

.subject-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.subject-info {
  flex: 1;
}

.subject-name {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
}

.subject-meta {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.usage-count {
  font-size: 12px;
  color: #aaa;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 10px;
}

.subject-desc {
  font-size: 13px;
  color: #888;
  margin-top: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.subject-tags {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.tag {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(46, 204, 113, 0.1);
  color: var(--keep-green-dark);
  border-radius: 10px;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #aaa;
}

.empty-icon {
  font-size: 40px;
}

.empty-state p {
  margin-top: 8px;
}

.btn-link {
  background: none;
  border: none;
  color: var(--keep-green);
  font-size: 14px;
  text-decoration: underline;
  cursor: pointer;
}

/* 训练头部 */
.train-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: #fff;
}

.train-info {
  display: flex;
  flex-direction: column;
}

.train-name {
  font-size: 18px;
  font-weight: 700;
}

.train-meta {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 2px;
}

.pos-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 11px;
  margin-left: 6px;
}

.train-actions-top {
  display: flex;
  align-items: center;
}

.btn-text {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
}

/* 实时统计 */
.live-stats {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 16px 8px;
  margin: 0 12px;
  background: var(--keep-card);
  border-radius: var(--keep-radius);
  box-shadow: var(--keep-shadow);
}

.live-stat {
  text-align: center;
  min-width: 60px;
}

.live-stat-num {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
}

.live-stat-num.good {
  color: var(--keep-green);
}
.live-stat-num.mid {
  color: #f39c12;
}
.live-stat-num.bad {
  color: #e74c3c;
}

.live-stat-label {
  font-size: 11px;
  color: #aaa;
  margin-top: 2px;
}

.live-stat-divider {
  width: 1px;
  height: 30px;
  background: #eee;
}

/* 到位率判定提示 */
.position-pending {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  margin: 0 12px;
  background: rgba(255, 193, 7, 0.1);
  border-radius: 10px;
  font-size: 12px;
  color: #b8860b;
}

.pending-dot {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 10px;
  padding: 12px;
  margin: 0 12px;
}

.btn-action {
  flex: 1;
  padding: 16px;
  border: none;
  border-radius: 14px;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-action:active {
  opacity: 0.85;
}

.btn-action.hit {
  background: var(--keep-green);
  color: #fff;
  box-shadow: 0 4px 14px rgba(46, 204, 113, 0.35);
}

.btn-action.miss {
  background: #e74c3c;
  color: #fff;
  box-shadow: 0 4px 14px rgba(231, 76, 60, 0.3);
}

.btn-action.position-fail {
  background: #f39c12;
  color: #fff;
  box-shadow: 0 4px 14px rgba(243, 156, 18, 0.3);
}

.btn-secondary {
  flex: 1;
  padding: 12px;
  border: 1.5px solid #ddd;
  background: #fff;
  border-radius: 14px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.btn-complete {
  flex: 1;
  padding: 12px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: #fff;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(52, 152, 219, 0.35);
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  animation: fadeIn 0.2s;
}

.modal-content {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  width: 85%;
  max-width: 360px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content h3 {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 16px;
  text-align: center;
}

/* 结果网格 */
.result-grid {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  margin-bottom: 20px;
}

.result-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 8px 12px;
  background: #f8f8f8;
  border-radius: 10px;
}

.result-label {
  font-size: 12px;
  color: #999;
}

.result-value {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
}

.result-rate {
  font-size: 14px;
  font-weight: 600;
}

.result-rate.good {
  color: var(--keep-green);
}
.result-rate.mid {
  color: #f39c12;
}
.result-rate.bad {
  color: #e74c3c;
}

.modal-buttons {
  display: flex;
  gap: 10px;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.summary-label {
  font-size: 13px;
  color: #999;
}

.summary-value {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
}

.summary-value.good {
  color: var(--keep-green);
}
.summary-value.mid {
  color: #f39c12;
}
.summary-value.bad {
  color: #e74c3c;
}

.summary-modal {
  max-width: 360px;
}
</style>
