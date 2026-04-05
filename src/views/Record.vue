<!-- src/views/Record.vue - v2 训练计数器 -->
<template>
  <div class="rec-page">
    <!-- 项目选择 -->
    <div class="rec-project">
      <select v-model="selectedProject" class="project-select">
        <option value="">选择训练项目</option>
        <option v-for="p in projectOptions" :key="p" :value="p">{{ p }}</option>
      </select>
    </div>

    <!-- 连进大数字 -->
    <div class="streak-area" v-if="!showSummary">
      <div class="streak-label">连进</div>
      <div class="streak-num" :class="{ fire: streak >= 5 }">{{ streak }}</div>
      <div class="streak-hint" v-if="streak > 0">🔥 连进中！</div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-area" v-if="!showSummary">
      <button class="btn-miss" @click="addMiss">失误</button>
      <button class="btn-pot" @click="addPot">+1</button>
    </div>

    <!-- 批量按钮 -->
    <div class="batch-area" v-if="!showSummary">
      <button class="btn-batch" @click="addBatch(5)">+5</button>
      <button class="btn-batch" @click="addBatch(10)">+10</button>
      <button class="btn-batch" @click="addBatch(15)">+15</button>
      <button class="btn-end" @click="finishSet">结束本组</button>
    </div>

    <!-- 本组统计 -->
    <div class="stats-bar" v-if="!showSummary">
      <div class="stat-item"><span class="stat-val">{{ pots }}</span><span class="stat-label">进球</span></div>
      <div class="stat-item"><span class="stat-val">{{ misses }}</span><span class="stat-label">失误</span></div>
      <div class="stat-item"><span class="stat-val">{{ pots + misses }}</span><span class="stat-label">总杆</span></div>
      <div class="stat-item"><span class="stat-val">{{ hitRate }}%</span><span class="stat-label">命中率</span></div>
    </div>

    <!-- 事件计时器 -->
    <div class="card" v-if="!showSummary">
      <div class="card-title">⏱ 事件记录</div>
      <div class="timer-row">
        <span class="timer-display">{{ formatTimer(timerSeconds) }}</span>
        <button class="btn-timer" :class="timerRunning ? 'running' : ''" @click="toggleTimer">
          {{ timerRunning ? '暂停' : '开始' }}
        </button>
        <button class="btn-event" @click="recordEvent">{{ eventName }}</button>
      </div>
      <div class="event-log" v-if="events.length">
        <div class="event-item" v-for="(e, i) in events" :key="i">
          <span class="event-name">{{ e.name }}</span>
          <span class="event-time">{{ e.interval }}</span>
        </div>
      </div>
    </div>

    <!-- 备注 -->
    <div class="card" v-if="!showSummary">
      <div class="card-title">📝 备注</div>
      <textarea v-model="notes" placeholder="训练心得..." class="note-input" rows="2"></textarea>
    </div>

    <!-- 本组总结 -->
    <div class="summary-area" v-if="showSummary">
      <div class="summary-title">📊 本组总结</div>
      <div class="summary-project">{{ selectedProject || '未选择项目' }}</div>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-val">{{ lastSet.pots }}</span>
          <span class="summary-label">进球</span>
        </div>
        <div class="summary-item">
          <span class="summary-val">{{ lastSet.misses }}</span>
          <span class="summary-label">失误</span>
        </div>
        <div class="summary-item">
          <span class="summary-val highlight">{{ lastSet.hitRate }}%</span>
          <span class="summary-label">命中率</span>
        </div>
        <div class="summary-item">
          <span class="summary-val highlight">{{ lastSet.maxStreak }}</span>
          <span class="summary-label">最长连进</span>
        </div>
      </div>
      <div class="summary-actions">
        <button class="btn-primary" @click="nextSet">下一组</button>
        <button class="btn-secondary" @click="finishAll">结束训练</button>
      </div>
    </div>

    <!-- 历史组数 -->
    <div class="sets-history" v-if="finishedSets.length > 0 && !showSummary">
      <div class="card-title" style="margin: 12px 0 8px;">已完成的组</div>
      <div class="set-item" v-for="(s, i) in finishedSets" :key="i">
        <span>第{{ i + 1 }}组</span>
        <span>{{ s.pots }}进/{{ s.misses }}失 · {{ s.hitRate }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBilliardStore } from '../stores/billiard'

const router = useRouter()
const store = useBilliardStore()

const defaultProjects = [
  '中袋直线球', '五分点中袋', '远台薄切', 'K球分离练习',
  '安全球防守', '连续围球', '九球走位', '高低杆进阶',
  '底袋袋口球', '翻袋练习', '串球练习', '自由练习',
]

const projectOptions = computed(() => {
  const fromStore = store.myProjectList.map(p => p.name)
  const merged = [...new Set([...fromStore, ...defaultProjects])]
  return merged
})

const selectedProject = ref('')
const pots = ref(0)
const misses = ref(0)
const streak = ref(0)
const maxStreak = ref(0)
const notes = ref('')
const showSummary = ref(false)
const finishedSets = ref([])
const lastSet = ref({ pots: 0, misses: 0, hitRate: 0, maxStreak: 0 })

// Timer
const timerSeconds = ref(0)
const timerRunning = ref(false)
let timerInterval = null
const eventName = ref('分神')
const events = ref([])

const hitRate = computed(() => {
  const total = pots.value + misses.value
  return total > 0 ? Math.round((pots.value / total) * 100) : 0
})

function addPot() {
  pots.value++
  streak.value++
  if (streak.value > maxStreak.value) maxStreak.value = streak.value
}

function addMiss() {
  misses.value++
  streak.value = 0
}

function addBatch(n) {
  for (let i = 0; i < n; i++) {
    pots.value++
    streak.value++
    if (streak.value > maxStreak.value) maxStreak.value = streak.value
  }
}

function finishSet() {
  if (pots.value + misses.value === 0) return
  lastSet.value = {
    pots: pots.value,
    misses: misses.value,
    hitRate: hitRate.value,
    maxStreak: maxStreak.value,
  }
  finishedSets.value.push({ ...lastSet.value })
  showSummary.value = true
  stopTimer()
}

function nextSet() {
  pots.value = 0
  misses.value = 0
  streak.value = 0
  maxStreak.value = 0
  showSummary.value = false
  events.value = []
  timerSeconds.value = 0
}

async function finishAll() {
  // Save all sets as records to Supabase
  const totalPots = finishedSets.value.reduce((s, r) => s + r.pots, 0)
  const totalMisses = finishedSets.value.reduce((s, r) => s + r.misses, 0)
  const totalShots = totalPots + totalMisses
  const rate = totalShots > 0 ? Math.round((totalPots / totalShots) * 100) : 0
  const duration = Math.max(1, Math.round(timerSeconds.value / 60))

  if (store.isLoggedIn && selectedProject.value) {
    await store.addRecord({
      id: Date.now().toString(),
      project: selectedProject.value,
      duration,
      totalShots,
      hits: totalPots,
      hitRate: rate,
      note: notes.value || `完成${finishedSets.value.length}组训练`,
      date: store.getToday(),
      starred: false,
      createdAt: new Date().toISOString(),
    })
  }

  router.push('/')
}

function toggleTimer() {
  if (timerRunning.value) {
    stopTimer()
  } else {
    timerRunning.value = true
    timerInterval = setInterval(() => { timerSeconds.value++ }, 1000)
  }
}

function stopTimer() {
  timerRunning.value = false
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
}

function recordEvent() {
  events.value.push({
    name: eventName.value,
    interval: formatTimer(timerSeconds.value),
  })
}

function formatTimer(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
</script>

<style scoped>
.rec-page {
  padding: 16px 12px 24px;
  min-height: 100vh;
}

/* Project select */
.project-select {
  width: 100%;
  padding: 14px 16px;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  background: #fff;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%23b0b0b0' stroke-width='2'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
}

/* Streak */
.streak-area {
  text-align: center;
  padding: 24px 0 16px;
}
.streak-label {
  font-size: 14px;
  color: #b0b0b0;
  font-weight: 600;
}
.streak-num {
  font-size: 96px;
  font-weight: 900;
  color: #1a1a2e;
  line-height: 1;
  margin: 8px 0;
  transition: transform 0.15s;
}
.streak-num.fire {
  color: #2ecc71;
  text-shadow: 0 0 30px rgba(46, 204, 113, 0.3);
}
.streak-hint {
  font-size: 15px;
  color: #2ecc71;
  font-weight: 600;
}

/* Action buttons */
.action-area {
  display: flex;
  gap: 16px;
  margin: 0 12px 16px;
}
.btn-pot {
  flex: 2;
  padding: 28px 0;
  font-size: 32px;
  font-weight: 900;
  color: #fff;
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  border: none;
  border-radius: 20px;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(46, 204, 113, 0.4);
  transition: transform 0.1s;
}
.btn-pot:active { transform: scale(0.96); }
.btn-miss {
  flex: 1;
  padding: 28px 0;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  border: none;
  border-radius: 20px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(231, 76, 60, 0.3);
  transition: transform 0.1s;
}
.btn-miss:active { transform: scale(0.96); }

/* Batch buttons */
.batch-area {
  display: flex;
  gap: 10px;
  margin: 0 12px 16px;
}
.btn-batch {
  flex: 1;
  padding: 14px 0;
  font-size: 16px;
  font-weight: 700;
  color: #27ae60;
  background: rgba(46, 204, 113, 0.1);
  border: 2px solid rgba(46, 204, 113, 0.3);
  border-radius: 14px;
  cursor: pointer;
}
.btn-batch:active { background: rgba(46, 204, 113, 0.2); }
.btn-end {
  flex: 1.2;
  padding: 14px 0;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  background: #f0f0f0;
  border: none;
  border-radius: 14px;
  cursor: pointer;
}
.btn-end:active { background: #e0e0e0; }

/* Stats bar */
.stats-bar {
  display: flex;
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  margin: 0 12px 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}
.stat-item {
  flex: 1;
  text-align: center;
}
.stat-val {
  display: block;
  font-size: 22px;
  font-weight: 800;
  color: #1a1a2e;
}
.stat-label {
  display: block;
  font-size: 11px;
  color: #b0b0b0;
  margin-top: 2px;
}

/* Timer */
.timer-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.timer-display {
  font-size: 28px;
  font-weight: 800;
  color: #1a1a2e;
  font-variant-numeric: tabular-nums;
}
.btn-timer {
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: #3498db;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}
.btn-timer.running { background: #e67e22; }
.btn-event {
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 600;
  color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 10px;
  cursor: pointer;
}
.event-log { margin-top: 8px; }
.event-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}
.event-name { color: #e74c3c; font-weight: 500; }
.event-time { color: #666; font-variant-numeric: tabular-nums; }

/* Notes */
.note-input {
  width: 100%;
  min-height: 60px;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  background: #f8f9fa;
  border-radius: 10px;
  padding: 12px;
  border: none;
  outline: none;
  resize: vertical;
}

/* Summary */
.summary-area {
  text-align: center;
  padding: 24px 16px;
}
.summary-title {
  font-size: 20px;
  font-weight: 800;
  color: #1a1a2e;
  margin-bottom: 4px;
}
.summary-project {
  font-size: 14px;
  color: #b0b0b0;
  margin-bottom: 20px;
}
.summary-grid {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}
.summary-item {
  flex: 1;
  background: #fff;
  border-radius: 14px;
  padding: 16px 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}
.summary-val {
  display: block;
  font-size: 26px;
  font-weight: 800;
  color: #1a1a2e;
}
.summary-val.highlight {
  color: #2ecc71;
}
.summary-label {
  display: block;
  font-size: 11px;
  color: #b0b0b0;
  margin-top: 2px;
}
.summary-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.summary-actions .btn-secondary {
  margin-top: 0;
}

/* Sets history */
.sets-history { margin-bottom: 20px; }
.set-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  background: #fff;
  border-radius: 10px;
  margin-bottom: 6px;
  font-size: 13px;
  color: #666;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
</style>
