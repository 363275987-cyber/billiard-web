<template>
  <div class="designer">
    <div class="designer-table">
      <svg viewBox="0 0 254 127" class="table-svg" @pointerup.self="onTableDrop" @pointermove.self="onTableDrag">
        <!-- 台面 -->
        <rect x="0" y="0" width="254" height="127" fill="#0a6d32" rx="4"/>
        <!-- 库边 -->
        <rect x="0" y="0" width="254" height="4" fill="#064d23"/>
        <rect x="0" y="123" width="254" height="4" fill="#064d23"/>
        <rect x="0" y="0" width="4" height="127" fill="#064d23"/>
        <rect x="250" y="0" width="4" height="127" fill="#064d23"/>
        <!-- 内库 -->
        <rect x="2" y="2" width="250" height="123" fill="#0d7a3f" rx="2"/>
        <!-- 袋口 -->
        <!-- 中袋 -->
        <rect x="122" y="0" width="10" height="8" fill="#111" rx="1"/>
        <!-- 左上 -->
        <circle cx="36" cy="36" r="9" fill="#111"/>
        <!-- 右上 -->
        <circle cx="218" cy="36" r="9" fill="#111"/>
        <!-- 左下 -->
        <circle cx="36" cy="91" r="9" fill="#111"/>
        <!-- 右下 -->
        <circle cx="218" cy="91" r="9" fill="#111"/>
        <!-- 置点 -->
        <circle cx="127" cy="63.5" r="3" fill="#064d23" stroke="#333" stroke-width="0.5"/>
        <!-- 开球线 -->
        <line x1="60" y1="63.5" x2="194" y2="63.5" stroke="#0b7a3d" stroke-width="0.8" stroke-dasharray="3,3"/>

        <!-- 已放置的球 -->
        <g v-for="(ball, idx) in modelValue" :key="ball.number" class="ball-on-table"
           @pointerdown.stop.prevent="onBallPointerDown(idx, $event)" @pointermove.stop.prevent="onBallDrag(idx, $event)"
           @pointerup.stop.prevent="onBallDrop(idx)">
          <circle :cx="ball.x" :cy="ball.y" r="4.5" :fill="getBallColor(ball.number)"
                  :stroke="selectedIdx === idx ? '#fff' : '#333'" :strokeWidth="selectedIdx === idx ? 2 : 0.5"/>
          <text v-if="ball.number > 0" :x="ball.x" :y="ball.y + 1.5" text-anchor="middle"
                fill="#fff" font-size="5" font-weight="700">{{ball.number}}</text>
          <!-- 选中高亮 -->
          <circle v-if="selectedIdx === idx" :cx="ball.x" :cy="ball.y" r="6"
                  fill="none" stroke="#fff" stroke-width="1.5" stroke-dasharray="2,2">
            <animate attributeName="r" values="6;7;6" dur="1s" repeatCount="indefinite"/>
          </circle>
        </g>

        <!-- 白球指示 -->
        <g v-if="!hasCueBall">
          <circle cx="127" cy="63.5" r="4.5" fill="none" stroke="rgba(255,255,255,0.3)"
                  stroke-width="1" stroke-dasharray="3,3">
            <animate attributeName="stroke-dashoffset" from="0" to="6" dur="1s" repeatCount="indefinite"/>
          </circle>
          <text x="127" y="67" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="4">白球</text>
        </g>
      </svg>
    </div>

    <!-- 底部球选择区 -->
    <div class="ball-picker">
      <div class="ball-picker-label">拖拽球到台面上</div>
      <div class="ball-picker-row">
        <div class="ball-item cue-ball" @pointerdown="startDragBall(0, $event)">
          <svg viewBox="0 0 20 20" width="24" height="24"><circle cx="10" cy="10" r="8" fill="#fff" stroke="#333" stroke-width="1"/></svg>
          <span>白</span>
        </div>
        <div v-for="n in 15" :key="n" class="ball-item"
             @pointerdown="startDragBall(n, $event)">
          <svg viewBox="0 0 20 20" width="24" height="24">
            <circle cx="10" cy="10" r="8" :fill="getBallColor(n)" stroke="#333" stroke-width="0.5"/>
            <text v-if="n > 8" x="10" y="10.5" text-anchor="middle" fill="#fff" font-size="5" font-weight="700"
                  :stroke="n >= 10 ? '#333' : 'transparent'" :strokeWidth="0.3">{{n}}</text>
            <text v-if="n <= 8 && n > 0" x="10" y="10.5" text-anchor="middle" fill="#fff" font-size="6" font-weight="700">{{n}}</text>
          </svg>
          <span>{{n}}号</span>
        </div>
      </div>
    </div>

    <!-- 拖拽中的球 -->
    <div v-if="dragging" class="dragging-ball" :style="{ left: dragX + 'px', top: dragY + 'px' }"
         @pointermove="onDragMove" @pointerup="onDragEnd">
      <svg viewBox="0 0 20 20" width="36" height="36">
        <circle cx="10" cy="10" r="8" :fill="getBallColor(draggingNumber)" stroke="#333" stroke-width="0.5"/>
        <text v-if="draggingNumber > 8" x="10" y="10.5" text-anchor="middle" fill="#fff" font-size="5" font-weight="700"
              stroke="#333" strokeWidth="0.3">{{draggingNumber}}</text>
        <text v-if="draggingNumber <= 8 && draggingNumber > 0" x="10" y="10.5" text-anchor="middle" fill="#fff" font-size="6" font-weight="700">{{draggingNumber}}</text>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:modelValue'])

const selectedIdx = ref(-1)
const dragging = ref(false)
const draggingNumber = ref(null)
const dragOffsetX = ref(0)
const dragOffsetY = ref(0)
const dragX = ref(0)
const dragY = ref(0)
const tableRect = ref(null)

const hasCueBall = computed(() => props.modelValue.some(b => b.number === 0))
const ballColors = {
  0: '#ffffff', 1: '#f5d442', 2: '#2955a3', 3: '#d4463b', 4: '#5b3a8c',
  5: '#f07830', 6: '#2d8c3f', 7: '#8b4513', 8: '#111111',
  9: '#f5d442', 10: '#2955a3', 11: '#5b3a8c', 12: '#a0522d', 13: '#f07830',
  14: '#2d8c3f', 15: '#8b4513'
}

function getBallColor(n) { return ballColors[n] || '#999' }

function getTableEl() { return document.querySelector('.table-svg')?.closest('.designer-table') || document.querySelector('.designer-table') }

function svgToPercent(clientX, clientY) {
  const el = getTableEl()
  if (!el) return { x: 50, y: 50 }
  const rect = el.getBoundingClientRect()
  // SVG viewBox is 254x127, add padding
  const innerW = rect.width - 8
  const innerH = rect.height - 8
  const x = Math.max(0, Math.min(100, ((clientX - rect.left - 4) / innerW) * 100))
  const y = Math.max(0, Math.min(100, ((clientY - rect.top - 4) / innerH) * 100))
  return { x, y }
}

function onBallPointerDown(idx, e) {
  selectedIdx.value = idx
}

function onBallDrag(idx, e) {
  if (selectedIdx.value !== idx) { selectedIdx.value = idx; return }
  const ball = props.modelValue[idx]
  const pos = svgToPercent(e.clientX, e.clientY)
  ball.x = pos.x
  ball.y = pos.y
}

function onBallDrop(idx) {
  selectedIdx.value = -1
}

function onTableClick(e) {
  if (dragging.value) {
    const pos = svgToPercent(e.clientX, e.clientY)
    emit('update:modelValue', [...props.modelValue, { number: draggingNumber.value, x: pos.x, y: pos.y }])
    dragging.value = false
    draggingNumber.value = null
  } else {
    selectedIdx.value = -1
  }
}

function onTableDrag(e) {
  if (dragging.value) {
    dragX.value = e.clientX - dragOffsetX.value
    dragY.value = e.clientY - dragOffsetY.value
  }
}

function onTableDrop() {
  if (dragging.value) {
    const pos = svgToPercent(dragX.value + 36, dragY.value + 36)
    emit('update:modelValue', [...props.modelValue, { number: draggingNumber.value, x: pos.x, y: pos.y }])
    dragging.value = false
    draggingNumber.value = null
  }
}

function startDragBall(number, e) {
  // 如果台面上已有这个球，先移除
  const idx = props.modelValue.findIndex(b => b.number === number)
  if (idx >= 0) {
    const arr = [...props.modelValue]
    arr.splice(idx, 1)
    emit('update:modelValue', arr)
  }
  dragging.value = true
  draggingNumber.value = number
  dragX.value = e.clientX
  dragY.value = e.clientY
  dragOffsetX.value = 0
  dragOffsetY.value = 0
}

function onDragMove(e) {
  dragX.value = e.clientX - dragOffsetX.value
  dragY.value = e.clientY - dragOffsetY.value
}

function onDragEnd() {
  dragging.value = false
  draggingNumber.value = null
}
</script>

<style scoped>
.designer {
  padding: 12px;
}

.designer-table {
  position: relative;
  background: var(--keep-card);
  border-radius: var(--keep-radius);
  padding: 8px;
  margin: 0 12px;
  box-shadow: var(--keep-shadow);
  overflow: hidden;
  touch-action: none;
}

.table-svg {
  width: 100%;
  display: block;
  user-select: none;
  touch-action: none;
}

.ball-on-table {
  cursor: grab;
}

.ball-on-table:active {
  cursor: grabbing;
}

.ball-picker {
  background: var(--keep-card);
  border-radius: var(--keep-radius);
  padding: 12px;
  margin: 0 12px;
  box-shadow: var(--keep-shadow);
}

.ball-picker-label {
  font-size: 13px;
  color: #888;
  margin-bottom: 10px;
  text-align: center;
}

.ball-picker-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

.ball-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: grab;
  padding: 4px;
  border-radius: 8px;
  transition: background 0.2s;
  touch-action: none;
}

.ball-item:active {
  background: rgba(0,0,0,0.05);
}

.ball-item span {
  font-size: 10px;
  color: #666;
}

.ball-item.cue-ball span {
  color: #999;
}

.dragging-ball {
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.9;
  transform: translate(-50%, -50%);
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
}
</style>
