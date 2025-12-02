import { http } from '../index'
import type { ApiResponse } from './types'
import type { Building } from '../../model/building'

// 方法索引列表
// 1. func BuildingApi.list - 查询建筑列表 ✓ 已应用
// 2. func BuildingApi.create - 创建建筑信息 ✓ 已应用
// 3. func BuildingApi.update - 更新建筑信息 ✓ 已应用
// 4. func BuildingApi.remove - 删除建筑信息 ✓ 已应用

export const BuildingApi = {
  // 1. func BuildingApi.list - 查询建筑列表 ✓ 已应用
  // GET /api/building
  list() {
    return http.get<ApiResponse<Building[]>>('/building')
  },

  // 2. func BuildingApi.create - 创建建筑信息 ✓ 已应用
  // POST /api/building
  create(data: { ismartid: string; name: string; remark?: string }) {
    return http.post<ApiResponse<Building>>('/building', data)
  },

  // 3. func BuildingApi.update - 更新建筑信息 ✓ 已应用
  // PUT /api/building?id=1
  update(data: { ismartid: string; name: string; remark?: string }, id: number) {
    return http.put<ApiResponse<Building>>(`/building?id=${id}`, data)
  },

  // 4. func BuildingApi.remove - 删除建筑信息 ✓ 已应用
  // DELETE /api/building
  remove(data: { id: number }) {
    return http.delete<ApiResponse<{ deleted: boolean }>>('/building', { data })
  },
}

