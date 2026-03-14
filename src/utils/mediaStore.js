// src/utils/mediaStore.js — IndexedDB 媒体存储 + 压缩工具

const DB_NAME = 'billiard_media'
const DB_VERSION = 1
const STORE_NAME = 'files'

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** 保存文件到 IndexedDB */
export async function saveFile(id, blob) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(blob, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** 从 IndexedDB 读取文件 */
export async function getFile(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(id)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

/** 删除文件 */
export async function deleteFile(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * 图片压缩 — canvas 缩放到 maxDim，JPEG 85% 质量
 * 大图自动缩小，小图保持原尺寸
 */
export function compressImage(file, maxDim = 1280) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const ratio = Math.min(maxDim / img.width, maxDim / img.height, 1)
      const w = Math.round(img.width * ratio)
      const h = Math.round(img.height * ratio)
      if (w === img.width && h === img.height && file.size < 500 * 1024) {
        // 小图不压缩
        URL.revokeObjectURL(img.src)
        resolve(file)
        return
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(img.src)
        resolve(blob || file)
      }, 'image/jpeg', 0.85)
    }
    img.onerror = () => resolve(file)
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 视频压缩 — canvas 720p + MediaRecorder
 * 仅在浏览器支持时工作，否则返回原文件
 * 最大等倍速压缩，有超时保护
 * 支持最大 200MB 原始文件，自动压缩至 720p
 */
export function compressVideo(file, maxWidth = 1280) {
  return new Promise((resolve) => {
    // 不支持 MediaRecorder 直接返回（但限制 50MB）
    if (typeof MediaRecorder === 'undefined') {
      resolve(file.size <= 50 * 1024 * 1024 ? file : null)
      return
    }

    // 小视频不压缩
    if (file.size < 5 * 1024 * 1024) {
      resolve(file)
      return
    }

    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.src = URL.createObjectURL(file)

    // 超时保护（最多压缩 120 秒）
    const timeout = setTimeout(() => {
      try { video.pause() } catch(e) {}
      URL.revokeObjectURL(video.src)
      resolve(file)
    }, 120000)

    video.onloadedmetadata = () => {
      const scale = Math.min(maxWidth / video.videoWidth, 1)
      const w = Math.round(video.videoWidth * scale)
      const h = Math.round(video.videoHeight * scale)

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')

      // 选择编码器
      let mimeType = 'video/webm'
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        mimeType = 'video/webm;codecs=vp9'
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        mimeType = 'video/webm;codecs=vp8'
      }

      try {
        const stream = canvas.captureStream(30)
        const recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 2000000 // 2Mbps → 720p 良好画质
        })
        const chunks = []
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data)
        }
        recorder.onstop = () => {
          clearTimeout(timeout)
          URL.revokeObjectURL(video.src)
          const compressed = new Blob(chunks, { type: mimeType })
          resolve(compressed.size < file.size ? compressed : file)
        }
        recorder.start(100)
        video.currentTime = 0
        video.playbackRate = 2 // 2 倍速压缩
        video.play()

        const draw = () => {
          if (video.ended || video.paused) {
            setTimeout(() => {
              try { recorder.stop() } catch(e) { resolve(file) }
            }, 200)
            return
          }
          ctx.drawImage(video, 0, 0, w, h)
          requestAnimationFrame(draw)
        }
        video.onplay = draw
      } catch(e) {
        clearTimeout(timeout)
        URL.revokeObjectURL(video.src)
        resolve(file)
      }
    }
    video.onerror = () => {
      clearTimeout(timeout)
      URL.revokeObjectURL(video.src)
      resolve(file)
    }
  })
}

/** 生成媒体 ID */
export function mediaId(prefix = 'm') {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}
