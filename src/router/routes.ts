import type { RouteRecordRaw } from 'vue-router'

export const appRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    meta: { title: '儀表盤', subtitle: 'Dashboard', icon: 'dashboard' },
    component: () => import('../views/dashboard/DashboardView.vue'),
  },
  {
    path: '/orangepi',
    name: 'OrangePi',
    meta: { title: 'OrangePi 設備', subtitle: 'OrangePi Devices', icon: 'app' },
    component: () => import('../views/orangepi/OrangePiView.vue'),
  },
  {
    path: '/building',
    name: 'Building',
    meta: { title: '大廈資訊', subtitle: 'Building Information', icon: 'home' },
    component: () => import('../views/building/BuildingView.vue'),
  },
  {
    path: '/publicnet',
    name: 'PublicNet',
    meta: { title: '公網配置', subtitle: 'Public Network Config', icon: 'api' },
    component: () => import('../views/network/PublicNetView.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    meta: { title: '登入', subtitle: 'Login', layout: false },
    component: () => import('../views/auth/LoginView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    meta: { title: '未找到', subtitle: 'Not Found' },
    component: () => import('../views/system/NotFoundView.vue'),
  },
] satisfies RouteRecordRaw[]

