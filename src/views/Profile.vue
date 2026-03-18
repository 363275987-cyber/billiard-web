<!-- src/views/Profile.vue - 手机号+密码登录 / 注册 -->
<template>
  <div class="page">
    <!-- ========== 未登录 ========== -->
    <div v-if="!store.isLoggedIn">
      <!-- 头部 -->
      <div class="hero">
        <span class="hero-icon">🎱</span>
        <h1 class="hero-title">台球训练记录</h1>
        <p class="hero-desc">记录每一次出杆，见证进步</p>
      </div>

      <!-- Tab 切换 -->
      <div
        class="tab-switch"
        style="margin: -15px 12px 0; position: relative; z-index: 1"
      >
        <button
          class="tab-btn"
          :class="{ active: authTab === 'login' }"
          @click="authTab = 'login'"
        >
          登录
        </button>
        <button
          class="tab-btn"
          :class="{ active: authTab === 'register' }"
          @click="authTab = 'register'"
        >
          注册
        </button>
      </div>

      <!-- ===== 登录 ===== -->
      <div class="card" v-if="authTab === 'login'">
        <div class="input-group">
          <span class="input-icon">📱</span>
          <input
            class="field"
            v-model="loginPhone"
            type="tel"
            maxlength="11"
            placeholder="手机号"
            @input="loginPhone = loginPhone.replace(/\D/g, '')"
          />
        </div>
        <div class="input-group">
          <span class="input-icon">🔒</span>
          <input
            class="field"
            v-model="loginPwd"
            type="password"
            placeholder="密码"
            maxlength="32"
          />
        </div>
        <button
          class="btn-primary"
          :disabled="loginLoading"
          @click="handleLogin"
        >
          <span v-if="loginLoading" class="btn-loading"
            ><span class="dot"></span><span class="dot"></span
            ><span class="dot"></span
          ></span>
          <span v-else>登 录</span>
        </button>
      </div>

      <!-- ===== 注册 ===== -->
      <div class="card" v-if="authTab === 'register'">
        <!-- Step 1: 手机号+密码 -->
        <template v-if="regStep === 1">
          <div class="input-group">
            <span class="input-icon">📱</span>
            <input
              class="field"
              v-model="regPhone"
              type="tel"
              maxlength="11"
              placeholder="手机号"
              @input="regPhone = regPhone.replace(/\D/g, '')"
            />
          </div>
          <div class="input-group">
            <span class="input-icon">🔒</span>
            <input
              class="field"
              v-model="regPwd"
              type="password"
              placeholder="设置密码（6位以上）"
              maxlength="32"
            />
          </div>
          <div class="input-group">
            <span class="input-icon">🔒</span>
            <input
              class="field"
              v-model="regPwd2"
              type="password"
              placeholder="确认密码"
              maxlength="32"
            />
          </div>
          <button
            class="btn-primary"
            :disabled="regLoading"
            @click="handleRegister"
          >
            <span v-if="regLoading" class="btn-loading"
              ><span class="dot"></span><span class="dot"></span
              ><span class="dot"></span
            ></span>
            <span v-else>下一步</span>
          </button>
        </template>

        <!-- Step 2: 基本信息 -->
        <template v-if="regStep === 2">
          <!-- 头像选择 -->
          <div class="section-label">选择头像</div>
          <div class="avatar-grid">
            <div
              class="avatar-option"
              v-for="(av, i) in systemAvatars"
              :key="i"
              :class="{ active: regAvatar === av }"
              @click="
                regAvatar = av
                customAvatarUrl = ''
              "
            >
              <span class="avatar-emoji">{{ av }}</span>
            </div>
            <div
              class="avatar-option"
              :class="{ active: !!customAvatarUrl }"
              @click="pickCustomAvatar"
            >
              <span class="avatar-emoji" v-if="!customAvatarUrl">📷</span>
              <img v-else :src="customAvatarUrl" class="avatar-custom-thumb" />
            </div>
            <input
              type="file"
              ref="avatarInput"
              accept="image/*"
              @change="onAvatarFile"
              style="display: none"
            />
          </div>

          <!-- 昵称 -->
          <div class="section-label" style="margin-top: 16px">昵称</div>
          <input
            class="field nick-field"
            v-model="regNickName"
            placeholder="起个名字吧"
            maxlength="12"
          />

          <!-- 身份 -->
          <div class="section-label" style="margin-top: 16px">我是</div>
          <div class="role-row">
            <div
              class="role-btn"
              :class="{ active: regRole === 'student' }"
              @click="regRole = 'student'"
            >
              <span>👨🎓</span><span>学员</span>
            </div>
            <div
              class="role-btn"
              :class="{ active: regRole === 'coach' }"
              @click="regRole = 'coach'"
            >
              <span>🧑🏫</span><span>教练</span>
            </div>
          </div>

          <button
            class="btn-primary"
            style="margin-top: 20px"
            @click="handleCompleteReg"
          >
            完成注册 🎉
          </button>
        </template>
      </div>
    </div>

    <!-- ========== 已登录 ========== -->
    <div v-else>
      <div class="profile-hero">
        <div class="avatar-circle" :class="store.isCoach ? 'coach' : 'student'">
          <img
            v-if="isCustomAvatar"
            :src="store.userInfo.avatar"
            class="avatar-img"
          />
          <span v-else class="avatar-emoji-lg">{{
            store.userInfo.avatar || '🎱'
          }}</span>
        </div>
        <span class="profile-name">{{
          store.userInfo?.nickName || '台球爱好者'
        }}</span>
        <span class="phone-display">{{ maskedPhone }}</span>
        <span class="role-badge">{{
          store.isCoach ? '🧑🏫 教练' : '👨🎓 学员'
        }}</span>
      </div>

      <div class="data-card">
        <div class="data-item">
          <span class="data-num">{{ store.records.length }}</span>
          <span class="data-label">训练次数</span>
        </div>
        <div class="data-divider"></div>
        <div class="data-item">
          <span class="data-num">{{ totalDuration }}</span>
          <span class="data-label">总时长(分)</span>
        </div>
        <div class="data-divider"></div>
        <div class="data-item">
          <span class="data-num">{{ store.starredRecords.length }}</span>
          <span class="data-label">收藏</span>
        </div>
      </div>

      <div class="menu-list">
        <div class="menu-item" @click="openEditProfile">
          <span class="menu-icon">✏️</span
          ><span class="menu-text">编辑资料</span
          ><span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="$router.push('/square')">
          <span class="menu-icon">🏪</span
          ><span class="menu-text">项目广场</span
          ><span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="$router.push('/my-projects')">
          <span class="menu-icon">📚</span
          ><span class="menu-text"
            >我的项目 ({{ store.myProjectList.length }})</span
          ><span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="$router.push('/my-starred')">
          <span class="menu-icon">⭐</span
          ><span class="menu-text"
            >心得收藏 ({{ store.starredRecords.length }})</span
          ><span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" v-if="store.isCoach">
          <span class="menu-icon">👥</span
          ><span class="menu-text">我的学员</span
          ><span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" v-if="store.isCoach">
          <span class="menu-icon">📝</span
          ><span class="menu-text">布置作业</span
          ><span class="menu-arrow">›</span>
        </div>
        <div
          class="menu-item"
          v-if="store.isAdmin"
          @click="$router.push('/admin')"
        >
          <span class="menu-icon">📊</span
          ><span class="menu-text">管理后台</span
          ><span class="menu-arrow">›</span>
        </div>
        <div class="menu-item danger" @click="handleLogout">
          <span class="menu-icon">🚪</span
          ><span class="menu-text">退出登录</span
          ><span class="menu-arrow">›</span>
        </div>
      </div>

      <div class="footer">台球训练记录 v2.1</div>
    </div>

    <!-- ========== 编辑资料弹层 ========== -->
    <div class="modal-mask" v-if="showEdit" @click.self="showEdit = false">
      <div class="modal-sheet">
        <div class="modal-header">
          <span class="modal-title">编辑资料</span>
          <span class="modal-close" @click="showEdit = false">✕</span>
        </div>

        <div class="section-label">头像</div>
        <div class="avatar-grid">
          <div
            class="avatar-option"
            v-for="(av, i) in systemAvatars"
            :key="i"
            :class="{ active: editAvatar === av && !editCustomUrl }"
            @click="
              editAvatar = av
              editCustomUrl = ''
            "
          >
            <span class="avatar-emoji">{{ av }}</span>
          </div>
          <div
            class="avatar-option"
            :class="{ active: !!editCustomUrl }"
            @click="pickEditAvatar"
          >
            <img
              v-if="editCustomUrl"
              :src="editCustomUrl"
              class="avatar-custom-thumb"
            />
            <span class="avatar-emoji" v-else>📷</span>
          </div>
          <input
            type="file"
            ref="editAvatarInput"
            accept="image/*"
            @change="onEditAvatarFile"
            style="display: none"
          />
        </div>

        <div class="section-label" style="margin-top: 16px">昵称</div>
        <input
          class="field nick-field"
          v-model="editNick"
          placeholder="输入昵称"
          maxlength="12"
        />

        <button class="btn-primary" style="margin-top: 20px" @click="saveEdit">
          保存
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBilliardStore } from '../stores/billiard'
import { compressImage } from '../utils/mediaStore'

const store = useBilliardStore()
const router = useRouter()

// 系统头像
const systemAvatars = [
  '🎱',
  '🦁',
  '🐯',
  '🐉',
  '🦅',
  '🐊',
  '🦈',
  '🐵',
  '🐼',
  '🦊',
]

// ===== 登录 =====
const authTab = ref('login')
const loginPhone = ref('')
const loginPwd = ref('')

const loginLoading = ref(false)

async function handleLogin() {
  if (!/^1\d{10}$/.test(loginPhone.value)) {
    alert('请输入正确的11位手机号')
    return
  }
  if (!loginPwd.value) {
    alert('请输入密码')
    return
  }
  loginLoading.value = true
  const res = await store.login(loginPhone.value.trim(), loginPwd.value)
  loginLoading.value = false
  if (res.ok) {
    alert('登录成功 🎉')
    router.push('/')
  } else {
    alert(res.msg)
  }
}

// ===== 注册 =====
const regStep = ref(1)
const regPhone = ref('')
const regPwd = ref('')
const regPwd2 = ref('')
const regNickName = ref('')
const regAvatar = ref('🎱')
const regRole = ref('student')
const customAvatarUrl = ref('')
const avatarInput = ref(null)
const avatarBlobUrl = ref('') // cleanup

const regLoading = ref(false)

async function handleRegister() {
  if (!/^1\d{10}$/.test(regPhone.value)) {
    alert('请输入正确的11位手机号')
    return
  }
  if (regPwd.value.length < 6) {
    alert('密码至少6位')
    return
  }
  if (regPwd.value !== regPwd2.value) {
    alert('两次密码不一致')
    return
  }
  regLoading.value = true
  const res = await store.register(regPhone.value.trim(), regPwd.value)
  regLoading.value = false
  if (!res.ok) {
    alert(res.msg)
    return
  }
  // 注册成功，进入第二步
  regStep.value = 2
}

async function handleCompleteReg() {
  if (!regNickName.value.trim()) {
    alert('给自己起个名字吧')
    return
  }
  const avatar = customAvatarUrl.value || regAvatar.value
  await store.setUserInfo({
    phone: regPhone.value.trim(),
    nickName: regNickName.value.trim(),
    avatar,
    role: regRole.value,
  })
  cleanupBlobUrl()
  alert('注册成功，开始你的台球之旅 🎱')
  router.push('/')
}

function pickCustomAvatar() {
  avatarInput.value?.click()
}

async function onAvatarFile(e) {
  const file = (e.target.files || [])[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    alert('图片不能超过5MB')
    e.target.value = ''
    return
  }
  cleanupBlobUrl()
  const compressed = await compressImage(file, 256)
  const url = URL.createObjectURL(compressed)
  avatarBlobUrl.value = url
  // 转 base64 存储（小头像没问题）
  const reader = new FileReader()
  reader.onload = () => {
    customAvatarUrl.value = reader.result
  }
  reader.readAsDataURL(compressed)
  e.target.value = ''
}

function cleanupBlobUrl() {
  if (avatarBlobUrl.value) {
    URL.revokeObjectURL(avatarBlobUrl.value)
    avatarBlobUrl.value = ''
  }
}

// ===== 编辑资料 =====
const showEdit = ref(false)
const editAvatar = ref('')
const editNick = ref('')
const editCustomUrl = ref('')
const editAvatarInput = ref(null)
const editBlobUrl = ref('')

const isCustomAvatar = computed(() => {
  const av = store.userInfo?.avatar || ''
  return (
    av.startsWith('data:') || av.startsWith('blob:') || av.startsWith('http')
  )
})

function openEditProfile() {
  editAvatar.value = store.userInfo.avatar || '🎱'
  editNick.value = store.userInfo.nickName || ''
  editCustomUrl.value = isCustomAvatar.value ? store.userInfo.avatar : ''
  if (!isCustomAvatar.value) editAvatar.value = store.userInfo.avatar || '🎱'
  showEdit.value = true
}

function pickEditAvatar() {
  editAvatarInput.value?.click()
}

async function onEditAvatarFile(e) {
  const file = (e.target.files || [])[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    alert('图片不能超过5MB')
    e.target.value = ''
    return
  }
  if (editBlobUrl.value) URL.revokeObjectURL(editBlobUrl.value)
  const compressed = await compressImage(file, 256)
  const url = URL.createObjectURL(compressed)
  editBlobUrl.value = url
  const reader = new FileReader()
  reader.onload = () => {
    editCustomUrl.value = reader.result
    editAvatar.value = ''
  }
  reader.readAsDataURL(compressed)
  e.target.value = ''
}

async function saveEdit() {
  if (!editNick.value.trim()) {
    alert('昵称不能为空')
    return
  }
  await store.setUserInfo({
    nickName: editNick.value.trim(),
    avatar: editCustomUrl.value || editAvatar.value,
  })
  showEdit.value = false
}

// ===== 通用 =====
const maskedPhone = computed(() => {
  const p = store.userInfo?.phone
  return p && p.length >= 11 ? p.slice(0, 3) + '****' + p.slice(7) : ''
})

const totalDuration = computed(() =>
  store.records.reduce((s, r) => s + (r.duration || 0), 0)
)

async function handleLogout() {
  if (confirm('确定要退出登录吗？')) await store.logout()
}

onUnmounted(() => {
  cleanupBlobUrl()
  if (editBlobUrl.value) URL.revokeObjectURL(editBlobUrl.value)
})
</script>

<style scoped>
/* Hero */
.hero {
  background: linear-gradient(160deg, #2ecc71, #27ae60, #1abc9c);
  padding: 40px 24px 50px;
  text-align: center;
}
.hero-icon {
  display: block;
  font-size: 40px;
  margin-bottom: 12px;
}
.hero-title {
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 2px;
  margin-bottom: 8px;
}
.hero-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.75);
}

/* Tab 切换 */
.tab-switch {
  display: flex;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.tab-btn {
  flex: 1;
  padding: 14px 0;
  border: none;
  font-size: 15px;
  font-weight: 600;
  color: #999;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
}
.tab-btn.active {
  color: #2ecc71;
  background: rgba(46, 204, 113, 0.06);
}

/* 卡片 */
.card {
  padding: 20px;
  margin: 12px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* 输入框 */
.input-group {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border-radius: 10px;
  padding: 0 14px;
  margin-bottom: 12px;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}
.input-group:focus-within {
  border-color: #2ecc71;
}
.input-icon {
  font-size: 18px;
  margin-right: 10px;
  flex-shrink: 0;
}
.field {
  flex: 1;
  font-size: 15px;
  padding: 14px 0;
  background: transparent;
  border: none;
  outline: none;
  color: #1a1a2e;
}
.field::placeholder {
  color: #ccc;
}
.nick-field {
  width: 100%;
  font-size: 15px;
  padding: 14px;
  background: #f8f9fa;
  border-radius: 10px;
  border: 2px solid transparent;
  outline: none;
  color: #1a1a2e;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.nick-field:focus {
  border-color: #2ecc71;
}

/* 按钮 */
.btn-primary {
  width: 100%;
  padding: 14px 0;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
  box-shadow: 0 4px 16px rgba(46, 204, 113, 0.3);
}
.btn-primary:active {
  opacity: 0.85;
}
.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.btn-loading {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  height: 16px;
}
.btn-loading .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
  animation: bounce 1.2s infinite;
}
.btn-loading .dot:nth-child(2) {
  animation-delay: 0.15s;
}
.btn-loading .dot:nth-child(3) {
  animation-delay: 0.3s;
}
@keyframes bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-8px);
  }
}

/* 头像选择 */
.section-label {
  font-size: 13px;
  color: #999;
  font-weight: 600;
  margin-bottom: 8px;
}
.avatar-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.avatar-option {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
  background: #fff;
}
.avatar-option.active {
  border-color: #2ecc71;
  background: rgba(46, 204, 113, 0.06);
  box-shadow: 0 2px 8px rgba(46, 204, 113, 0.2);
}
.avatar-emoji {
  font-size: 28px;
  line-height: 1;
}
.avatar-custom-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 角色 */
.role-row {
  display: flex;
  gap: 12px;
}
.role-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border-radius: 10px;
  border: 2px solid #f0f0f0;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  color: #666;
  transition: all 0.2s;
}
.role-btn.active {
  border-color: #2ecc71;
  background: rgba(46, 204, 113, 0.06);
  color: #2ecc71;
}

/* ===== 已登录 ===== */
.profile-hero {
  background: linear-gradient(160deg, #2ecc71, #27ae60, #1abc9c);
  padding: 40px 24px 30px;
  text-align: center;
}
.avatar-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  overflow: hidden;
}
.avatar-circle.coach {
  background: rgba(52, 152, 219, 0.3);
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-emoji-lg {
  font-size: 36px;
}
.profile-name {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
}
.phone-display {
  display: block;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}
.role-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
}

.data-card {
  display: flex;
  background: #fff;
  border-radius: 12px;
  padding: 20px 18px;
  margin: -15px 12px 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 1;
}
.data-item {
  flex: 1;
  text-align: center;
}
.data-num {
  display: block;
  font-size: 24px;
  font-weight: 800;
  color: #2ecc71;
}
.data-label {
  display: block;
  font-size: 12px;
  color: #b0b0b0;
  margin-top: 4px;
}
.data-divider {
  width: 1px;
  height: 30px;
  background: #f0f0f0;
}

.menu-list {
  margin: 0 12px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}
.menu-item {
  display: flex;
  align-items: center;
  padding: 16px 18px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}
.menu-item:last-child {
  border-bottom: none;
}
.menu-item:active {
  background: #fafafa;
}
.menu-icon {
  font-size: 18px;
  margin-right: 10px;
}
.menu-text {
  flex: 1;
  font-size: 15px;
  color: #333;
}
.menu-item.danger .menu-text {
  color: #e74c3c;
}
.menu-arrow {
  font-size: 18px;
  color: #ddd;
}
.footer {
  text-align: center;
  padding: 24px 0 16px;
  font-size: 12px;
  color: #ccc;
}

/* 编辑弹层 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.modal-sheet {
  width: 100%;
  max-width: 480px;
  background: #fff;
  border-radius: 16px 16px 0 0;
  padding: 20px;
  max-height: 80vh;
  overflow-y: auto;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.modal-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a2e;
}
.modal-close {
  font-size: 20px;
  color: #b0b0b0;
  cursor: pointer;
  padding: 4px;
}
</style>
