import { http } from '../index'
import type { ApiResponse } from './types'
import type { PublicNetConfig } from '../../model/publicNet'

// 方法索引列表
// 1. func PublicNetApi.get - 获取公网配置 ✓ 已应用
// 2. func PublicNetApi.update - 修改公网配置 ✓ 已应用

export const PublicNetApi = {
  // 1. func PublicNetApi.get - 获取公网配置 ✓ 已应用
  // GET /api/publicnet/config
  get() {
    return http.get<ApiResponse<PublicNetConfig>>('/publicnet/config')
  },

  // 2. func PublicNetApi.update - 修改公网配置 ✓ 已应用
  // PUT /api/publicnet/config
  update(config: { external_ip: string }) {
    return http.put<ApiResponse<PublicNetConfig>>('/publicnet/config', config)
  },
}

