import type { RouteRecordRaw } from 'vue-router'

export const appRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/orangepi',
  },
  {
    path: '/orangepi',
    name: 'OrangePi',
    meta: { title: '香橙派', subtitle: 'OrangePi Devices', icon: 'app' },
    component: () => import('../views/orangepi/OrangePiView.vue'),
  },
  {
    path: '/building',
    name: 'Building',
    meta: { title: '大廈管理', subtitle: 'Building Information', icon: 'home' },
    component: () => import('../views/building/BuildingView.vue'),
  },
  {
    path: '/nvr',
    name: 'Nvr',
    meta: { title: 'RTSP 組管理', subtitle: 'RTSP Groups', icon: 'video-camera' },
    component: () => import('../views/nvr/NvrView.vue'),
  },
  {
    path: '/admin',
    name: 'Admin',
    meta: { title: '賬戶管理', subtitle: 'Account Management', icon: 'team' },
    component: () => import('../views/admin/AdminerView.vue'),
  },
  {
    path: '/publicnet',
    name: 'PublicNet',
    meta: { title: '公網配置', subtitle: 'Public Network Config', icon: 'api' },
    component: () => import('../views/network/PublicNetView.vue'),
  },
  {
    path: '/public-api',
    name: 'PublicApiTest',
    meta: { title: '接口測試', subtitle: 'Public API Test', icon: 'code' },
    component: () => import('../views/auth/PublicApiTestView.vue'),
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
    meta: { title: '未找到', subtitle: 'Not Found', hidden: true },
    component: () => import('../views/system/NotFoundView.vue'),
  },
] satisfies RouteRecordRaw[]
