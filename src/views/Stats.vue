<!-- src/views/Stats.vue - Keep 风格统计（重构版） -->
<template>
  <div class="page">
    <div class="page-title">数据统计</div>

    <!-- 时间筛选 -->
    <div class="period-tabs">
      <button :class="{ active: period === 'week' }" @click="period = 'week'">
        近7天
      </button>
      <button :class="{ active: period === 'month' }" @click="period = 'month'">
        本月
      </button>
      <button :class="{ active: period === 'all' }" @click="period = 'all'">
        全部
      </button>
    </div>

    <!-- 四个核心指标卡片 2×2 -->
    <div class="metrics-grid">
      <!-- 计划完成率 -->
      <div class="metric-card completion">
        <div class="metric-icon">📋</div>
        <div class="metric-content">
          <span class="metric-value" v-if="metrics.planCompletion !== null"
            >{{ metrics.planCompletion }}%</span
          >
          <span class="metric-value no-plan" v-else>暂无计划</span>
          <span class="metric-label">计划完成率</span>
          <span
            class="metric-diff"
            v-if="metrics.planCompletion !== null"
            :class="metrics.planCompletion >= 70 ? 'good' : 'warn'"
          >
            {{ metrics.planCompletion >= 70 ? '✓ 达标' : '加油' }}
          </span>
          <span
            class="metric-diff"
            v-if="metrics.planCompletion === null"
            @click="$router.push('/training')"
            >去设置 →</span
          >
        </div>
      </div>

      <!-- 训练时长 -->
      <div class="metric-card duration">
        <div class="metric-icon">⏱</div>
        <div class="metric-content">
          <span class="metric-value"
            >{{ metrics.duration }}<span class="metric-unit">分钟</span></span
          >
          <span class="metric-label">训练时长</span>
          <span
            class="metric-diff"
            :class="
              metrics.durationDiff > 0
                ? 'up'
                : metrics.durationDiff < 0
                  ? 'down'
                  : 'flat'
            "
          >
            <template v-if="metrics.durationDiff > 0"
              >↑ 比昨日多{{ metrics.durationDiff }}分钟</template
            >
            <template v-else-if="metrics.durationDiff < 0"
              >↓ 比昨日少{{ Math.abs(metrics.durationDiff) }}分钟</template
            >
            <template v-else>— 与昨日持平</template>
          </span>
        </div>
      </div>

      <!-- 训练项目数 -->
      <div class="metric-card projects">
        <div class="metric-icon">🎱</div>
        <div class="metric-content">
          <span class="metric-value"
            >{{ metrics.projectCount }}<span class="metric-unit">个</span></span
          >
          <span class="metric-label">训练项目数</span>
          <span
            class="metric-diff"
            :class="
              metrics.projectDiff > 0
                ? 'up'
                : metrics.projectDiff < 0
                  ? 'down'
                  : 'flat'
            "
          >
            <template v-if="metrics.projectDiff > 0"
              >↑ 比昨日多{{ metrics.projectDiff }}个</template
            >
            <template v-else-if="metrics.projectDiff < 0"
              >↓ 比昨日少{{ Math.abs(metrics.projectDiff) }}个</template
            >
            <template v-else>— 与昨日持平</template>
          </span>
        </div>
      </div>

      <!-- 进球率 -->
      <div class="metric-card hitrate">
        <div class="metric-icon">🎯</div>
        <div class="metric-content">
          <span class="metric-value"
            >{{ metrics.hitRate }}<span class="metric-unit">%</span></span
          >
          <span class="metric-label">进球率</span>
          <span
            class="metric-diff"
            :class="
              metrics.hitRateDiff > 0
                ? 'up'
                : metrics.hitRateDiff < 0
                  ? 'down'
                  : 'flat'
            "
          >
            <template v-if="metrics.hitRateDiff > 0"
              >↑ 比昨日高{{ metrics.hitRateDiff }}%</template
            >
            <template v-else-if="metrics.hitRateDiff < 0"
              >↓ 比昨日低{{ Math.abs(metrics.hitRateDiff) }}%</template
            >
            <template v-else>— 与昨日持平</template>
          </span>
        </div>
      </div>
    </div>

    <!-- 进球率趋势图 -->
    <div class="section" v-if="stats.dates.length > 0">
      <div class="section-title">
        <div class="title-bar"></div>
        <span>进球率趋势</span>
      </div>
      <div class="chart-card">
        <div class="chart-area">
          <div class="chart-col" v-for="(rate, i) in stats.hitRates" :key="i">
            <div class="chart-track">
              <div
                class="chart-bar"
                :class="rate >= 70 ? 'good' : rate >= 50 ? 'mid' : 'bad'"
                :style="{ height: (rate / stats.maxRate) * 100 + '%' }"
              ></div>
            </div>
            <span class="chart-val">{{ rate }}%</span>
            <span class="chart-date">{{ stats.dates[i].slice(8) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 各项目表现排行 -->
    <div class="section" v-if="stats.projectStats.length > 0">
      <div class="section-title">
        <div class="title-bar"></div>
        <span>各项目表现</span>
      </div>
      <div class="project-list">
        <div
          class="project-item"
          v-for="(p, idx) in stats.projectStats"
          :key="p.name"
        >
          <div class="project-item-top">
            <div>
              <span class="project-rank" :class="idx < 3 ? 'top' : ''"
                >#{{ idx + 1 }}</span
              >
              <span class="project-name">{{ p.name }}</span>
              <span class="project-meta"
                >{{ p.count }}次 · {{ p.totalDuration }}分钟</span
              >
            </div>
            <span
              class="project-rate"
              :class="
                p.avgRate >= 70 ? 'good' : p.avgRate >= 50 ? 'mid' : 'bad'
              "
              >{{ p.avgRate }}%</span
            >
          </div>
          <div class="progress-track">
            <div
              class="progress-fill"
              :class="
                p.avgRate >= 70 ? 'good' : p.avgRate >= 50 ? 'mid' : 'bad'
              "
              :style="{ width: p.avgRate + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-card" v-if="stats.totalSessions === 0">
      <div class="empty-icon">📊</div>
      <span class="empty-text">还没有训练记录</span>
      <span class="empty-desc">去记录一次训练，数据会在这里展示</span>
      <button
        class="btn-primary"
        style="margin-top: 20px"
        @click="$router.push('/training')"
      >
        开始训练
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useBilliardStore } from '../stores/billiard'

const store = useBilliardStore()
const period = ref('week')

// 今日指标（四卡片）
const metrics = computed(() => store.getDailyMetrics(store.getToday()))

// 趋势数据（按时间段筛选）
const stats = computed(() => store.getStats(period.value))
</script>

<style scoped>
.page {
  padding: 0 12px 24px;
}
.page-title {
  font-size: 22px;
  font-weight: 800;
  color: #1a1a2e;
  padding: 16px 0;
}

.period-tabs {
  display: flex;
  background: #fff;
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}
.period-tabs button {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 14px;
  font-weight: 500;
  color: #999;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
}
.period-tabs button.active {
  background: #2ecc71;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(46, 204, 113, 0.3);
}

/* 四指标卡片 2×2 网格 */
.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}
.metric-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}
.metric-card::before {
  content: '';
  position: absolute;
  top: -10px;
  right: -10px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  opacity: 0.08;
}
.metric-card.completion::before {
  background: #2ecc71;
}
.metric-card.duration::before {
  background: #3498db;
}
.metric-card.projects::before {
  background: #ff6b35;
}
.metric-card.hitrate::before {
  background: #2ecc71;
}
.metric-icon {
  font-size: 26px;
  flex-shrink: 0;
  margin-top: 2px;
}
.metric-content {
  display: flex;
  flex-direction: column;
}
.metric-value {
  font-size: 24px;
  font-weight: 800;
  color: #1a1a2e;
  line-height: 1.1;
}
.metric-value.no-plan {
  font-size: 16px;
  color: #b0b0b0;
  font-weight: 600;
}
.metric-unit {
  font-size: 12px;
  font-weight: 500;
  color: #666;
}
.metric-label {
  font-size: 11px;
  color: #b0b0b0;
  margin-top: 4px;
}
.metric-diff {
  font-size: 11px;
  color: #b0b0b0;
  margin-top: 4px;
}
.metric-diff.up {
  color: #2ecc71;
  font-weight: 600;
}
.metric-diff.down {
  color: #e74c3c;
}
.metric-diff.flat {
  color: #b0b0b0;
}
.metric-diff.good {
  color: #2ecc71;
  font-weight: 600;
  cursor: default;
}
.metric-diff.warn {
  color: #ff6b35;
}
.metric-diff[style*='cursor'] {
  cursor: pointer;
}

/* 趋势图 */
.section {
  margin-bottom: 16px;
}
.chart-card {
  background: #fff;
  border-radius: 12px;
  padding: 18px 12px 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}
.chart-area {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  gap: 4px;
}
.chart-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  flex: 1;
}
.chart-track {
  width: 18px;
  height: 100px;
  background: #f0f0f0;
  border-radius: 9px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}
.chart-bar {
  width: 100%;
  border-radius: 9px;
  transition: height 0.3s;
  min-height: 2px;
}
.chart-bar.good {
  background: linear-gradient(180deg, #2ecc71, #27ae60);
}
.chart-bar.mid {
  background: linear-gradient(180deg, #ff6b35, #e55a2b);
}
.chart-bar.bad {
  background: linear-gradient(180deg, #e74c3c, #c0392b);
}
.chart-val {
  font-size: 11px;
  font-weight: 600;
  color: #666;
}
.chart-date {
  font-size: 10px;
  color: #ccc;
}

/* 项目排行 */
.project-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.project-item {
  background: #fff;
  border-radius: 10px;
  padding: 14px 16px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}
.project-item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.project-rank {
  font-size: 12px;
  font-weight: 800;
  color: #ccc;
  margin-right: 6px;
}
.project-rank.top {
  color: #2ecc71;
}
.project-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
}
.project-meta {
  display: block;
  font-size: 12px;
  color: #b0b0b0;
  margin-top: 3px;
  margin-left: 20px;
}
.project-rate {
  font-size: 18px;
  font-weight: 800;
}
.project-rate.good {
  color: #2ecc71;
}
.project-rate.mid {
  color: #ff6b35;
}
.project-rate.bad {
  color: #e74c3c;
}
.progress-track {
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}
.progress-fill.good {
  background: linear-gradient(90deg, #2ecc71, #27ae60);
}
.progress-fill.mid {
  background: linear-gradient(90deg, #ff6b35, #e55a2b);
}
.progress-fill.bad {
  background: linear-gradient(90deg, #e74c3c, #c0392b);
}

/* 空状态 */
.empty-card {
  text-align: center;
  padding: 60px 24px;
}
.empty-icon {
  font-size: 50px;
  margin-bottom: 12px;
  display: block;
}
.empty-text {
  display: block;
  font-size: 17px;
  font-weight: 600;
  color: #333;
}
.empty-desc {
  display: block;
  font-size: 13px;
  color: #b0b0b0;
  margin-top: 6px;
}
</style>
