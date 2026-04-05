<!-- src/views/Home.vue - v2 简化首页 -->
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
        <button class="btn-start" @click="$router.push('/profile')">
          开始使用
        </button>
      </div>
    </div>

    <!-- 已登录 -->
    <div v-else>
      <div class="hero">
        <div class="hero-top">
          <div>
            <span class="hero-greeting">Hi，{{ store.userInfo?.nickName || '球友' }} 👋</span>
            <span class="hero-date">{{ todayStr }}</span>
          </div>
          <div class="hero-streak" v-if="store.weekStreak > 0">
            <span class="streak-num">{{ store.weekStreak }}</span>
            <span class="streak-label">天连续</span>
          </div>
        </div>

        <div class="hero-card">
          <div class="hero-card-row">
            <div class="hero-stat">
              <span class="hero-stat-num">{{ store.todaySummary.duration }}</span>
              <span class="hero-stat-unit">分钟</span>
              <span class="hero-stat-label">今日时长</span>
            </div>
            <div class="hero-divider"></div>
            <div class="hero-stat">
              <span class="hero-stat-num">{{ store.todaySummary.hitRate }}<span class="hero-stat-percent">%</span></span>
              <span class="hero-stat-label">命中率</span>
            </div>
            <div class="hero-divider"></div>
            <div class="hero-stat">
              <span class="hero-stat-num">{{ store.todaySummary.items }}</span>
              <span class="hero-stat-unit">项</span>
              <span class="hero-stat-label">训练项目</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 开始训练大按钮 -->
      <div style="padding: 20px 12px 12px;">
        <button class="btn-start-train" @click="$router.push('/record')">
          🎱 开始训练
        </button>
      </div>

      <!-- 最近训练 -->
      <div class="section" v-if="recentRecords.length > 0">
        <div class="section-title">
          <div class="title-bar"></div>
          <span>最近训练</span>
        </div>
        <div class="record-list">
          <div class="record-card" v-for="r in recentRecords" :key="r.id">
            <div class="record-card-left">
              <div class="record-card-icon" :class="r.hitRate >= 70 ? 'good' : r.hitRate >= 50 ? 'mid' : 'bad'">
                {{ r.hitRate >= 70 ? '🔥' : r.hitRate >= 50 ? '💪' : '🎯' }}
              </div>
              <div class="record-card-info">
                <span class="record-card-name">{{ r.project || '未命名' }}</span>
                <span class="record-card-meta">{{ r.date }} · {{ r.duration }}分钟 · {{ r.totalShots }}杆</span>
              </div>
            </div>
            <span class="record-card-rate" :class="r.hitRate >= 70 ? 'good' : r.hitRate >= 50 ? 'mid' : 'bad'">{{ r.hitRate }}%</span>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="section" v-else>
        <div class="empty-train">
          <div class="empty-illustration">🎯</div>
          <span class="empty-main">今天还没有训练记录</span>
          <span class="empty-desc">点击上方按钮开始训练</span>
        </div>
      </div>

      <div class="bottom-stat">
        累计训练 <strong style="color: #2ecc71">{{ store.records.length }}</strong> 次
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
  const w = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getMonth() + 1}月${d.getDate()}日 周${w[d.getDay()]}`
})

const recentRecords = computed(() => store.records.slice(0, 5))
</script>

<style scoped>
.page { min-height: 100vh; }

/* Login */
.login-page { min-height: 100vh; display: flex; flex-direction: column; }
.login-hero {
  flex: 1;
  background: linear-gradient(160deg, #2ecc71, #27ae60, #1abc9c);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 40px;
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
  border-radius: 25px; padding: 16px 0; font-size: 17px; font-weight: 600;
  width: 100%; box-shadow: 0 6px 18px rgba(46,204,113,0.35); cursor: pointer;
}

/* Hero */
.hero { background: linear-gradient(160deg, #2ecc71 0%, #27ae60 40%, #1abc9c 100%); padding: 30px 18px 0; }
.hero-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
.hero-greeting { display: block; font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 4px; }
.hero-date { display: block; font-size: 13px; color: rgba(255,255,255,0.7); }
.hero-streak { background: rgba(255,255,255,0.2); border-radius: 10px; padding: 8px 12px; text-align: center; }
.streak-num { display: block; font-size: 20px; font-weight: 800; color: #fff; line-height: 1.1; }
.streak-label { display: block; font-size: 11px; color: rgba(255,255,255,0.8); margin-top: 2px; }
.hero-card { background: rgba(255,255,255,0.15); border-radius: 12px; padding: 18px; margin-bottom: -15px; }
.hero-card-row { display: flex; justify-content: space-around; align-items: center; }
.hero-stat { text-align: center; flex: 1; }
.hero-stat-num { font-size: 26px; font-weight: 800; color: #fff; line-height: 1.1; }
.hero-stat-percent { font-size: 14px; }
.hero-stat-unit { font-size: 12px; color: rgba(255,255,255,0.7); }
.hero-stat-label { display: block; font-size: 11px; color: rgba(255,255,255,0.65); margin-top: 5px; }
.hero-divider { width: 1px; height: 35px; background: rgba(255,255,255,0.2); }

/* Start train button */
.btn-start-train {
  display: block; width: 100%; padding: 18px 0;
  background: linear-gradient(135deg, #2ecc71, #27ae60); color: #fff; border: none;
  border-radius: 16px; font-size: 20px; font-weight: 700; cursor: pointer;
  box-shadow: 0 6px 20px rgba(46,204,113,0.4); letter-spacing: 2px;
}
.btn-start-train:active { transform: scale(0.98); }

/* Records */
.record-list { display: flex; flex-direction: column; gap: 8px; }
.record-card {
  background: #fff; border-radius: 10px; padding: 14px 16px;
  display: flex; justify-content: space-between; align-items: center;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
}
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
.record-card-rate { font-size: 19px; font-weight: 800; }
.record-card-rate.good { color: #2ecc71; }
.record-card-rate.mid { color: #ff6b35; }
.record-card-rate.bad { color: #e74c3c; }

/* Empty */
.empty-train {
  background: #fff; border-radius: 12px; padding: 32px 24px; text-align: center;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}
.empty-illustration { font-size: 50px; margin-bottom: 12px; }
.empty-main { display: block; font-size: 16px; font-weight: 600; color: #333; }
.empty-desc { display: block; font-size: 13px; color: #b0b0b0; margin-top: 6px; }

.bottom-stat { text-align: center; padding: 24px 0 16px; font-size: 13px; color: #b0b0b0; }
</style>
