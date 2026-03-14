<!-- src/views/Profile.vue - Keep 风格个人中心（手机号登录版） -->
<template>
  <div class="page">

    <!-- 未登录 -->
    <div v-if="!store.isLoggedIn">
      <div class="hero">
        <span class="hero-icon">🎱</span>
        <h1 class="hero-title">台球训练记录</h1>
        <p class="hero-desc">记录每一次出杆，见证进步</p>
      </div>

      <div class="card login-card">
        <div class="card-title">手机号登录</div>

        <!-- 手机号 -->
        <div class="input-group">
          <span class="input-prefix">+86</span>
          <input
            class="phone-input"
            v-model="phone"
            type="tel"
            maxlength="11"
            placeholder="请输入手机号"
            @input="onPhoneInput"
          />
        </div>

        <!-- 验证码 -->
        <div class="code-row">
          <input
            class="code-input"
            v-model="code"
            type="text"
            maxlength="6"
            placeholder="请输入验证码"
            @input="code = code.replace(/\D/g, '')"
          />
          <button
            class="btn-send-code"
            :class="{disabled: !canSendCode}"
            :disabled="!canSendCode"
            @click="sendCode"
          >
            {{codeCountdown > 0 ? codeCountdown + 's' : '获取验证码'}}
          </button>
        </div>

        <!-- 身份选择 -->
        <div class="role-section">
          <div class="role-label">选择身份</div>
          <div class="role-grid">
            <div class="role-card" :class="{active: role === 'coach'}" @click="role = 'coach'">
              <span class="role-emoji">🧑🏫</span><span class="role-name">教练</span>
            </div>
            <div class="role-card" :class="{active: role === 'student'}" @click="role = 'student'">
              <span class="role-emoji">👨🎓</span><span class="role-name">学员</span>
            </div>
          </div>
        </div>

        <button class="btn-primary" @click="handleLogin">登录 / 注册</button>
        <p class="login-tip">首次登录将自动注册</p>
      </div>
    </div>

    <!-- 已登录 -->
    <div v-else>
      <div class="profile-hero">
        <div class="avatar-circle">{{store.userInfo?.nickName?.[0] || store.userInfo?.phone?.slice(-2) || '?'}}</div>
        <span class="profile-name">{{store.userInfo?.nickName || '台球爱好者'}}</span>
        <span class="phone-display">{{maskedPhone}}</span>
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
        <div class="menu-item" @click="showEditNick = true">
          <span class="menu-icon">✏️</span><span class="menu-text">修改昵称</span><span class="menu-arrow">›</span>
        </div>
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

      <div class="footer">台球训练记录 v2.1 Web</div>

      <!-- 修改昵称弹层 -->
      <div class="modal-mask" v-if="showEditNick" @click.self="showEditNick = false">
        <div class="modal-sheet">
          <div class="modal-header">
            <span class="modal-title">修改昵称</span>
            <span class="modal-close" @click="showEditNick = false">✕</span>
          </div>
          <input class="nick-edit-input" v-model="editNickName" placeholder="输入新昵称" maxlength="20" />
          <button class="btn-primary" @click="saveNick">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBilliardStore } from '../stores/billiard'

const store = useBilliardStore()
const router = useRouter()

// 登录表单
const phone = ref('')
const code = ref('')
const role = ref('student')
const codeCountdown = ref(0)
let countdownTimer = null

// 修改昵称
const showEditNick = ref(false)
const editNickName = ref('')

const canSendCode = computed(() => /^1\d{10}$/.test(phone.value) && codeCountdown.value === 0)

const maskedPhone = computed(() => {
  const p = store.userInfo?.phone
  if (!p || p.length < 11) return ''
  return p.slice(0, 3) + '****' + p.slice(7)
})

const totalDuration = computed(() => store.records.reduce((s, r) => s + (r.duration || 0), 0))

function onPhoneInput() {
  phone.value = phone.value.replace(/\D/g, '').slice(0, 11)
}

// ===== 验证码系统（前端模拟） =====
// 生产环境需要对接短信 API（如阿里云 SMS、腾讯云 SMS）
// 这里用 localStorage 模拟验证码，方便开发测试
function sendCode() {
  if (!canSendCode.value) return

  // 生成 6 位验证码
  const verifyCode = String(Math.floor(100000 + Math.random() * 900000))
  // 存到 localStorage，模拟发送（实际项目调后端 API）
  localStorage.setItem('bt_verify_' + phone.value, JSON.stringify({
    code: verifyCode,
    role: role.value,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 分钟有效
  }))

  // 模拟弹窗显示验证码（方便测试）
  alert('验证码已发送（模拟）：' + verifyCode + '\n\n正式版本这里会发短信到 ' + phone.value)

  // 开始倒计时
  codeCountdown.value = 60
  countdownTimer = setInterval(() => {
    codeCountdown.value--
    if (codeCountdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

function handleLogin() {
  const p = phone.value.trim()
  const c = code.value.trim()

  if (!/^1\d{10}$/.test(p)) {
    alert('请输入正确的11位手机号')
    return
  }
  if (c.length !== 6) {
    alert('请输入6位验证码')
    return
  }

  // 验证码校验
  const stored = JSON.parse(localStorage.getItem('bt_verify_' + p) || '{}')
  if (!stored.code || stored.code !== c) {
    alert('验证码错误，请重新输入')
    return
  }
  if (Date.now() > stored.expiresAt) {
    alert('验证码已过期，请重新获取')
    localStorage.removeItem('bt_verify_' + p)
    return
  }

  // 用手机号生成唯一 ID（SHA-256 哈希的简化版）
  const userId = 'u_' + simpleHash(p)

  store.setUserInfo({
    id: userId,
    phone: p,
    role: role.value,
    nickName: '台球爱好者',
    createdAt: new Date().toISOString()
  })

  localStorage.removeItem('bt_verify_' + p)
  alert('登录成功 🎉')
  router.push('/')
}

// 简单哈希函数，同一手机号永远生成同一 ID
function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

function saveNick() {
  if (!editNickName.value.trim()) { alert('昵称不能为空'); return }
  store.setUserInfo({ ...store.userInfo, nickName: editNickName.value.trim() })
  showEditNick.value = false
}

function handleLogout() {
  if (confirm('确定要退出登录吗？')) {
    store.logout()
  }
}

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style scoped>
.hero {
  background: linear-gradient(160deg, #2ecc71, #27ae60, #1abc9c);
  padding: 40px 24px 50px; text-align: center; position: relative; overflow: hidden;
}
.hero-icon { display: block; font-size: 40px; margin-bottom: 12px; }
.hero-title { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: 2px; margin-bottom: 8px; }
.hero-desc { font-size: 14px; color: rgba(255,255,255,0.75); }

.login-card {
  margin: -15px 12px 0; position: relative; z-index: 1;
  padding: 20px;
}
.login-card .card-title { margin-bottom: 16px; }

.input-group {
  display: flex; align-items: center; background: #f8f9fa; border-radius: 10px;
  padding: 0 14px; margin-bottom: 12px; border: 2px solid transparent; transition: border-color 0.2s;
}
.input-group:focus-within { border-color: #2ecc71; }
.input-prefix {
  font-size: 15px; font-weight: 600; color: #333; margin-right: 10px; padding-right: 10px;
  border-right: 1px solid #e0e0e0;
}
.phone-input {
  flex: 1; font-size: 16px; padding: 14px 0; background: transparent; border: none; outline: none;
  color: #1a1a2e; font-weight: 500;
}
.phone-input::placeholder { color: #ccc; }

.code-row {
  display: flex; gap: 10px; margin-bottom: 16px;
}
.code-input {
  flex: 1; font-size: 16px; padding: 14px; background: #f8f9fa; border-radius: 10px;
  border: 2px solid transparent; outline: none; color: #1a1a2e; font-weight: 500;
  letter-spacing: 4px; text-align: center; transition: border-color 0.2s;
}
.code-input:focus { border-color: #2ecc71; }
.code-input::placeholder { letter-spacing: 0; color: #ccc; }

.btn-send-code {
  flex-shrink: 0; padding: 14px 16px; border: none; border-radius: 10px;
  background: linear-gradient(135deg, #2ecc71, #27ae60); color: #fff;
  font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap;
  transition: opacity 0.2s;
}
.btn-send-code:active { opacity: 0.85; }
.btn-send-code.disabled {
  background: #f0f0f0; color: #ccc; cursor: default;
}

.role-section { margin-bottom: 16px; }
.role-label { font-size: 13px; color: #999; font-weight: 600; margin-bottom: 8px; display: block; }
.role-grid { display: flex; gap: 12px; }
.role-card {
  flex: 1; text-align: center; padding: 14px 10px; border-radius: 10px;
  border: 2px solid #f0f0f0; cursor: pointer; transition: all 0.2s;
}
.role-card.active { border-color: #2ecc71; background: rgba(46,204,113,0.06); }
.role-emoji { display: block; font-size: 24px; margin-bottom: 4px; }
.role-name { display: block; font-size: 15px; font-weight: 600; color: #1a1a2e; }

.login-tip {
  text-align: center; font-size: 12px; color: #ccc; margin-top: 12px;
}

/* 已登录 */
.profile-hero {
  background: linear-gradient(160deg, #2ecc71, #27ae60, #1abc9c);
  padding: 40px 24px 30px; text-align: center;
}
.avatar-circle {
  width: 70px; height: 70px; border-radius: 50%; background: rgba(255,255,255,0.2);
  color: #fff; font-size: 28px; font-weight: 700; display: flex; align-items: center;
  justify-content: center; margin: 0 auto 12px;
}
.profile-name { display: block; font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 4px; }
.phone-display {
  display: block; font-size: 14px; color: rgba(255,255,255,0.7); margin-bottom: 8px;
}
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

/* 修改昵称弹层 */
.modal-mask {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4); z-index: 1000;
  display: flex; align-items: flex-end; justify-content: center;
}
.modal-sheet {
  width: 100%; max-width: 480px; background: #fff;
  border-radius: 16px 16px 0 0; padding: 20px;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
}
.modal-title { font-size: 17px; font-weight: 700; color: #1a1a2e; }
.modal-close { font-size: 20px; color: #b0b0b0; cursor: pointer; padding: 4px; }
.nick-edit-input {
  width: 100%; font-size: 16px; padding: 14px; background: #f8f9fa; border-radius: 10px;
  border: 2px solid transparent; outline: none; margin-bottom: 14px;
  transition: border-color 0.2s;
}
.nick-edit-input:focus { border-color: #2ecc71; }
</style>
