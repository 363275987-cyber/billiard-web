// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Home', component: () => import('../views/Home.vue') },
  { path: '/training', name: 'Training', component: () => import('../views/Training.vue') },
  { path: '/record', name: 'Record', component: () => import('../views/Record.vue') },
  { path: '/stats', name: 'Stats', component: () => import('../views/Stats.vue') },
  { path: '/plan', name: 'Plan', component: () => import('../views/Plan.vue') },
  { path: '/profile', name: 'Profile', component: () => import('../views/Profile.vue') },
  { path: '/detail/:id', name: 'Detail', component: () => import('../views/Detail.vue') },
  { path: '/square', name: 'Square', component: () => import('../views/Square.vue') },
  { path: '/publish', name: 'Publish', component: () => import('../views/Publish.vue') },
  { path: '/square-detail/:id', name: 'SquareDetail', component: () => import('../views/SquareDetail.vue') },
  { path: '/my-projects', name: 'MyProjects', component: () => import('../views/MyProjects.vue') },
  { path: '/my-starred', name: 'MyStarred', component: () => import('../views/MyStarred.vue') },
  { path: '/admin', name: 'Admin', component: () => import('../views/Admin.vue') },
]

const router = createRouter({
  history: createWebHashHistory('/billiard-web/'),
  routes
})

export default router
