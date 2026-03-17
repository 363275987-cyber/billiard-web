// src/stores/billiard.js - Supabase 版
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

export const useBilliardStore = defineStore('billiard', () => {
  // ===== 状态 =====
  const userInfo = ref(null)
  const records = ref([])
  const squareProjects = ref([])
  const myFavProjectIds = ref([])
  const myLikedProjectIds = ref([])
  const planHistory = ref([])
  const homework = ref([])
  const students = ref([])
  const initialized = ref(false)
  const loading = ref(false)

  // 短期状态（留在 localStorage / 内存）
  const cart = ref(JSON.parse(localStorage.getItem('bt_cart') || '[]'))
  const currentTraining = ref(JSON.parse(localStorage.getItem('bt_current_training') || 'null'))
  const liveShots = ref([])

  // ===== 计算属性 =====
  const isLoggedIn = computed(() => !!userInfo.value)
  const isAdmin = computed(() => ['admin','coach'].includes(userInfo.value?.role))
  const isCoach = computed(() => userInfo.value?.role === 'coach')

  const myPublishedProjects = computed(() =>
    squareProjects.value.filter(p => p.publisherId === userInfo.value?.id).map(p => p.id)
  )

  const myProjectList = computed(() => {
    const favIds = new Set(myFavProjectIds.value)
    return squareProjects.value.filter(p => favIds.has(p.id) || p.publisherId === userInfo.value?.id)
  })

  const todayRecords = computed(() => {
    const today = getToday()
    return records.value.filter(r => r.date === today)
  })

  const starredRecords = computed(() =>
    records.value.filter(r => r.starred).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  )

  const myFavList = computed(() => {
    const favIds = new Set(myFavProjectIds.value)
    return squareProjects.value.filter(p => favIds.has(p.id))
  })

  const myPublishedList = computed(() =>
    squareProjects.value.filter(p => p.publisherId === userInfo.value?.id)
  )

  const todaySummary = computed(() => {
    const today = getToday()
    const todayRecs = records.value.filter(r => r.date === today)
    let duration = 0, totalShots = 0, hits = 0
    const items = new Set()
    todayRecs.forEach(r => {
      duration += r.duration || 0
      totalShots += r.totalShots || 0
      hits += r.hits || 0
      if (r.projectName) items.add(r.projectName)
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

  // 推荐方案（动态匹配项目 ID）
  const recommendedPlans = computed(() => {
    const find = (name) => squareProjects.value.find(p => p.name === name)?.id
    return [
      {
        id: 'rec_beginner', name: '🎯 新手入门',
        desc: '适合刚开始学台球的朋友，从中袋基础练起',
        items: [
          { projectId: find('中袋直线球'), duration: 30, targetRate: 50 },
          { projectId: find('五分点中袋'), duration: 20, targetRate: 40 },
          { projectId: find('安全球防守'), duration: 15, targetRate: 30 }
        ].filter(i => i.projectId)
      },
      {
        id: 'rec_improve', name: '💪 进阶提升',
        desc: '有基础，想稳步提高中远台能力',
        items: [
          { projectId: find('远台薄切'), duration: 30, targetRate: 50 },
          { projectId: find('K球分离练习'), duration: 20, targetRate: 40 },
          { projectId: find('安全球防守'), duration: 20, targetRate: 40 }
        ].filter(i => i.projectId)
      },
      {
        id: 'rec_advanced', name: '🔥 高手突破',
        desc: '追求更高水平，挑战连续得分',
        items: [
          { projectId: find('连续围球'), duration: 30, targetRate: 60 },
          { projectId: find('九球走位'), duration: 30, targetRate: 60 },
          { projectId: find('高低杆进阶'), duration: 20, targetRate: 50 }
        ].filter(i => i.projectId)
      }
    ]
  })

  // ===== 工具函数 =====
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
  function saveCartLocal() {
    localStorage.setItem('bt_cart', JSON.stringify(cart.value))
  }

  // ===== 初始化 =====
  async function init() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await loadUserProfile(session.user)
        await loadAllData()
      }
      await loadSquareProjects()
    } catch (e) {
      console.error('Init error:', e)
    }
    initialized.value = true
  }

  async function loadUserProfile(user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) {
      userInfo.value = {
        id: data.id, phone: data.phone, nickName: data.nickname,
        avatar: data.avatar, role: data.role, coachCode: data.coach_code,
        createdAt: data.created_at
      }
    } else {
      userInfo.value = {
        id: user.id, phone: user.user_metadata?.phone || user.email?.replace('@billiard.app', ''),
        nickName: user.user_metadata?.nickname || '球友',
        avatar: '', role: 'student'
      }
    }
  }

  async function loadAllData() {
    if (!userInfo.value) return
    await Promise.all([
      loadRecords(), loadMyFavorites(), loadMyLikes(),
      loadPlanHistory(), loadHomework(), loadStudents()
    ])
  }

  // ===== 认证 =====
  async function register(phone, password, nickname) {
    // Supabase Auth 需要 email 格式，手机号后加 @billiard.app
    const email = phone + '@billiard.app'
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname: nickname || '', phone } }
    })
    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already been registered'))
        return { ok: false, msg: '该手机号已注册' }
      return { ok: false, msg: error.message }
    }
    if (data.user) {
      await loadUserProfile(data.user)
      await loadAllData()
      return { ok: true }
    }
    return { ok: false, msg: '注册失败' }
  }

  async function login(phone, password) {
    const email = phone + '@billiard.app'
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.includes('Invalid login') || error.message.includes('Invalid credentials'))
        return { ok: false, msg: '密码错误' }
      if (error.message.includes('User not found')) return { ok: false, msg: '该手机号未注册' }
      return { ok: false, msg: error.message }
    }
    if (data.user) {
      await loadUserProfile(data.user)
      await loadAllData()
      return { ok: true }
    }
    return { ok: false, msg: '登录失败' }
  }

  async function logout() {
    await supabase.auth.signOut()
    userInfo.value = null
    records.value = []
    myFavProjectIds.value = []
    myLikedProjectIds.value = []
    planHistory.value = []
    homework.value = []
    students.value = []
  }

  async function setUserInfo(info) {
    if (!userInfo.value) return
    const update = {}
    if (info.nickName !== undefined) update.nickname = info.nickName
    if (info.avatar !== undefined) update.avatar = info.avatar
    if (info.role !== undefined) update.role = info.role
    const { error } = await supabase.from('profiles').update(update).eq('id', userInfo.value.id)
    if (!error) Object.assign(userInfo.value, info)
  }

  // ===== 训练记录 =====
  async function loadRecords() {
    if (!userInfo.value) return
    const { data } = await supabase
      .from('training_records')
      .select('*')
      .eq('user_id', userInfo.value.id)
      .order('created_at', { ascending: false })
    if (data) {
      records.value = data.map(r => ({
        id: r.id, projectId: r.project_id, project: r.project_name, projectName: r.project_name,
        date: r.date, duration: r.duration, totalShots: r.total_shots,
        hits: r.hits, hitRate: r.hit_rate, starred: r.starred,
        note: r.note, createdAt: r.created_at
      }))
    }
  }

  async function addRecord(record) {
    if (!userInfo.value) return
    const row = {
      user_id: userInfo.value.id,
      project_id: record.projectId || null,
      project_name: record.project || record.projectName || '',
      date: record.date || getToday(),
      duration: record.duration || 0,
      total_shots: record.totalShots || 0,
      hits: record.hits || 0,
      hit_rate: record.hitRate || 0,
      starred: record.starred || false,
      note: record.note || ''
    }
    const { data, error } = await supabase.from('training_records').insert(row).select().single()
    if (data && !error) {
      records.value.unshift({
        id: data.id, projectId: data.project_id, project: data.project_name, projectName: data.project_name,
        date: data.date, duration: data.duration, totalShots: data.total_shots,
        hits: data.hits, hitRate: data.hit_rate, starred: data.starred,
        note: data.note, createdAt: data.created_at
      })
    }
  }

  async function deleteRecord(id) {
    await supabase.from('training_records').delete().eq('id', id)
    records.value = records.value.filter(r => r.id !== id)
  }

  async function toggleStar(id) {
    const r = records.value.find(r => r.id === id)
    if (!r) return false
    const newVal = !r.starred
    await supabase.from('training_records').update({ starred: newVal }).eq('id', id)
    r.starred = newVal
    return newVal
  }

  function getRecord(id) { return records.value.find(r => r.id === id) }

  // ===== 广场项目 =====
  async function loadSquareProjects() {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) {
      squareProjects.value = data.map(p => ({
        id: p.id, name: p.name, desc: p.description,
        category: p.category,
        publisher: p.publisher_id ? '我' : '系统推荐',
        publisherId: p.publisher_id,
        likes: p.likes || 0, favs: p.favs || 0, participants: p.participants || 0,
        videoUrl: p.video_url, createdAt: p.created_at?.slice(0, 10)
      }))
    }
  }

  function getSquareProject(id) { return squareProjects.value.find(p => p.id === id) }

  async function publishProject(projectData) {
    if (!userInfo.value) return
    const row = {
      name: projectData.name,
      description: projectData.desc || projectData.description || '',
      category: projectData.category || 'basic',
      publisher_id: userInfo.value.id,
      video_url: projectData.videoUrl || ''
    }
    const { data, error } = await supabase.from('projects').insert(row).select().single()
    if (data && !error) {
      squareProjects.value.unshift({
        id: data.id, name: data.name, desc: data.description,
        category: data.category, publisher: '我', publisherId: data.publisher_id,
        likes: 0, favs: 0, participants: 0,
        videoUrl: data.video_url, createdAt: data.created_at?.slice(0, 10)
      })
    }
  }

  async function toggleFavProject(projectId) {
    if (!userInfo.value) return false
    const idx = myFavProjectIds.value.indexOf(projectId)
    if (idx >= 0) {
      await supabase.from('favorites').delete().eq('user_id', userInfo.value.id).eq('project_id', projectId)
      myFavProjectIds.value.splice(idx, 1)
      const p = squareProjects.value.find(p => p.id === projectId)
      if (p && p.favs > 0) {
        p.favs--
        await supabase.from('projects').update({ favs: p.favs }).eq('id', projectId)
      }
      return false
    } else {
      await supabase.from('favorites').insert({ user_id: userInfo.value.id, project_id: projectId })
      myFavProjectIds.value.push(projectId)
      const p = squareProjects.value.find(p => p.id === projectId)
      if (p) {
        p.favs++
        await supabase.from('projects').update({ favs: p.favs }).eq('id', projectId)
      }
      return true
    }
  }

  function isProjectFaved(projectId) { return myFavProjectIds.value.includes(projectId) }

  async function likeProject(projectId) {
    if (!userInfo.value) return
    if (myLikedProjectIds.value.includes(projectId)) return
    await supabase.from('likes').insert({ user_id: userInfo.value.id, project_id: projectId })
    myLikedProjectIds.value.push(projectId)
    const p = squareProjects.value.find(p => p.id === projectId)
    if (p) {
      p.likes++
      await supabase.from('projects').update({ likes: p.likes }).eq('id', projectId)
    }
  }

  async function loadMyFavorites() {
    if (!userInfo.value) return
    const { data } = await supabase.from('favorites').select('project_id').eq('user_id', userInfo.value.id)
    myFavProjectIds.value = data ? data.map(d => d.project_id) : []
  }

  async function loadMyLikes() {
    if (!userInfo.value) return
    const { data } = await supabase.from('likes').select('project_id').eq('user_id', userInfo.value.id)
    myLikedProjectIds.value = data ? data.map(d => d.project_id) : []
  }

  // ===== 购物车（localStorage） =====
  function addToCart(item) { cart.value.push(item); saveCartLocal() }
  function updateCart(index, data) { Object.assign(cart.value[index], data); saveCartLocal() }
  function removeFromCart(index) { cart.value.splice(index, 1); saveCartLocal() }
  function clearCart() { cart.value = []; saveCartLocal() }
  function isInCart(projectId) { return cart.value.some(item => item.projectId === projectId) }
  function removeFromCartByProjectId(projectId) {
    const idx = cart.value.findIndex(item => item.projectId === projectId)
    if (idx >= 0) { cart.value.splice(idx, 1); saveCartLocal() }
  }

  function loadRecommendedPlan(planId) {
    const plan = recommendedPlans.value.find(p => p.id === planId)
    if (!plan) return
    cart.value = []
    plan.items.forEach(item => {
      const project = squareProjects.value.find(p => p.id === item.projectId)
      if (project) {
        cart.value.push({
          projectId: project.id, name: project.name, category: project.category,
          duration: item.duration, targetRate: item.targetRate
        })
      }
    })
    plan.items.forEach(item => {
      if (!myFavProjectIds.value.includes(item.projectId)) myFavProjectIds.value.push(item.projectId)
    })
    saveCartLocal()
  }

  // ===== 训练计时（内存） =====
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
  function cancelTraining() { currentTraining.value = null; localStorage.removeItem('bt_current_training') }
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
  function isTrainingPaused() { return !!currentTraining.value?.pausedAt }
  function getElapsedSeconds() {
    if (!currentTraining.value) return 0
    const base = Date.now() - currentTraining.value.startTime - (currentTraining.value.pausedDuration || 0)
    if (currentTraining.value.pausedAt)
      return Math.floor((currentTraining.value.pausedAt - currentTraining.value.startTime - (currentTraining.value.pausedDuration || 0)) / 1000)
    return Math.floor(base / 1000)
  }

  // ===== 实时击球 =====
  function recordShot(hit) { liveShots.value.push({ hit, time: Date.now() }) }
  function recordBatchShots(hit, count) { const now = Date.now(); for (let i = 0; i < count; i++) liveShots.value.push({ hit, time: now + i }) }
  function undoShot() { if (liveShots.value.length > 0) liveShots.value.pop() }
  function getLiveStats() {
    const total = liveShots.value.length
    const hits = liveShots.value.filter(s => s.hit).length
    return { total, hits, hitRate: total > 0 ? Math.round(hits / total * 100) : 0 }
  }

  // ===== 计划历史 =====
  async function loadPlanHistory() {
    if (!userInfo.value) return
    const { data } = await supabase
      .from('plan_history').select('*').eq('user_id', userInfo.value.id)
      .order('created_at', { ascending: false }).limit(30)
    planHistory.value = data ? data.map(p => ({ id: p.id, items: p.items, date: p.date, savedAt: p.created_at })) : []
  }
  async function savePlanToHistory() {
    if (!userInfo.value) return
    const items = cart.value.filter(item => item.projectId)
    if (!items.length) return
    const { data } = await supabase.from('plan_history').insert({ user_id: userInfo.value.id, items, date: getToday() }).select().single()
    if (data) {
      planHistory.value.unshift({ id: data.id, items: data.items, date: data.date, savedAt: data.created_at })
      if (planHistory.value.length > 30) planHistory.value.length = 30
    }
  }
  async function restorePlanFromHistory(historyId) {
    const plan = planHistory.value.find(p => p.id === historyId)
    if (plan) { cart.value = plan.items.map(item => ({ ...item })); saveCartLocal() }
  }
  async function deletePlanHistory(historyId) {
    await supabase.from('plan_history').delete().eq('id', historyId)
    planHistory.value = planHistory.value.filter(p => p.id !== historyId)
  }

  // ===== 教练作业 =====
  async function loadHomework() {
    if (!userInfo.value) return
    const [s, c] = await Promise.all([
      supabase.from('homework').select('*').eq('student_id', userInfo.value.id),
      supabase.from('homework').select('*').eq('coach_id', userInfo.value.id)
    ])
    const all = [...(s.data || []).filter(h => !h.completed), ...(c.data || [])].sort((a, b) => b.created_at.localeCompare(a.created_at))
    homework.value = all.map(h => ({
      id: h.id, coachId: h.coach_id, studentId: h.student_id,
      items: h.items, note: h.note, completed: h.completed,
      completedAt: h.completed_at, createdAt: h.created_at
    }))
  }
  function getStudentHomework() { return homework.value.filter(h => h.studentId === userInfo.value?.id && !h.completed) }
  function getCoachHomework() { return homework.value.filter(h => h.coachId === userInfo.value?.id) }
  async function assignHomework(studentId, items, note) {
    if (!userInfo.value) return
    const { data } = await supabase.from('homework').insert({ coach_id: userInfo.value.id, student_id: studentId, note, items }).select().single()
    if (data) homework.value.unshift({ id: data.id, coachId: data.coach_id, studentId: data.student_id, items: data.items, note: data.note, completed: false, completedAt: null, createdAt: data.created_at })
  }
  async function completeHomework(homeworkId) {
    await supabase.from('homework').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', homeworkId)
    const h = homework.value.find(h => h.id === homeworkId)
    if (h) { h.completed = true; h.completedAt = new Date().toISOString() }
  }
  async function deleteHomework(homeworkId) {
    await supabase.from('homework').delete().eq('id', homeworkId)
    homework.value = homework.value.filter(h => h.id !== homeworkId)
  }

  // ===== 学员 =====
  async function loadStudents() {
    if (!userInfo.value || userInfo.value.role !== 'coach') { students.value = []; return }
    const { data } = await supabase.from('follows').select('student_id, profiles(*)').eq('coach_id', userInfo.value.id)
    students.value = data ? data.map(d => ({ id: d.student_id, name: d.profiles?.nickname || '未知', phone: d.profiles?.phone || '' })) : []
  }
  async function addStudent(studentInfo) {
    if (!userInfo.value) return { ok: false, msg: '未登录' }
    const { data: profile } = await supabase.from('profiles').select('*').eq('phone', studentInfo.phone).single()
    if (!profile) return { ok: false, msg: '该手机号未注册' }
    await supabase.from('follows').upsert({ coach_id: userInfo.value.id, student_id: profile.id })
    students.value.push({ id: profile.id, name: profile.nickname, phone: profile.phone })
    return { ok: true }
  }
  function getStudentById(studentId) { return students.value.find(s => s.id === studentId) }
  function getOrGenCoachCode() { return userInfo.value?.coachCode || '' }

  // ===== 统计 =====
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
      const name = r.project || r.projectName || '未命名'
      if (!projectMap[name]) projectMap[name] = { name, count: 0, totalShots: 0, totalHits: 0, totalDuration: 0 }
      projectMap[name].count++; projectMap[name].totalShots += r.totalShots || 0; projectMap[name].totalHits += r.hits || 0; projectMap[name].totalDuration += r.duration || 0
    })
    const projectStats = Object.values(projectMap).map(p => ({ ...p, avgRate: p.totalShots > 0 ? Math.round(p.totalHits / p.totalShots * 100) : 0 })).sort((a, b) => b.count - a.count)
    const dateMap = {}
    filtered.forEach(r => {
      if (!dateMap[r.date]) dateMap[r.date] = { duration: 0, totalShots: 0, totalHits: 0, count: 0 }
      dateMap[r.date].duration += r.duration; dateMap[r.date].totalShots += r.totalShots || 0; dateMap[r.date].totalHits += r.hits || 0; dateMap[r.date].count++
    })
    const dates = Object.keys(dateMap).sort()
    const hitRates = dates.map(d => dateMap[d].totalShots > 0 ? Math.round(dateMap[d].totalHits / dateMap[d].totalShots * 100) : 0)
    return { totalSessions: filtered.length, totalDuration, avgHitRate: totalShotsAll > 0 ? Math.round(totalHitsAll / totalShotsAll * 100) : 0, projectStats, dates, hitRates, maxRate: Math.max(...hitRates, 1) }
  }

  function getDailyMetrics(date) {
    const dayRecords = records.value.filter(r => r.date === date)
    const todayCart = cart.value.filter(item => item.projectId)
    const completedIds = new Set()
    dayRecords.forEach(r => { if (r.projectId) completedIds.add(r.projectId) })
    const planTotal = todayCart.length
    const planDone = todayCart.filter(item => completedIds.has(item.projectId)).length
    const planCompletion = planTotal > 0 ? Math.round(planDone / planTotal * 100) : null
    const totalDuration = dayRecords.reduce((sum, r) => sum + (r.duration || 0), 0)
    const projectSet = new Set(dayRecords.map(r => r.project || r.projectName))
    const totalShots = dayRecords.reduce((sum, r) => sum + (r.totalShots || 0), 0)
    const totalHits = dayRecords.reduce((sum, r) => sum + (r.hits || 0), 0)
    const hitRate = totalShots > 0 ? Math.round(totalHits / totalShots * 100) : 0
    const yesterday = getPrevDay(date)
    const yesterdayRecords = records.value.filter(r => r.date === yesterday)
    const ydDuration = yesterdayRecords.reduce((sum, r) => sum + (r.duration || 0), 0)
    const ydProjectSet = new Set(yesterdayRecords.map(r => r.project || r.projectName))
    const ydShots = yesterdayRecords.reduce((sum, r) => sum + (r.totalShots || 0), 0)
    const ydHits = yesterdayRecords.reduce((sum, r) => sum + (r.hits || 0), 0)
    const ydRate = ydShots > 0 ? Math.round(ydHits / ydShots * 100) : 0
    return { planCompletion, duration: totalDuration, durationDiff: totalDuration - ydDuration, projectCount: projectSet.size, projectDiff: projectSet.size - ydProjectSet.size, hitRate, hitRateDiff: hitRate - ydRate, totalSessions: dayRecords.length }
  }

  // 兼容旧接口
  function savePlan() {}
  function saveLocal() { saveCartLocal() }

  return {
    userInfo, records, squareProjects, myFavProjectIds, myLikedProjectIds,
    planHistory, homework, students, cart, currentTraining, liveShots,
    recommendedPlans, initialized, loading,
    isLoggedIn, isAdmin, isCoach, todayRecords, todaySummary, weekStreak,
    starredRecords, myFavList, myPublishedList, myPublishedProjects, myProjectList,
    init, loadAllData,
    register, login, logout, setUserInfo,
    addRecord, deleteRecord, toggleStar, getRecord,
    loadSquareProjects, getSquareProject, publishProject,
    toggleFavProject, isProjectFaved, likeProject,
    addToCart, updateCart, removeFromCart, clearCart, isInCart, removeFromCartByProjectId,
    loadRecommendedPlan,
    startTraining, endTraining, cancelTraining, pauseTraining, resumeTraining, isTrainingPaused, getElapsedSeconds,
    recordShot, recordBatchShots, undoShot, getLiveStats,
    savePlanToHistory, restorePlanFromHistory, deletePlanHistory,
    assignHomework, getStudentHomework, getCoachHomework, completeHomework, deleteHomework,
    addStudent, getStudentById, getOrGenCoachCode,
    getStats, getDailyMetrics, getToday, formatDate,
    savePlan, saveLocal
  }
})
