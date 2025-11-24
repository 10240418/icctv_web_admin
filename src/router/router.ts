import { createRouter, createWebHistory } from 'vue-router'
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { appRoutes } from './routes'
import { useAuthStore } from '../pinia/useAuthStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: appRoutes,
})

router.beforeEach((to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta?.requiresAuth ?? to.path !== '/login'

  if (requiresAuth && !authStore.isAuthenticated) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  if (to.path === '/login' && authStore.isAuthenticated) {
    next((to.query.redirect as string) || '/dashboard')
    return
  }

  next()
})

export default router





