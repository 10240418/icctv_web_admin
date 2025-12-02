import { http } from '../index'
import type { ApiResponse } from './types'
import type { Device, DeviceStats } from '../../model/device'

// 方法索引列表
// 1. func DeviceApi.list - 查询OrangePi设备 ✓ 已应用
// 2. func DeviceApi.create - 创建OrangePi设备 ✓ 已应用
// 3. func DeviceApi.update - 更新OrangePi设备 ✓ 已应用
// 4. func DeviceApi.remove - 删除OrangePi设备 ✓ 已应用
// 5. func DeviceApi.getInfo - 设备汇总信息

export const DeviceApi = {
  // 1. func DeviceApi.list - 查询OrangePi设备 ✓ 已应用
  // GET /api/device?ismartid=ismart_001
  list(params?: { ismartid?: string }) {
    return http.get<ApiResponse<Device[]>>('/device', { params })
  },

  // 2. func DeviceApi.create - 创建OrangePi设备 ✓ 已应用
  // POST /api/device
  create(data: {
    ismartid: string
    name: string
    icctv_auth_service_remote_port: number
    ssh_remote_port: number
    is_active?: boolean
    user_channels?: number[]
    all_channels?: number[]
  }) {
    return http.post<ApiResponse<Device>>('/device', data)
  },

  // 3. func DeviceApi.update - 更新OrangePi设备 ✓ 已应用
  // PUT /api/device?id=1
  update(
    data: {
      ismartid?: string
      name?: string
      icctv_auth_service_remote_port?: number
      ssh_remote_port?: number
      is_active?: boolean
      user_channels?: number[]
      all_channels?: number[]
    },
    id: number,
  ) {
    return http.put<ApiResponse<Device>>(`/device?id=${id}`, data)
  },

  // 4. func DeviceApi.remove - 删除OrangePi设备 ✓ 已应用
  // DELETE /api/device
  remove(data: { id: number }) {
    return http.delete<ApiResponse<{ deleted: boolean }>>('/device', { data })
  },
}

export const DeviceStatsApi = {
  // 5. func DeviceStatsApi.getInfo - 设备汇总信息
  // GET /api/device/info
  getInfo() {
    return http.get<ApiResponse<DeviceStats>>('/device/info')
  },
}

