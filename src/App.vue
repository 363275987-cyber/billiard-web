<!-- src/App.vue -->
<template>
  <div id="app">
    <router-view />
    <nav class="tab-bar" v-if="showTabBar">
      <router-link to="/" class="tab-item" active-class="active" exact>
        <span class="tab-icon">🏠</span>
        <span>首页</span>
      </router-link>
      <router-link to="/training" class="tab-item" active-class="active">
        <span class="tab-icon">📋</span>
        <span>训练</span>
      </router-link>
      <router-link to="/stats" class="tab-item" active-class="active">
        <span class="tab-icon">📊</span>
        <span>统计</span>
      </router-link>
      <router-link to="/profile" class="tab-item" active-class="active">
        <span class="tab-icon">👤</span>
        <span>我的</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useBilliardStore } from './stores/billiard'

const route = useRoute()
const store = useBilliardStore()

onMounted(() => {
  store.init()
})
const hideOn = [
  '/detail',
  '/record',
  '/square-detail',
  '/my-projects',
  '/my-starred',
  '/publish',
  '/plan',
]
const showTabBar = computed(() => !hideOn.some((p) => route.path.startsWith(p)))
</script>

<style scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: #fff;
  border-top: 1px solid #f0f0f0;
  padding: 4px 0;
  padding-bottom: max(4px, env(safe-area-inset-bottom));
  z-index: 999;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-decoration: none;
  padding: 8px 0;
  color: #b0b0b0;
  font-size: 11px;
  transition: color 0.2s;
}

.tab-item.active {
  color: #2ecc71;
}

.tab-icon {
  font-size: 20px;
}
</style>
