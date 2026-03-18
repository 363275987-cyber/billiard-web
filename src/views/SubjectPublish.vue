<template>
  <div class="page">
    <div class="page-top">
      <button class="btn-back" @click="$router.back()">← 返回</button>
      <span class="page-title">🎯 发布训练科目</span>
    </div>

    <div class="section">
      <div class="card">
        <div class="form-group">
          <label>科目名称</label>
          <input v-model="form.name" class="form-input" placeholder="例如：5球直线球连进" maxlength="30"/>
        </div>
        <div class="form-group">
          <label>科目描述</label>
          <textarea v-model="form.description" class="form-textarea" placeholder="描述训练要点..." rows="2" maxlength="200"></textarea>
        </div>

        <div class="form-group">
          <label>球形设计</label>
          <div class="designer-hint">点击下方球放置到台面上，点击台面上的球可拖动</div>
          <BallLayoutDesigner v-model="form.balls"/>
        </div>

        <div class="form-row">
          <div class="form-group" style="flex:1">
            <label>难度</label>
            <div class="segment-control">
              <button :class="['seg-btn', { active: form.difficulty === 'beginner' }]" @click="form.difficulty = 'beginner'">入门</button>
              <button :class="['seg-btn', { active: form.difficulty === 'intermediate' }]" @click="form.difficulty = 'intermediate'">进阶</button>
              <button :class="['seg-btn', { active: form.difficulty === 'advanced' }]" @click="form.difficulty = 'advanced'">高级</button>
            </div>
          </div>
          <div class="form-group" style="flex:1">
            <label>分类</label>
            <select v-model="form.category" class="form-input">
              <option value="basic">基础</option>
              <option value="angle">角度球</option>
              <option value="position">走位</option>
              <option value="combo">组合</option>
              <option value="other">其他</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>每组球数</label>
          <input v-model.number="form.shotsPerGroup" type="number" class="form-input" min="1" max="15"/>
        </div>

        <!-- 到位率开关 -->
        <div class="toggle-row">
          <span class="toggle-label">开启到位率要求</span>
          <label class="toggle">
            <input type="checkbox" v-model="form.hasPositionRating"/>
            <span class="toggle-slider"></span>
          </label>
        </div>

        <!-- 成功条件 -->
        <div v-if="form.hasPositionRating" class="success-conditions">
          <div class="form-group">
            <label>进球率达标 (%)</label>
            <input v-model.number="form.successPotRate" type="number" class="form-input" min="0" max="100"/>
          </div>
          <div class="form-group">
            <label>到位率达标 (%)</label>
            <input v-model.number="form.successPositionRate" type="number" class="form-input" min="0" max="100"/>
          </div>
        </div>
        <div v-else class="success-conditions">
          <div class="form-group">
            <label>进球率达标 (%)</label>
            <input v-model.number="form.successPotRate" type="number" class="form-input" min="0" max="100"/>
          </div>
        </div>
      </div>
    </div>

    <div class="section" style="padding-bottom: 20px;">
      <button class="btn-primary" :disabled="!canPublish" @click="handlePublish">
        🚀 发布科目
      </button>
    </div>

    <!-- 成功提示 -->
    <div v-if="published" class="success-toast">
      <span>✅ 科目发布成功！</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BallLayoutDesigner from '../components/BallLayoutDesigner.vue'
import { useBilliardStore } from '../stores/billiard'

const router = useRouter()
const store = useBilliardStore()

const form = ref({
  name: '',
  description: '',
  balls: [],
  difficulty: 'beginner',
  category: 'basic',
  shotsPerGroup: 5,
  hasPositionRating: false,
  successPotRate: 80,
  successPositionRate: 60
})

const published = ref(false)

const canPublish = computed(() => {
  return form.value.name.trim() && form.value.balls.length >= 1 && form.value.shotsPerGroup >= 1
})

async function handlePublish() {
  const result = await store.publishSubject(form.value)
  if (result) {
    published.value = true
    setTimeout(() => {
      published.value = false
      router.push('/square-subjects')
    }, 1500)
  }
}
</script>

<style scoped>
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
  font-weight: 600;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  font-size: 15px;
  color: #333;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: var(--keep-green);
}

.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  font-size: 14px;
  color: #333;
  outline: none;
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-textarea:focus {
  border-color: var(--keep-green);
}

.form-row {
  display: flex;
  gap: 12px;
}

.designer-hint {
  font-size: 12px;
  color: #aaa;
  margin-bottom: 8px;
}

.segment-control {
  display: flex;
  gap: 0;
  background: #f0f0f0;
  border-radius: 10px;
  padding: 3px;
}

.seg-btn {
  flex: 1;
  padding: 8px 0;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 13px;
  color: #999;
  cursor: pointer;
  transition: all 0.2s;
}

.seg-btn.active {
  background: #fff;
  color: var(--keep-green);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
}

.toggle-label {
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ddd;
  border-radius: 24px;
  transition: 0.3s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  left: 3px;
  bottom: 3px;
  background: #fff;
  border-radius: 50%;
  transition: 0.3s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.toggle input:checked + .toggle-slider {
  background: var(--keep-green);
}

.toggle input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.success-conditions {
  background: rgba(46,204,113,0.05);
  border-radius: 10px;
  padding: 8px 12px;
  margin-top: -4px;
  margin-bottom: 16px;
}

.success-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.8);
  color: #fff;
  padding: 16px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  z-index: 9999;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
</style>

