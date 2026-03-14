<!-- src/views/Profile.vue - Keep 风格个人中心 -->
<template>
  <div class="page">

    <!-- 未登录 -->
    <div v-if="!store.isLoggedIn">
      <div class="hero">
        <span class="hero-icon">🎱</span>
        <h1 class="hero-title">台球训练记录</h1>
        <p class="hero-desc">记录每一次出杆，见证进步</p>
      </div>

      <div class="card" style="margin:-15px 12px 12px; position:relative; z-index:1;">
        <div class="card-title">选择身份</div>
        <div class="role-grid">
          <div class="role-card" :class="{active: role === 'coach'}" @click="role = 'coach'">
            <span class="role-emoji">🧑🏫</span><span class="role-name">教练</span>
            <span class="role-desc">管理学员 · 记录训练</span>
          </div>
          <div class="role-card" :class="{active: role === 'student'}" @click="role = 'student'">
            <span class="role-emoji">👨🎓</span><span class="role-name">学员</span>
            <span class="role-desc">记录训练 · 查看进步</span>
          </div>
        </div>
      </div>

      <div class="card" style="margin:0 12px;">
        <div class="card-title">你的昵称</div>
        <input class="nick-input" v-model="nickName" placeholder="输入昵称" maxlength="20" />
      </div>

      <div style="padding:24px 12px;">
        <button class="btn-primary" @click="saveProfile">开始使用</button>
      </div>
    </div>

    <!-- 已登录 -->
    <div v-else>
      <div class="profile-hero">
        <div class="avatar-circle">{{store.userInfo?.nickName?.[0] || '?'}}</div>
        <span class="profile-name">{{store.userInfo?.nickName}}</span>
        <span class="role-badge">{{store.isCoach ? '🧑🏫 教练' : '👨🎓 学员'}}</span>
      </div>

      <div class="data-card">
        <div class="data-item">
          <span class="data-num">{{store.records.length}}</span>
          <span class="data-label">训练次数</span>
        </div>
        <div class="data-divider"></div>
        <div class="data-item">
          <span class="data-num">{{totalDuration}}</span>
          <span class="data-label">总时长(分)</span>
        </div>
        <div class="data-divider"></div>
        <div class="data-item">
          <span class="data-num">{{store.starredRecords.length}}</span>
          <span class="data-label">收藏</span>
        </div>
      </div>

      <div class="menu-list">
        <div class="menu-item" @click="$router.push('/square')">
          <span class="menu-icon">🏪</span><span class="menu-text">项目广场</span><span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="$router.push('/my-projects')">
          <span class="menu-icon">📚</span><span class="menu-text">我的项目 ({{store.myProjectList.length}})</span><span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="$router.push('/my-starred')">
          <span class="menu-icon">⭐</span><span class="menu-text">心得收藏 ({{store.starredRecords.length}})</span><span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" v-if="store.isCoach">
          <span class="menu-icon">👥</span><span class="menu-text">我的学员</span><span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" v-if="store.isCoach">
          <span class="menu-icon">📝</span><span class="menu-text">布置作业</span><span class="menu-arrow">›</span>
        </div>
        <div class="menu-item danger" @click="handleLogout">
          <span class="menu-icon">🚪</span><span class="menu-text">退出登录</span><span class="menu-arrow">›</span>
        </div>
      </div>

      <div class="footer">台球训练记录 v2.0 Web</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBilliardStore } from '../stores/billiard'

const store = useBilliardStore()
const router = useRouter()

const role = ref('student')
const nickName = ref('')

const totalDuration = computed(() => store.records.reduce((s, r) => s + (r.duration || 0), 0))

function saveProfile() {
  if (!nickName.value.trim()) { alert('请输入昵称'); return }
  store.setUserInfo({
    role: role.value,
    nickName: nickName.value.trim(),
    id: 'user_' + Date.now(),
    createdAt: new Date().toISOString()
  })
  router.push('/')
}

function handleLogout() {
  if (confirm('确定要退出登录吗？')) {
    store.logout()
  }
}
</script>

<style scoped>
.hero {
  background: linear-gradient(160deg, #2ecc71, #27ae60, #1abc9c);
  padding: 40px 24px 50px; text-align: center; position: relative; overflow: hidden;
}
.hero-icon { display: block; font-size: 40px; margin-bottom: 12px; }
.hero-title { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: 2px; margin-bottom: 8px; }
.hero-desc { font-size: 14px; color: rgba(255,255,255,0.75); }

.role-grid { display: flex; gap: 12px; }
.role-card {
  flex: 1; text-align: center; padding: 16px 10px; border-radius: 10px;
  border: 2px solid #f0f0f0; cursor: pointer; transition: all 0.2s;
}
.role-card.active { border-color: #2ecc71; background: rgba(46,204,113,0.06); }
.role-emoji { display: block; font-size: 28px; margin-bottom: 6px; }
.role-name { display: block; font-size: 16px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
.role-desc { display: block; font-size: 12px; color: #b0b0b0; }
.nick-input {
  font-size: 15px; padding: 10px 12px; background: #f8f9fa; border-radius: 8px;
  border: none; width: 100%; outline: none; margin-top: 4px;
}

.profile-hero {
  background: linear-gradient(160deg, #2ecc71, #27ae60, #1abc9c);
  padding: 40px 24px 30px; text-align: center;
}
.avatar-circle {
  width: 70px; height: 70px; border-radius: 50%; background: rgba(255,255,255,0.2);
  color: #fff; font-size: 28px; font-weight: 700; display: flex; align-items: center;
  justify-content: center; margin: 0 auto 12px;
}
.profile-name { display: block; font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 8px; }
.role-badge {
  display: inline-block; background: rgba(255,255,255,0.2); color: #fff; font-size: 12px;
  padding: 4px 12px; border-radius: 12px;
}

.data-card {
  display: flex; background: #fff; border-radius: 12px; padding: 20px 18px;
  margin: -15px 12px 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); position: relative; z-index: 1;
}
.data-item { flex: 1; text-align: center; }
.data-num { display: block; font-size: 24px; font-weight: 800; color: #2ecc71; }
.data-label { display: block; font-size: 12px; color: #b0b0b0; margin-top: 4px; }
.data-divider { width: 1px; height: 30px; background: #f0f0f0; }

.menu-list { margin: 0 12px; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
.menu-item {
  display: flex; align-items: center; padding: 16px 18px; border-bottom: 1px solid #f5f5f5; cursor: pointer;
}
.menu-item:last-child { border-bottom: none; }
.menu-item:active { background: #fafafa; }
.menu-icon { font-size: 18px; margin-right: 10px; }
.menu-text { flex: 1; font-size: 15px; color: #333; }
.menu-item.danger .menu-text { color: #e74c3c; }
.menu-arrow { font-size: 18px; color: #ddd; }

.footer { text-align: center; padding: 24px 0 16px; font-size: 12px; color: #ccc; }
</style>
