import { http } from '../index'
import type { ApiResponse } from './types'
import type { PublicTokenResponse } from '../../model/orangepi'

// 方法索引列表
// 1. func AuthApi.publicToken - 获取公开Token
// 2. func AuthApi.login - 管理员登录 ✓ 已应用

export const AuthApi = {
  // 1. func AuthApi.publicToken - 获取公开Token
  // POST /api/auth/public
  publicToken(data: { ismartid: string; is_staff: boolean }, _?: any) {
    return http.post<ApiResponse<PublicTokenResponse>>('/auth/public', data)
  },

  // 2. func AuthApi.login - 管理员登录 ✓ 已应用
  // POST /api/auth/login
  login(data: { username: string; password: string }) {
    return http.post<ApiResponse<{ accessToken: string; expiresAt: string }>>(
      '/auth/login',
      data,
    )
  },
}

