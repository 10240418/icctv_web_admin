import { http } from '../index'
import type { ApiResponse } from './types'
import type { PublicTokenResponse, PublicTokenV2Response } from '../../model/orangepi'

// 方法索引列表
// 1. func AuthApi.publicToken - 获取公开Token
// 2. func AuthApi.login - 管理员登录 ✓ 已应用
// 3. func AuthApi.publicTokenV2 - 获取带频道备注的公开Token

export const AuthApi = {
  // 1. func AuthApi.publicToken - 获取公开Token
  // POST /api/auth/public
  publicToken(data: { ismartid: string; is_staff: boolean }, _?: any) {
    return http.post<ApiResponse<PublicTokenResponse>>('/auth/public', data)
  },

  // POST /api/auth/public/v2
  publicTokenV2(data: { ismartid: string; is_staff: boolean }) {
    return http.post<ApiResponse<PublicTokenV2Response>>('/auth/public/v2', data)
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
