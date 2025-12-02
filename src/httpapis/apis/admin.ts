import { http } from '../index'
import type { ApiResponse } from './types'
import type { Admin, AdminList } from '../../model/admin'

// 方法索引列表
// 1. func AdminApi.list - 查询管理员列表 ✓ 已应用
// 2. func AdminApi.create - 创建管理员 ✓ 已应用
// 3. func AdminApi.update - 更新管理员 ✓ 已应用
// 4. func AdminApi.remove - 删除管理员 ✓ 已应用

export const AdminApi = {
  // 1. func AdminApi.list - 查询管理员列表 ✓ 已应用
  // GET /api/admin?pageNum=1&pageSize=20&id=1&username=alice
  list(params?: {
    pageNum?: number
    pageSize?: number
    id?: number
    username?: string
  }) {
    return http.get<ApiResponse<AdminList | Admin>>('/admin', { params })
  },

  // 2. func AdminApi.create - 创建管理员 ✓ 已应用
  // POST /api/admin
  create(data: { username: string; password: string }) {
    return http.post<ApiResponse<Admin>>('/admin', data)
  },

  // 3. func AdminApi.update - 更新管理员 ✓ 已应用
  // PUT /api/admin
  update(data: { id: number; username?: string; password?: string }) {
    return http.put<ApiResponse<Admin>>('/admin', data)
  },

  // 4. func AdminApi.remove - 删除管理员 ✓ 已应用
  // DELETE /api/admin
  remove(data: { id: number }) {
    return http.delete<ApiResponse<{ deleted: boolean }>>('/admin', { data })
  },
}

