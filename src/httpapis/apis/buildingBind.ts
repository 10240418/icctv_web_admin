import { http } from '../index'
import type { ApiResponse } from './types'
import type { Device } from '../../model/device'

// 方法索引列表
// 1. func BuildingBindApi.bind - 绑定OrangePi到建筑 ✓ 已应用
// 2. func BuildingBindApi.unbind - 解绑OrangePi ✓ 已应用
// 3. func BuildingBindApi.getByBuilding - 获取建筑关联的OrangePi ✓ 已应用

export const BuildingBindApi = {
  // 1. func BuildingBindApi.bind - 绑定OrangePi到建筑 ✓ 已应用
  // POST /api/bind/building-orangepi
  bind(data: { building_id: number; orangepi_id: number }) {
    return http.post<ApiResponse<{ bound: boolean }>>('/bind/building-orangepi', data)
  },

  // 2. func BuildingBindApi.unbind - 解绑OrangePi ✓ 已应用
  // DELETE /api/bind/building-orangepi
  unbind(data: { orangepi_id: number }) {
    return http.delete<ApiResponse<{ unbound: boolean }>>('/bind/building-orangepi', {
      data,
    })
  },

  // 3. func BuildingBindApi.getByBuilding - 获取建筑关联的OrangePi ✓ 已应用
  // GET /api/bind/building-orangepi/{building_id}
  // 返回完整的 Device 对象数组
  getByBuilding(buildingId: number) {
    return http.get<ApiResponse<Device[]>>(
      `/bind/building-orangepi/${buildingId}`,
    )
  },
}

