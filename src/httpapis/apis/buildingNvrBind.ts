import { http } from '../index'
import type { ApiResponse } from './types'
import type { Nvr } from '../../model/nvr'

// 方法索引列表
// 1. func BuildingNvrBindApi.bind - 绑定NVR到建筑 ✓ 已应用
// 2. func BuildingNvrBindApi.unbind - 解绑NVR ✓ 已应用
// 3. func BuildingNvrBindApi.getByBuilding - 获取建筑关联的NVR ✓ 已应用

export const BuildingNvrBindApi = {
  // 1. func BuildingNvrBindApi.bind - 绑定NVR到建筑 ✓ 已应用
  // POST /api/bind/building-nvr
  bind(data: { building_id: number; nvr_id: number }) {
    return http.post<ApiResponse<{ bound: boolean }>>('/bind/building-nvr', data)
  },

  // 2. func BuildingNvrBindApi.unbind - 解绑NVR ✓ 已应用
  // DELETE /api/bind/building-nvr
  unbind(data: { nvr_id: number }) {
    return http.delete<ApiResponse<{ unbound: boolean }>>('/bind/building-nvr', {
      data,
    })
  },

  // 3. func BuildingNvrBindApi.getByBuilding - 获取建筑关联的NVR ✓ 已应用
  // GET /api/bind/building-nvr/{building_id}
  // 返回完整的 Nvr 对象数组
  getByBuilding(buildingId: number) {
    return http.get<ApiResponse<Nvr[]>>(
      `/bind/building-nvr/${buildingId}`,
    )
  },
}

