import { http } from '../index'
import type { ApiResponse } from './types'
import type { Nvr, NvrList } from '../../model/nvr'

// 方法索引列表
// 1. func NvrApi.list - 查询NVR列表 ✓ 已应用
// 2. func NvrApi.create - 创建NVR信息 ✓ 已应用
// 3. func NvrApi.update - 更新NVR信息 ✓ 已应用
// 4. func NvrApi.remove - 删除NVR信息 ✓ 已应用

export const NvrApi = {
  // 1. func NvrApi.list - 查询NVR列表 ✓ 已应用
  // GET /api/nvr?id=1
  list(params?: { id?: number }) {
    return http.get<ApiResponse<NvrList | Nvr>>('/nvr', { params })
  },

  // 2. func NvrApi.create - 创建NVR信息 ✓ 已应用
  // POST /api/nvr
  create(data: {
    name: string
    url: string
    building_id: number
    admin_user?: { name: string; password: string }
    users?: Array<{ name: string; password: string }>
    rtsp_urls?: Array<{ channel: number; url: string }>
  }) {
    return http.post<ApiResponse<Nvr>>('/nvr', data)
  },

  // 3. func NvrApi.update - 更新NVR信息 ✓ 已应用
  // PUT /api/nvr?id=1
  update(
    data: {
      name?: string
      url?: string
      building_id?: number
      admin_user?: { name: string; password: string }
      users?: Array<{ name: string; password: string }>
      rtsp_urls?: Array<{ channel: number; url: string }>
    },
    id: number,
  ) {
    return http.put<ApiResponse<Nvr>>(`/nvr?id=${id}`, data)
  },

  // 4. func NvrApi.remove - 删除NVR信息 ✓ 已应用
  // DELETE /api/nvr
  remove(data: { id: number }) {
    return http.delete<ApiResponse<{ deleted: boolean }>>('/nvr', { data })
  },

  // 5. func NvrApi.updateAdminUser - 更新管理员账户
  // PUT /api/nvr/admin-user
  updateAdminUser(data: { id: number; admin_user: { name: string; password: string } }) {
    return http.put<ApiResponse<Nvr>>('/nvr/admin-user', data)
  },

  // 6. func NvrApi.updateUsers - 更新普通用户列表
  // PUT /api/nvr/users
  updateUsers(data: { id: number; users: Array<{ name: string; password: string }> }) {
    return http.put<ApiResponse<Nvr>>('/nvr/users', data)
  },

  // 7. func NvrApi.addRTSPUrl - 添加RTSP URL
  // POST /api/nvr/rtsp-url
  addRTSPUrl(data: { id: number; url: { channel: number; url: string } }) {
    return http.post<ApiResponse<Nvr>>('/nvr/rtsp-url', data)
  },

  // 8. func NvrApi.removeRTSPUrl - 删除RTSP URL
  // DELETE /api/nvr/rtsp-url
  removeRTSPUrl(data: { id: number; channel: number }) {
    return http.delete<ApiResponse<Nvr>>('/nvr/rtsp-url', { data })
  },

  // 9. func NvrApi.addUser - 添加用户
  // POST /api/nvr/user
  addUser(data: { id: number; user: { name: string; password: string } }) {
    return http.post<ApiResponse<Nvr>>('/nvr/user', data)
  },

  // 10. func NvrApi.removeUser - 删除用户
  // DELETE /api/nvr/user
  removeUser(data: { id: number; username: string }) {
    return http.delete<ApiResponse<Nvr>>('/nvr/user', { data })
  },
}

