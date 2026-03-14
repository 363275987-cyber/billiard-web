// src/stores/billiard.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useBilliardStore = defineStore('billiard', () => {
  // 用户信息
  const userInfo = ref(JSON.parse(localStorage.getItem('bt_user') || 'null'))

  // 训练记录
  const records = ref(JSON.parse(localStorage.getItem('bt_records') || '[]'))

  // 训练计划（购物车）
  const cart = ref(JSON.parse(localStorage.getItem('bt_cart') || '[]'))

  // 计划模板
  const planTemplates = ref(JSON.parse(localStorage.getItem('bt_plans') || '[]'))

  // 学员列表
  const students = ref(JSON.parse(localStorage.getItem('bt_students') || '[]'))

  // 教练邀请码
  const coachCode = ref(localStorage.getItem('bt_coachCode') || '')

  // 当前正在训练的项目（计时用）
  const currentTraining = ref(JSON.parse(localStorage.getItem('bt_current_training') || 'null'))

  // 训练中实时击球计数
  const liveShots = ref([])

  // 教练作业
  const homework = ref(JSON.parse(localStorage.getItem('bt_homework') || '[]'))

  // ===== 项目广场 =====
  // 广场项目（预设 + 用户发布的）
  const squareProjects = ref(JSON.parse(localStorage.getItem('bt_square') || 'null') || getDefaultSquareProjects())

  // 用户收藏的项目 ID 列表
  const myFavProjects = ref(JSON.parse(localStorage.getItem('bt_fav_projects') || '[]'))

  // 用户自己发布的项目 ID 列表
  const myPublishedProjects = computed(() => squareProjects.value.filter(p => p.publisherId === userInfo.value?.id).map(p => p.id))

  // 用户的项目列表（收藏的 + 自己发布的）
  const myProjectList = computed(() => {
    const favIds = new Set(myFavProjects.value)
    return squareProjects.value.filter(p => favIds.has(p.id) || p.publisherId === userInfo.value?.id)
  })

  function getDefaultSquareProjects() {
    return [
      { id: 'sq_001', name: '中袋直线球', desc: '最基础的中袋练习，保持出杆稳定性。每次练习50杆以上，目标命中率70%。', category: 'basic', publisher: '台球达人张教练', publisherId: 'system', likes: 328, favs: 156, participants: 1243, videoUrl: '', createdAt: '2026-01-15' },
      { id: 'sq_002', name: '五分点中袋', desc: '从五分点位置练习中袋进球，锻炼角度控制能力。', category: 'basic', publisher: '李教练', publisherId: 'system', likes: 256, favs: 98, participants: 876, videoUrl: '', createdAt: '2026-01-20' },
      { id: 'sq_003', name: '远台薄切', desc: '远距离薄切球练习，考验出杆精准度和力度控制。建议从简单角度开始。', category: 'medium', publisher: '王教练', publisherId: 'system', likes: 189, favs: 87, participants: 654, videoUrl: '', createdAt: '2026-02-01' },
      { id: 'sq_004', name: 'K球分离练习', desc: '练习K球后的母球走位，提高连续得分能力。', category: 'medium', publisher: '陈教练', publisherId: 'system', likes: 145, favs: 72, participants: 432, videoUrl: '', createdAt: '2026-02-05' },
      { id: 'sq_005', name: '安全球防守', desc: '练习将母球送到安全位置，不给对手留下进球机会。', category: 'medium', publisher: '刘教练', publisherId: 'system', likes: 134, favs: 65, participants: 398, videoUrl: '', createdAt: '2026-02-10' },
      { id: 'sq_006', name: '连续围球', desc: '斯诺克连续得分围球练习，从红黑开始尽量连续得分。', category: 'advanced', publisher: '台球达人张教练', publisherId: 'system', likes: 267, favs: 142, participants: 567, videoUrl: '', createdAt: '2026-02-15' },
      { id: 'sq_007', name: '九球走位', desc: '九球专项走位训练，练习母球绕台走位，提高连续清台能力。', category: 'advanced', publisher: '赵教练', publisherId: 'system', likes: 198, favs: 89, participants: 445, videoUrl: '', createdAt: '2026-02-20' },
      { id: 'sq_008', name: '高低杆进阶', desc: '高低杆精确控制练习，包括跟进球、拉回球、定球等高级杆法。', category: 'advanced', publisher: '孙教练', publisherId: 'system', likes: 176, favs: 93, participants: 523, videoUrl: '', createdAt: '2026-02-25' },
    ]
  }

  // ===== 推荐训练方案 =====
  const recommendedPlans = [
    {
      id: 'rec_beginner',
      name: '🎯 新手入门',
      desc: '适合刚开始学台球的朋友，从中袋基础练起',
      items: [
        { projectId: 'sq_001', duration: 30, targetRate: 50 },
        { projectId: 'sq_002', duration: 20, targetRate: 40 },
        { projectId: 'sq_005', duration: 15, targetRate: 30 }
      ]
    },
    {
      id: 'rec_improve',
      name: '💪 进阶提升',
      desc: '有基础，想稳步提高中远台能力',
      items: [
        { projectId: 'sq_003', duration: 30, targetRate: 50 },
        { projectId: 'sq_004', duration: 20, targetRate: 40 },
        { projectId: 'sq_005', duration: 20, targetRate: 40 }
      ]
    },
    {
      id: 'rec_advanced',
      name: '🔥 高手突破',
      desc: '追求更高水平，挑战连续得分',
      items: [
        { projectId: 'sq_006', duration: 30, targetRate: 60 },
        { projectId: 'sq_007', duration: 30, targetRate: 60 },
        { projectId: 'sq_008', duration: 20, targetRate: 50 }
      ]
    }
  ]

  // 训练计划历史（像外卖订单记录）
  const planHistory = ref(JSON.parse(localStorage.getItem('bt_plan_history') || '[]'))

  // ===== 计算属性 =====
  const isLoggedIn = computed(() => !!userInfo.value)
  const isCoach = computed(() => userInfo.value?.role === 'coach')

  const todayRecords = computed(() => {
    const today = getToday()
    return records.value.filter(r => r.date === today)
  })

  const starredRecords = computed(() => records.value.filter(r => r.starred).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))

  // 我收藏的项目列表
  const myFavList = computed(() => {
    const favIds = new Set(myFavProjects.value)
    return squareProjects.value.filter(p => favIds.has(p.id))
  })

  // 我发布的项目列表
  const myPublishedList = computed(() => {
    return squareProjects.value.filter(p => p.publisherId === userInfo.value?.id)
  })

  const todaySummary = computed(() => {
    const today = getToday()
    const todayRecs = records.value.filter(r => r.date === today)
    let duration = 0, totalShots = 0, hits = 0
    const items = new Set()
    todayRecs.forEach(r => {
      duration += r.duration || 0
      totalShots += r.totalShots || 0
      hits += r.hits || 0
      if (r.project) items.add(r.project)
    })
    return {
      duration,
      hitRate: totalShots > 0 ? Math.round(hits / totalShots * 100) : 0,
      items: items.size,
      count: todayRecs.length
    }
  })

  const weekStreak = computed(() => {
    const dates = [...new Set(records.value.map(r => r.date))].sort().reverse()
    if (!dates.length) return 0
    const today = getToday()
    const yesterday = getPrevDay(today)
    if (dates[0] !== today && dates[0] !== yesterday) return 0
    let streak = 0
    let checkDate = dates[0] === today ? today : yesterday
    for (const d of dates) {
      if (d === checkDate) { streak++; checkDate = getPrevDay(checkDate) }
      else break
    }
    return streak
  })

  // ===== 方法 =====
  function getToday() {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }

  function getPrevDay(dateStr) {
    const d = new Date(dateStr)
    d.setDate(d.getDate() - 1)
    return formatDate(d)
  }

  function formatDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }

  function saveLocal() {
    localStorage.setItem('bt_current_user', JSON.stringify(userInfo.value?.phone || null))
    localStorage.setItem('bt_user', JSON.stringify(userInfo.value))
    localStorage.setItem('bt_records', JSON.stringify(records.value))
    localStorage.setItem('bt_cart', JSON.stringify(cart.value))
    localStorage.setItem('bt_plans', JSON.stringify(planTemplates.value))
    localStorage.setItem('bt_students', JSON.stringify(students.value))
    if (coachCode.value) localStorage.setItem('bt_coachCode', coachCode.value)
    localStorage.setItem('bt_square', JSON.stringify(squareProjects.value))
    localStorage.setItem('bt_fav_projects', JSON.stringify(myFavProjects.value))
  }

  // ===== 用户系统（手机号+密码） =====
  function getAllUsers() {
    return JSON.parse(localStorage.getItem('bt_users') || '{}')
  }
  function saveAllUsers(users) {
    localStorage.setItem('bt_users', JSON.stringify(users))
  }
  function simpleHash(str) {
    let h = 0
    for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0 }
    return Math.abs(h).toString(36)
  }

  function register(phone, password) {
    const users = getAllUsers()
    if (users[phone]) return { ok: false, msg: '该手机号已注册' }
    const id = 'u_' + simpleHash(phone)
    users[phone] = { id, phone, passwordHash: simpleHash(password), nickName: '', avatar: '', role: 'student', createdAt: new Date().toISOString() }
    saveAllUsers(users)
    return { ok: true }
  }

  function login(phone, password) {
    const users = getAllUsers()
    const user = users[phone]
    if (!user) return { ok: false, msg: '该手机号未注册' }
    if (user.passwordHash !== simpleHash(password)) return { ok: false, msg: '密码错误' }
    userInfo.value = user
    saveLocal()
    return { ok: true }
  }

  function setUserInfo(info) {
    const merged = { ...userInfo.value, ...info }
    userInfo.value = merged
    // 同步到用户表
    const users = getAllUsers()
    if (merged.phone && users[merged.phone]) {
      users[merged.phone] = { ...users[merged.phone], ...info }
      saveAllUsers(users)
    }
    saveLocal()
  }

  function logout() {
    userInfo.value = null
    saveLocal()
  }

  // 训练记录
  function addRecord(record) {
    records.value.push(record)
    saveLocal()
  }

  function deleteRecord(id) {
    records.value = records.value.filter(r => r.id !== id)
    saveLocal()
  }

  function toggleStar(id) {
    const r = records.value.find(r => r.id === id)
    if (r) { r.starred = !r.starred; saveLocal() }
    return r?.starred
  }

  function getRecord(id) {
    return records.value.find(r => r.id === id)
  }

  // 购物车
  function addToCart(item) {
    cart.value.push(item)
    saveLocal()
  }

  function updateCart(index, data) {
    Object.assign(cart.value[index], data)
    saveLocal()
  }

  function removeFromCart(index) {
    cart.value.splice(index, 1)
    saveLocal()
  }

  function clearCart() {
    cart.value = []
    saveLocal()
  }

  // 计划模板
  function savePlan(plan) {
    planTemplates.value.unshift(plan)
    if (planTemplates.value.length > 20) planTemplates.value.length = 20
    saveLocal()
  }

  // 学员
  function addStudent(student) {
    students.value.push(student)
    saveLocal()
  }

  // 教练码
  function getOrGenCoachCode() {
    if (!coachCode.value) {
      coachCode.value = 'COACH_' + Math.random().toString(36).substr(2, 8).toUpperCase()
      saveLocal()
    }
    return coachCode.value
  }

  // 统计
  function getStats(period) {
    const now = new Date()
    let filtered = records.value
    if (period === 'week') {
      const ago = new Date(now.getTime() - 7 * 86400000)
      filtered = records.value.filter(r => r.date >= formatDate(ago))
    } else if (period === 'month') {
      const m = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`
      filtered = records.value.filter(r => r.date >= m)
    }

    let totalDuration = 0, totalShotsAll = 0, totalHitsAll = 0
    filtered.forEach(r => { totalDuration += r.duration || 0; totalShotsAll += r.totalShots || 0; totalHitsAll += r.hits || 0 })

    const projectMap = {}
    filtered.forEach(r => {
      if (!projectMap[r.project]) projectMap[r.project] = { name: r.project, count: 0, totalShots: 0, totalHits: 0, totalDuration: 0 }
      projectMap[r.project].count++
      projectMap[r.project].totalShots += r.totalShots || 0
      projectMap[r.project].totalHits += r.hits || 0
      projectMap[r.project].totalDuration += r.duration || 0
    })

    const projectStats = Object.values(projectMap).map(p => ({
      ...p,
      avgRate: p.totalShots > 0 ? Math.round(p.totalHits / p.totalShots * 100) : 0
    })).sort((a, b) => b.count - a.count)

    const dateMap = {}
    filtered.forEach(r => {
      if (!dateMap[r.date]) dateMap[r.date] = { duration: 0, totalShots: 0, totalHits: 0, count: 0 }
      dateMap[r.date].duration += r.duration
      dateMap[r.date].totalShots += r.totalShots || 0
      dateMap[r.date].totalHits += r.hits || 0
      dateMap[r.date].count++
    })
    const dates = Object.keys(dateMap).sort()
    const hitRates = dates.map(d => dateMap[d].totalShots > 0 ? Math.round(dateMap[d].totalHits / dateMap[d].totalShots * 100) : 0)

    return {
      totalSessions: filtered.length,
      totalDuration,
      avgHitRate: totalShotsAll > 0 ? Math.round(totalHitsAll / totalShotsAll * 100) : 0,
      projectStats,
      dates,
      hitRates,
      maxRate: Math.max(...hitRates, 1)
    }
  }

  // Check if a project is in today's plan (cart)
  function isInCart(projectId) {
    return cart.value.some(item => item.projectId === projectId)
  }

  // Remove from cart by projectId
  function removeFromCartByProjectId(projectId) {
    const idx = cart.value.findIndex(item => item.projectId === projectId)
    if (idx >= 0) { cart.value.splice(idx, 1); saveLocal() }
  }

  // ===== 训练计时 =====
  function startTraining(projectId) {
    currentTraining.value = { projectId, startTime: Date.now(), pausedAt: null, pausedDuration: 0 }
    liveShots.value = []
    localStorage.setItem('bt_current_training', JSON.stringify(currentTraining.value))
  }

  function endTraining() {
    if (!currentTraining.value) return null
    const elapsed = Math.max(1, Math.round((Date.now() - currentTraining.value.startTime - (currentTraining.value.pausedDuration || 0)) / 60000))
    const projectId = currentTraining.value.projectId
    const stats = getLiveStats()
    currentTraining.value = null
    localStorage.removeItem('bt_current_training')
    return { elapsed, projectId, shots: stats.total, hits: stats.hits, hitRate: stats.hitRate }
  }

  function cancelTraining() {
    currentTraining.value = null
    localStorage.removeItem('bt_current_training')
  }

  function pauseTraining() {
    if (!currentTraining.value || currentTraining.value.pausedAt) return
    currentTraining.value.pausedAt = Date.now()
    localStorage.setItem('bt_current_training', JSON.stringify(currentTraining.value))
  }

  function resumeTraining() {
    if (!currentTraining.value || !currentTraining.value.pausedAt) return
    const pausedMs = Date.now() - currentTraining.value.pausedAt
    currentTraining.value.pausedDuration = (currentTraining.value.pausedDuration || 0) + pausedMs
    currentTraining.value.pausedAt = null
    localStorage.setItem('bt_current_training', JSON.stringify(currentTraining.value))
  }

  function isTrainingPaused() {
    return !!currentTraining.value?.pausedAt
  }

  function getElapsedSeconds() {
    if (!currentTraining.value) return 0
    const base = Date.now() - currentTraining.value.startTime - (currentTraining.value.pausedDuration || 0)
    if (currentTraining.value.pausedAt) {
      return Math.floor((currentTraining.value.pausedAt - currentTraining.value.startTime - (currentTraining.value.pausedDuration || 0)) / 1000)
    }
    return Math.floor(base / 1000)
  }

  // ===== 训练计划历史 =====
  function savePlanToHistory() {
    const items = cart.value.filter(item => item.projectId)
    if (items.length === 0) return
    // 避免重复保存相同计划
    const plan = {
      id: Date.now().toString(),
      items: items.map(item => ({ ...item })),
      savedAt: new Date().toISOString(),
      date: getToday()
    }
    planHistory.value.unshift(plan)
    if (planHistory.value.length > 30) planHistory.value.length = 30
    localStorage.setItem('bt_plan_history', JSON.stringify(planHistory.value))
  }

  function restorePlanFromHistory(historyId) {
    const plan = planHistory.value.find(p => p.id === historyId)
    if (!plan) return
    // 清空当前计划，恢复历史计划
    cart.value = plan.items.map(item => ({ ...item }))
    saveLocal()
  }

  function deletePlanHistory(historyId) {
    planHistory.value = planHistory.value.filter(p => p.id !== historyId)
    localStorage.setItem('bt_plan_history', JSON.stringify(planHistory.value))
  }

  // Get daily metrics for stats page
  function getDailyMetrics(date) {
    const dayRecords = records.value.filter(r => r.date === date)
    const todayCart = cart.value.filter(item => item.projectId)

    // Plan completion
    const completedIds = new Set()
    dayRecords.forEach(r => {
      if (r.projectId) completedIds.add(r.projectId)
    })
    const planTotal = todayCart.length
    const planDone = todayCart.filter(item => completedIds.has(item.projectId)).length
    const planCompletion = planTotal > 0 ? Math.round(planDone / planTotal * 100) : null

    // Duration
    const totalDuration = dayRecords.reduce((sum, r) => sum + (r.duration || 0), 0)

    // Training item count
    const projectSet = new Set(dayRecords.map(r => r.project))

    // Hit rate
    const totalShots = dayRecords.reduce((sum, r) => sum + (r.totalShots || 0), 0)
    const totalHits = dayRecords.reduce((sum, r) => sum + (r.hits || 0), 0)
    const hitRate = totalShots > 0 ? Math.round(totalHits / totalShots * 100) : 0

    // Yesterday comparison
    const yesterday = getPrevDay(date)
    const yesterdayRecords = records.value.filter(r => r.date === yesterday)
    const ydDuration = yesterdayRecords.reduce((sum, r) => sum + (r.duration || 0), 0)
    const ydProjectSet = new Set(yesterdayRecords.map(r => r.project))
    const ydShots = yesterdayRecords.reduce((sum, r) => sum + (r.totalShots || 0), 0)
    const ydHits = yesterdayRecords.reduce((sum, r) => sum + (r.hits || 0), 0)
    const ydRate = ydShots > 0 ? Math.round(ydHits / ydShots * 100) : 0

    return {
      planCompletion,
      duration: totalDuration,
      durationDiff: totalDuration - ydDuration,
      projectCount: projectSet.size,
      projectDiff: projectSet.size - ydProjectSet.size,
      hitRate,
      hitRateDiff: hitRate - ydRate,
      totalSessions: dayRecords.length
    }
  }

  // ===== 实时击球计数 =====
  function recordShot(hit) {
    liveShots.value.push({ hit, time: Date.now() })
  }

  function recordBatchShots(hit, count) {
    const now = Date.now()
    for (let i = 0; i < count; i++) {
      liveShots.value.push({ hit, time: now + i })
    }
  }

  function undoShot() {
    if (liveShots.value.length > 0) liveShots.value.pop()
  }

  function getLiveStats() {
    const total = liveShots.value.length
    const hits = liveShots.value.filter(s => s.hit).length
    return { total, hits, hitRate: total > 0 ? Math.round(hits / total * 100) : 0 }
  }

  function clearLiveShots() {
    liveShots.value = []
  }

  // ===== 推荐方案一键加载 =====
  function loadRecommendedPlan(planId) {
    const plan = recommendedPlans.find(p => p.id === planId)
    if (!plan) return
    cart.value = []
    plan.items.forEach(item => {
      const project = squareProjects.value.find(p => p.id === item.projectId)
      if (project) {
        cart.value.push({
          projectId: project.id,
          name: project.name,
          category: project.category,
          duration: item.duration,
          targetRate: item.targetRate
        })
      }
    })
    plan.items.forEach(item => {
      if (!myFavProjects.value.includes(item.projectId)) {
        myFavProjects.value.push(item.projectId)
      }
    })
    saveLocal()
  }

  // ===== 教练作业系统 =====
  function assignHomework(studentId, items, note) {
    homework.value.unshift({
      id: Date.now().toString(),
      coachId: userInfo.value?.id,
      studentId,
      items: items.map(item => ({ ...item })),
      note: note || '',
      createdAt: new Date().toISOString(),
      completed: false,
      completedAt: null
    })
    localStorage.setItem('bt_homework', JSON.stringify(homework.value))
  }

  function getStudentHomework() {
    if (!userInfo.value) return []
    return homework.value.filter(h => h.studentId === userInfo.value.id && !h.completed)
  }

  function getCoachHomework() {
    if (!userInfo.value) return []
    return homework.value.filter(h => h.coachId === userInfo.value.id)
  }

  function completeHomework(homeworkId) {
    const h = homework.value.find(h => h.id === homeworkId)
    if (h) {
      h.completed = true
      h.completedAt = new Date().toISOString()
      localStorage.setItem('bt_homework', JSON.stringify(homework.value))
    }
  }

  function deleteHomework(homeworkId) {
    homework.value = homework.value.filter(h => h.id !== homeworkId)
    localStorage.setItem('bt_homework', JSON.stringify(homework.value))
  }

  // 获取学员信息
  function getStudentById(studentId) {
    return students.value.find(s => s.id === studentId)
  }

  return {
    userInfo, records, cart, planTemplates, students, coachCode,
    squareProjects, myFavProjects, myPublishedProjects, myProjectList,
    planHistory, currentTraining, liveShots, homework, recommendedPlans,
    isLoggedIn, isCoach, todayRecords, todaySummary, weekStreak,
    starredRecords, myFavList, myPublishedList,
    setUserInfo, logout, register, login, addRecord, deleteRecord, toggleStar, getRecord,
    addToCart, updateCart, removeFromCart, clearCart,
    isInCart, removeFromCartByProjectId,
    startTraining, endTraining, cancelTraining, pauseTraining, resumeTraining, isTrainingPaused, getElapsedSeconds,
    recordShot, recordBatchShots, undoShot, getLiveStats, clearLiveShots,
    loadRecommendedPlan,
    assignHomework, getStudentHomework, getCoachHomework, completeHomework, deleteHomework, getStudentById,
    savePlanToHistory, restorePlanFromHistory, deletePlanHistory,
    savePlan, addStudent, getOrGenCoachCode,
    getStats, getDailyMetrics, getToday, formatDate,
    // 项目广场方法
    toggleFavProject(id) {
      const idx = myFavProjects.value.indexOf(id)
      if (idx >= 0) { myFavProjects.value.splice(idx, 1) }
      else { myFavProjects.value.push(id) }
      saveLocal()
      return myFavProjects.value.includes(id)
    },
    isProjectFaved(id) {
      return myFavProjects.value.includes(id)
    },
    likeProject(id) {
      const p = squareProjects.value.find(p => p.id === id)
      if (p) { p.likes++; saveLocal() }
    },
    publishProject(project) {
      squareProjects.value.unshift(project)
      saveLocal()
    },
    getSquareProject(id) {
      return squareProjects.value.find(p => p.id === id)
    }
  }
})
