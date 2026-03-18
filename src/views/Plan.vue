<!-- src/views/Plan.vue - 简化版训练计划 -->
<template>
  <div class="page">
    <div class="page-title">训练计划</div>

    <div class="period-tabs">
      <button :class="{ active: tab === 'menu' }" @click="tab = 'menu'">
        🎯 项目库
      </button>
      <button :class="{ active: tab === 'cart' }" @click="tab = 'cart'">
        🛒 今日计划 ({{ store.cart.length }})
      </button>
    </div>

    <!-- 项目库 -->
    <div v-if="tab === 'menu'">
      <div v-for="cat in categories" :key="cat.name" class="category">
        <div class="cat-title">{{ cat.name }}</div>
        <div
          class="menu-item"
          v-for="item in cat.items"
          :key="item.id"
          @click="openAdd(item)"
        >
          <div class="menu-item-left">
            <span class="menu-item-name">{{ item.name }}</span>
            <span class="menu-item-desc">{{ item.desc }}</span>
          </div>
          <span class="diff-tag" :class="item.diffClass">{{
            item.difficulty
          }}</span>
        </div>
      </div>
    </div>

    <!-- 购物车 -->
    <div v-if="tab === 'cart'">
      <div v-if="store.cart.length > 0">
        <div class="cart-summary">
          <span>共 {{ store.cart.length }} 个训练项目</span>
          <span class="clear-btn" @click="handleClear">清空</span>
        </div>
        <div
          class="cart-item"
          v-for="(item, i) in store.cart"
          :key="item.cartId"
        >
          <div class="cart-content">
            <span class="cart-name">{{ item.name }}</span>
            <span class="cart-meta"
              >{{ item.duration }}分钟 · 进球率{{ item.targetRate }}%</span
            >
          </div>
          <span class="cart-remove" @click="store.removeFromCart(i)">✕</span>
        </div>
      </div>
      <div class="empty-card" v-else>
        <span class="empty-icon">🛒</span>
        <span class="empty-text">购物车是空的</span>
        <span class="empty-desc">去项目库选几个训练项目吧</span>
        <button
          class="btn-primary"
          style="margin-top: 16px"
          @click="tab = 'menu'"
        >
          去选项目
        </button>
      </div>
    </div>

    <!-- 添加弹窗 -->
    <div class="modal-mask" v-if="showModal" @click.self="showModal = false">
      <div class="modal-panel">
        <div class="modal-header">
          <span class="modal-title">添加「{{ editingItem?.name }}」</span>
          <span class="modal-close" @click="showModal = false">✕</span>
        </div>
        <div class="modal-body">
          <div class="pref-section">
            <span class="pref-label">⏱ 训练时长</span>
            <div class="quick-chips">
              <button
                :class="{ active: prefDuration === 15 }"
                @click="prefDuration = 15"
              >
                15分钟
              </button>
              <button
                :class="{ active: prefDuration === 30 }"
                @click="prefDuration = 30"
              >
                30分钟
              </button>
              <button
                :class="{ active: prefDuration === 45 }"
                @click="prefDuration = 45"
              >
                45分钟
              </button>
              <button
                :class="{ active: prefDuration === 60 }"
                @click="prefDuration = 60"
              >
                1小时
              </button>
            </div>
          </div>
          <div class="pref-section">
            <span class="pref-label">🎯 目标进球率</span>
            <div class="quick-chips">
              <button
                :class="{ active: prefTarget === 30 }"
                @click="prefTarget = 30"
              >
                30%
              </button>
              <button
                :class="{ active: prefTarget === 50 }"
                @click="prefTarget = 50"
              >
                50%
              </button>
              <button
                :class="{ active: prefTarget === 70 }"
                @click="prefTarget = 70"
              >
                70%
              </button>
              <button
                :class="{ active: prefTarget === 90 }"
                @click="prefTarget = 90"
              >
                90%
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showModal = false">取消</button>
          <button class="btn-primary" style="flex: 2" @click="addToCart">
            🛒 加入购物车
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useBilliardStore } from '../stores/billiard'

const store = useBilliardStore()
const tab = ref('menu')
const showModal = ref(false)
const editingItem = ref(null)
const prefDuration = ref(30)
const prefTarget = ref(60)

const categories = [
  {
    name: '🎯 基础练习',
    items: [
      {
        id: 'zhongdai',
        name: '中袋',
        desc: '中距离袋口练习',
        difficulty: '基础',
        diffClass: 'basic',
      },
      {
        id: 'yuantai',
        name: '远台',
        desc: '远距离精准度训练',
        difficulty: '进阶',
        diffClass: 'medium',
      },
      {
        id: 'changtai',
        name: '长台',
        desc: '全台长距离进攻',
        difficulty: '进阶',
        diffClass: 'medium',
      },
      {
        id: 'kaiqiu',
        name: '开球',
        desc: '开球布局与进攻路线',
        difficulty: '进阶',
        diffClass: 'medium',
      },
    ],
  },
  {
    name: '🎱 走位控制',
    items: [
      {
        id: 'zouwei',
        name: '走位',
        desc: '白球走位精准控制',
        difficulty: '进阶',
        diffClass: 'medium',
      },
      {
        id: 'jiugq_zw',
        name: '九球走位',
        desc: '九球专项走位训练',
        difficulty: '高级',
        diffClass: 'advanced',
      },
      {
        id: 'xuanzhuan',
        name: '旋转',
        desc: '高低杆、侧旋控制',
        difficulty: '进阶',
        diffClass: 'medium',
      },
      {
        id: 'gangan',
        name: '架杆',
        desc: '架杆精准度训练',
        difficulty: '基础',
        diffClass: 'basic',
      },
    ],
  },
  {
    name: '🛡️ 防守安全',
    items: [
      {
        id: 'anquanqiu',
        name: '安全球',
        desc: '防守母球控制',
        difficulty: '进阶',
        diffClass: 'medium',
      },
      {
        id: 'fangshou',
        name: '防守',
        desc: '复杂局面防守策略',
        difficulty: '高级',
        diffClass: 'advanced',
      },
      {
        id: 'kqiu',
        name: 'K球',
        desc: 'K球分离与走位',
        difficulty: '高级',
        diffClass: 'advanced',
      },
    ],
  },
  {
    name: '⚡ 其他',
    items: [
      {
        id: 'fandai',
        name: '翻袋',
        desc: '翻袋技术与角度控制',
        difficulty: '进阶',
        diffClass: 'medium',
      },
      {
        id: 'free',
        name: '自由练习',
        desc: '自由安排练习内容',
        difficulty: '自由',
        diffClass: 'basic',
      },
    ],
  },
]

function openAdd(item) {
  editingItem.value = item
  prefDuration.value = 30
  prefTarget.value = 60
  showModal.value = true
}

function addToCart() {
  if (!editingItem.value) return
  store.addToCart({
    cartId: Date.now().toString(),
    itemId: editingItem.value.id,
    name: editingItem.value.name,
    desc: editingItem.value.desc,
    duration: prefDuration.value,
    targetRate: prefTarget.value,
  })
  showModal.value = false
  tab.value = 'cart'
}

function handleClear() {
  if (confirm('确定要清空所有项目吗？')) store.clearCart()
}
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
  padding: 10px 4px;
  font-size: 13px;
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

.category {
  margin-bottom: 12px;
}
.cat-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a2e;
  padding: 10px 0 6px;
}
.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 14px;
  margin-bottom: 8px;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}
.menu-item:active {
  background: #fafafa;
}
.menu-item-name {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}
.menu-item-desc {
  display: block;
  font-size: 12px;
  color: #b0b0b0;
  margin-top: 3px;
}
.diff-tag {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 10px;
  font-weight: 500;
}
.diff-tag.basic {
  background: rgba(46, 204, 113, 0.1);
  color: #27ae60;
}
.diff-tag.medium {
  background: rgba(255, 107, 53, 0.1);
  color: #e55a2b;
}
.diff-tag.advanced {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.cart-summary {
  display: flex;
  justify-content: space-between;
  padding: 10px 12px;
  font-size: 14px;
  color: #666;
}
.clear-btn {
  color: #e74c3c;
  cursor: pointer;
}
.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  margin: 8px 0;
  padding: 14px;
  border-radius: 10px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}
.cart-name {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
}
.cart-meta {
  display: block;
  font-size: 12px;
  color: #b0b0b0;
  margin-top: 4px;
}
.cart-remove {
  font-size: 18px;
  color: #ccc;
  cursor: pointer;
  padding: 4px 8px;
}
.cart-remove:hover {
  color: #e74c3c;
}

.empty-card {
  text-align: center;
  padding: 40px 16px;
  background: #fff;
  border-radius: 12px;
}
.empty-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 8px;
}
.empty-text {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}
.empty-desc {
  display: block;
  font-size: 13px;
  color: #b0b0b0;
  margin-top: 4px;
}

/* 弹窗 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}
.modal-panel {
  width: 100%;
  max-width: 480px;
  background: #fff;
  border-radius: 14px 14px 0 0;
  margin: 0 auto;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px;
  border-bottom: 1px solid #f5f5f5;
}
.modal-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a2e;
}
.modal-close {
  font-size: 18px;
  color: #b0b0b0;
  cursor: pointer;
}
.modal-body {
  padding: 18px;
}
.modal-footer {
  display: flex;
  gap: 8px;
  padding: 14px 18px;
  border-top: 1px solid #f5f5f5;
}
.modal-footer .btn-secondary {
  flex: 1;
  padding: 10px 0;
  font-size: 14px;
}

.pref-section {
  margin-bottom: 18px;
}
.pref-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}
.quick-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.quick-chips button {
  padding: 8px 14px;
  background: #f5f5f5;
  border-radius: 16px;
  font-size: 13px;
  color: #666;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}
.quick-chips button.active {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(46, 204, 113, 0.3);
}
</style>
