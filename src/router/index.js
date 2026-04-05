// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Home', component: () => import('../views/Home.vue') },
  { path: '/record', name: 'Record', component: () => import('../views/Record.vue') },
  { path: '/history', name: 'History', component: () => import('../views/History.vue') },
  { path: '/profile', name: 'Profile', component: () => import('../views/Profile.vue') },
]

const router = createRouter({
  history: createWebHashHistory('/billiard-web/'),
  routes,
})

export default router
