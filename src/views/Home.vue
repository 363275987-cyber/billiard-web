<!-- src/views/Home.vue - Keep 风格首页 -->
<template>
  <div class="page">

    <!-- 未登录 -->
    <div v-if="!store.isLoggedIn" class="login-page">
      <div class="login-hero">
        <div class="login-circle">🎱</div>
        <h1 class="login-title">台球训练记录</h1>
        <p class="login-sub">记录每一次出杆，见证你的进步</p>
      </div>
      <div class="login-actions">
        <button class="btn-start" @click="$router.push('/profile')">开始使用</button>
        <p class="login-tip">简单三步，开启你的训练之旅</p>
      </div>
    </div>

    <!-- 已登录 -->
    <div v-else>

      <!-- 渐变头部 -->
      <div class="hero">
        <div class="hero-top">
          <div class="hero-left">
            <span class="hero-greeting">Hi，{{store.userInfo?.nickName || '球友'}} 👋</span>
            <span class="hero-date">{{todayStr}}</span>
          </div>
          <div class="hero-streak" v-if="store.weekStreak > 0">
            <span class="streak-num">{{store.weekStreak}}</span>
            <span class="streak-label">天连续</span>
          </div>
        </div>

        <!-- 今日数据卡片 -->
        <div class="hero-card">
          <div class="hero-card-row">
            <div class="hero-stat">
              <span class="hero-stat-num">{{store.todaySummary.duration}}</span>
              <span class="hero-stat-unit">分钟</span>
              <span class="hero-stat-label">今日时长</span>
            </div>
            <div class="hero-divider"></div>
            <div class="hero-stat">
              <span class="hero-stat-num">{{store.todaySummary.hitRate}}<span class="hero-stat-percent">%</span></span>
              <span class="hero-stat-label">命中率</span>
            </div>
            <div class="hero-divider"></div>
            <div class="hero-stat">
              <span class="hero-stat-num">{{store.todaySummary.items}}</span>
              <span class="hero-stat-unit">项</span>
              <span class="hero-stat-label">训练项目</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 快捷入口 -->
      <div class="quick-grid">
        <div class="quick-item" @click="$router.push('/square')">
          <div class="quick-icon-wrap teal"><span>🏪</span></div>
          <span class="quick-text">项目广场</span>
        </div>
        <div class="quick-item" @click="$router.push('/stats')">
          <div class="quick-icon-wrap blue"><span>📊</span></div>
          <span class="quick-text">数据统计</span>
        </div>
        <div class="quick-item" v-if="store.isCoach">
          <div class="quick-icon-wrap purple"><span>👥</span></div>
          <span class="quick-text">我的学员</span>
        </div>
      </div>

      <!-- 今日训练记录 -->
      <div class="section">
        <div class="section-title">
          <div class="title-bar"></div>
          <span>{{store.todaySummary.count > 0 ? '今日训练' : '开始今天的训练'}}</span>
        </div>

        <div v-if="store.todaySummary.count > 0" class="record-list">
          <div class="record-card" v-for="r in store.todayRecords" :key="r.id" @click="$router.push('/detail/' + r.id)">
            <div class="record-card-left">
              <div class="record-card-icon" :class="r.hitRate >= 70 ? 'good' : r.hitRate >= 50 ? 'mid' : 'bad'">
                {{r.hitRate >= 70 ? '🔥' : r.hitRate >= 50 ? '💪' : '🎯'}}
              </div>
              <div class="record-card-info">
                <span class="record-card-name">{{r.project}}</span>
                <span class="record-card-meta">{{r.duration}}分钟 · {{r.totalShots}}杆</span>
              </div>
            </div>
            <div class="record-card-right">
              <span class="record-card-rate" :class="r.hitRate >= 70 ? 'good' : r.hitRate >= 50 ? 'mid' : 'bad'">{{r.hitRate}}%</span>
              <span class="record-card-arrow">›</span>
            </div>
          </div>
        </div>

        <div v-else class="empty-train">
          <div class="empty-illustration">🎯</div>
          <span class="empty-main">今天还没有训练记录</span>
          <span class="empty-desc">坚持训练，持续进步</span>
          <button class="btn-primary" style="margin-top:20px;" @click="$router.push('/record?from=training')">开始训练</button>
        </div>
      </div>

      <!-- 本周柱状图 -->
      <div class="section" v-if="weekData.length > 0">
        <div class="section-header">
          <div class="section-title">
            <div class="title-bar"></div>
            <span>本周训练</span>
          </div>
          <span class="section-more" @click="$router.push('/stats')">查看全部 ›</span>
        </div>
        <div class="week-bar-chart">
          <div class="bar-col" v-for="(item, i) in weekData" :key="i">
            <div class="bar-track">
              <div class="bar-fill" :class="item.rate >= 70 ? 'good' : item.rate >= 50 ? 'mid' : 'bad'"
                    :style="{ height: item.rate + '%' }"></div>
            </div>
            <span class="bar-value">{{item.rate}}%</span>
            <span class="bar-label">{{item.day}}</span>
          </div>
        </div>
      </div>

      <!-- 底部统计 -->
      <div class="bottom-stat">
        <span>累计训练 <strong style="color:#2ecc71">{{store.records.length}}</strong> 次</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useBilliardStore } from '../stores/billiard'

const store = useBilliardStore()

const todayStr = computed(() => {
  const d = new Date()
  const w = ['日','一','二','三','四','五','六']
  return `${d.getMonth()+1}月${d.getDate()}日 周${w[d.getDay()]}`
})

const weekData = computed(() => {
  const stats = store.getStats('week')
  const now = new Date()
  const w = ['日','一','二','三','四','五','六']
  const result = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    const dateStr = store.formatDate(d)
    const idx = stats.dates.indexOf(dateStr)
    result.push({
      day: '周' + w[d.getDay()],
      rate: idx >= 0 ? stats.hitRates[idx] : 0
    })
  }
  return result
})
</script>

<style scoped>
.page { min-height: 100vh; }

/* 登录引导 */
.login-page { min-height: 100vh; display: flex; flex-direction: column; }
.login-hero {
  flex: 1;
  background: linear-gradient(160deg, #2ecc71, #27ae60, #1abc9c);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 40px; position: relative; overflow: hidden;
}
.login-circle {
  width: 90px; height: 90px; background: rgba(255,255,255,0.15); border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 40px; margin-bottom: 24px;
}
.login-title { font-size: 24px; font-weight: 800; color: #fff; letter-spacing: 2px; margin-bottom: 8px; }
.login-sub { font-size: 14px; color: rgba(255,255,255,0.75); }
.login-actions { padding: 30px 24px; text-align: center; }
.btn-start {
  background: linear-gradient(135deg, #2ecc71, #27ae60); color: #fff; border: none;
  border-radius: 25px; padding: 16px 0; font-size: 17px; font-weight: 600; width: 100%;
  box-shadow: 0 6px 18px rgba(46,204,113,0.35); cursor: pointer;
}
.login-tip { display: block; margin-top: 12px; font-size: 12px; color: #b0b0b0; }

/* 头部 */
.hero-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; position: relative; z-index: 1; }
.hero-greeting { display: block; font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 4px; }
.hero-date { display: block; font-size: 13px; color: rgba(255,255,255,0.7); }
.hero-streak {
  background: rgba(255,255,255,0.2); border-radius: 10px; padding: 8px 12px; text-align: center;
}
.streak-num { display: block; font-size: 20px; font-weight: 800; color: #fff; line-height: 1.1; }
.streak-label { display: block; font-size: 11px; color: rgba(255,255,255,0.8); margin-top: 2px; }

.hero-card {
  background: rgba(255,255,255,0.15); border-radius: 12px; padding: 18px;
  margin-bottom: -15px; position: relative; z-index: 1;
}
.hero-card-row { display: flex; justify-content: space-around; align-items: center; }
.hero-stat { text-align: center; flex: 1; }
.hero-stat-num { font-size: 26px; font-weight: 800; color: #fff; line-height: 1.1; }
.hero-stat-percent { font-size: 14px; }
.hero-stat-unit { font-size: 12px; color: rgba(255,255,255,0.7); }
.hero-stat-label { display: block; font-size: 11px; color: rgba(255,255,255,0.65); margin-top: 5px; }
.hero-divider { width: 1px; height: 35px; background: rgba(255,255,255,0.2); }

/* 快捷入口 */
.quick-grid {
  display: flex; justify-content: space-around; padding: 24px 12px 8px; background: #fff;
  margin: 12px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}
.quick-item { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; }
.quick-item:active { opacity: 0.7; }
.quick-icon-wrap {
  width: 48px; height: 48px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; font-size: 22px;
}
.quick-icon-wrap.green { background: rgba(46,204,113,0.12); }
.quick-icon-wrap.orange { background: rgba(255,107,53,0.12); }
.quick-icon-wrap.blue { background: rgba(52,152,219,0.12); }
.quick-icon-wrap.purple { background: rgba(155,89,182,0.12); }
.quick-icon-wrap.teal { background: rgba(26,188,156,0.12); }
.quick-text { font-size: 12px; color: #333; font-weight: 500; }

/* 记录卡片 */
.record-list { display: flex; flex-direction: column; gap: 8px; }
.record-card {
  background: #fff; border-radius: 10px; padding: 14px 16px; display: flex;
  justify-content: space-between; align-items: center; box-shadow: 0 1px 6px rgba(0,0,0,0.04); cursor: pointer;
}
.record-card:active { background: #fafafa; }
.record-card-left { display: flex; align-items: center; gap: 10px; }
.record-card-icon {
  width: 36px; height: 36px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center; font-size: 18px;
}
.record-card-icon.good { background: rgba(46,204,113,0.12); }
.record-card-icon.mid { background: rgba(255,107,53,0.12); }
.record-card-icon.bad { background: rgba(231,76,60,0.1); }
.record-card-name { display: block; font-size: 15px; font-weight: 600; color: #1a1a2e; }
.record-card-meta { display: block; font-size: 12px; color: #b0b0b0; margin-top: 3px; }
.record-card-right { display: flex; align-items: center; gap: 4px; }
.record-card-rate { font-size: 19px; font-weight: 800; }
.record-card-rate.good { color: #2ecc71; }
.record-card-rate.mid { color: #ff6b35; }
.record-card-rate.bad { color: #e74c3c; }
.record-card-arrow { font-size: 18px; color: #ddd; }

/* 空训练 */
.empty-train { background: #fff; border-radius: 12px; padding: 32px 24px; text-align: center; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
.empty-illustration { font-size: 50px; margin-bottom: 12px; }
.empty-main { display: block; font-size: 16px; font-weight: 600; color: #333; }
.empty-desc { display: block; font-size: 13px; color: #b0b0b0; margin-top: 6px; }

/* 本周柱状图 */
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.section-more { font-size: 13px; color: #b0b0b0; cursor: pointer; }
.week-bar-chart {
  background: #fff; border-radius: 12px; padding: 18px 12px 12px;
  display: flex; justify-content: space-around; align-items: flex-end; box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}
.bar-col { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
.bar-track { width: 16px; height: 80px; background: #f0f0f0; border-radius: 8px; display: flex; align-items: flex-end; overflow: hidden; }
.bar-fill { width: 100%; border-radius: 8px; transition: height 0.3s; }
.bar-fill.good { background: linear-gradient(180deg, #2ecc71, #27ae60); }
.bar-fill.mid { background: linear-gradient(180deg, #ff6b35, #e55a2b); }
.bar-fill.bad { background: linear-gradient(180deg, #e74c3c, #c0392b); }
.bar-value { font-size: 11px; font-weight: 600; color: #666; }
.bar-label { font-size: 11px; color: #b0b0b0; }

/* 底部 */
.bottom-stat { text-align: center; padding: 24px 0 16px; font-size: 13px; color: #b0b0b0; }
</style>
