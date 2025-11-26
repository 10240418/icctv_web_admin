import axios from 'axios'
import { http } from './index'
import type { Admin, AdminList } from '../model/admin'
import type { Device, DeviceStats } from '../model/device'
import type { Building } from '../model/building'
import type { PublicNetConfig } from '../model/publicNet'
import type {
  OrangePiRemotePortsResult,
  OrangePiRemoteInfo,
  OrangePiRemoteHealth,
} from '../model/orangepi'
import type { Nvr, NvrList } from '../model/nvr'

// 方法索引列表
// 1. func AdminApi.list - 获取管理员列表（支持分页和按ID查询）
// 2. func AdminApi.create - 创建管理员
// 3. func AdminApi.update - 更新管理员信息
// 4. func AdminApi.remove - 删除管理员
// 5. func DeviceApi.list - 获取设备列表（支持按ismartid过滤）
// 6. func DeviceApi.create - 创建设备
// 7. func DeviceApi.update - 更新设备信息
// 8. func DeviceApi.remove - 删除设备
// 9. func DeviceApi.getInfo - 获取设备信息统计
// 10. func BuildingApi.list - 获取建筑列表
// 11. func BuildingApi.create - 创建建筑
// 12. func BuildingApi.update - 更新建筑信息
// 13. func BuildingApi.remove - 删除建筑
// 14. func BuildingBindApi.bind - 绑定OrangePi到建筑
// 15. func BuildingBindApi.unbind - 解绑OrangePi设备
// 16. func BuildingBindApi.updateBind - 更新OrangePi绑定关系
// 17. func OrangePiRemoteApi.updatePorts - 远程更新OrangePi端口
// 18. func OrangePiRemoteApi.getInfo - 远程获取OrangePi设备信息
// 19. func OrangePiRemoteApi.getHealth - 远程检查OrangePi健康状态
// 20. func PublicNetApi.update - 修改公网配置
// 21. func AuthApi.login - 管理员登录获取JWT Token
// 22. func HealthApi.check - 检查后端服务健康状态
// 23. func NvrApi.list - 获取NVR列表或单条详情
// 24. func NvrApi.create - 创建NVR信息
// 25. func NvrApi.update - 更新NVR信息
// 26. func NvrApi.remove - 删除NVR信息

// 通用响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  error?: string
}

// 管理员API
export const AdminApi = {
  // 1. func AdminApi.list - 获取管理员列表（支持分页和按ID查询）
  // GET /api/admin?pageNum=1&pageSize=20&id=1
  list(params?: { pageNum?: number; pageSize?: number; id?: number }) {
    return http.get<ApiResponse<AdminList | Admin>>('/admin', { params })
  },

  // 2. func AdminApi.create - 创建管理员
  // POST /api/admin
  create(data: { username: string; password: string }) {
    return http.post<ApiResponse<Admin>>('/admin', data)
  },

  // 3. func AdminApi.update - 更新管理员信息
  // PUT /api/admin
  update(data: { id: number; username?: string; password?: string }) {
    return http.put<ApiResponse<Admin>>('/admin', data)
  },

  // 4. func AdminApi.remove - 删除管理员
  // DELETE /api/admin
  remove(data: { id: number }) {
    return http.delete<ApiResponse<{ deleted: boolean }>>('/admin', { data })
  },
}

// 设备API
export const DeviceApi = {
  // 5. func DeviceApi.list - 获取设备列表（支持按ismartid过滤）
  // GET /api/device?ismartid=ismart_001
  list(params?: { ismartid?: string }) {
    return http.get<ApiResponse<Device[]>>('/device', { params })
  },

  // 6. func DeviceApi.create - 创建设备
  // POST /api/device
  create(data: {
    ismartid: string
    name: string
    icctv_auth_service_remote_port: number
    ssh_remote_port: number
    is_active?: boolean
  }) {
    return http.post<ApiResponse<Device>>('/device', data)
  },

  // 7. func DeviceApi.update - 更新设备信息
  // PUT /api/device?id=2
  update(data: {
    ismartid?: string
    name?: string
    icctv_auth_service_remote_port?: number
    ssh_remote_port?: number
    is_active?: boolean
  }, id: number) {
    return http.put<ApiResponse<Device>>(`/device?id=${id}`, data)
  },

  // 8. func DeviceApi.remove - 删除设备
  // DELETE /api/device
  remove(data: { id: number }) {
    return http.delete<ApiResponse<{ deleted: boolean }>>('/device', { data })
  },

  // 9. func DeviceApi.getInfo - 获取设备信息统计
  // GET /api/device/info
  getInfo() {
    return http.get<ApiResponse<DeviceStats>>('/device/info')
  },
}

// 建筑API
export const BuildingApi = {
  // 10. func BuildingApi.list - 获取建筑列表
  // GET /api/building
  list() {
    return http.get<ApiResponse<Building[]>>('/building')
  },

  // 11. func BuildingApi.create - 创建建筑
  // POST /api/building
  create(data: {
    ismartid: string
    name: string
    remark?: string
  }) {
    return http.post<ApiResponse<Building>>('/building', data)
  },

  // 12. func BuildingApi.update - 更新建筑信息
  // PUT /api/building?id=2
  update(data: {
    ismartid: string
    name: string
    remark?: string
  }, id: number) {
    return http.put<ApiResponse<Building>>(`/building?id=${id}`, data)
  },

  // 13. func BuildingApi.remove - 删除建筑
  // DELETE /api/building
  remove(data: { id: number }) {
    return http.delete<ApiResponse<{ deleted: boolean }>>('/building', { data })
  },
}

// 建筑绑定API
export const BuildingBindApi = {
  // 14. func BuildingBindApi.bind - 绑定OrangePi到建筑
  // POST /api/building/bind
  bind(data: { building_id: number; orangepi_id: number }) {
    return http.post<ApiResponse<{ bound: boolean }>>('/building/bind', data)
  },

  // 15. func BuildingBindApi.unbind - 解绑OrangePi设备
  // POST /api/building/unbind
  unbind(data: { orangepi_id: number }) {
    return http.post<ApiResponse<{ unbound: boolean }>>('/building/unbind', data)
  },

  // 16. func BuildingBindApi.updateBind - 更新OrangePi绑定关系
  // PUT /api/building/bind
  updateBind(data: { orangepi_id: number; new_building_id: number }) {
    return http.put<ApiResponse<{ updated: boolean }>>('/building/bind', data)
  },
}

// OrangePi远程管理API
export const OrangePiRemoteApi = {
  // 17. func OrangePiRemoteApi.updatePorts - 远程更新OrangePi端口
  // POST /api/orangepi/remote/ports
  updatePorts(data: {
    id: number
    ssh_remote_port: number
    icctv_auth_service_remote_port: number
  }) {
    return http.post<ApiResponse<OrangePiRemotePortsResult>>(
      '/orangepi/remote/ports',
      data,
    )
  },

  // 18. func OrangePiRemoteApi.getInfo - 远程获取OrangePi设备信息
  // GET /api/orangepi/remote/info?id=1
  getInfo(id: number) {
    return http.get<ApiResponse<OrangePiRemoteInfo>>(`/orangepi/remote/info?id=${id}`)
  },

  // 19. func OrangePiRemoteApi.getHealth - 远程检查OrangePi健康状态
  // GET /api/orangepi/remote/health?id=1
  getHealth(id: number) {
    return http.get<ApiResponse<OrangePiRemoteHealth>>(`/orangepi/remote/health?id=${id}`)
  },
}

// 公网配置API
export const PublicNetApi = {
  // 20. func PublicNetApi.update - 修改公网配置
  // PUT /api/publicnet/config
  update(config: { external_ip: string }) {
    return http.put<ApiResponse<PublicNetConfig>>('/publicnet/config', config)
  },
}

// 认证API
export const AuthApi = {
  // 21. func AuthApi.login - 管理员登录获取JWT Token
  // POST /api/auth/login
  login(data: { username: string; password: string }) {
    return http.post<ApiResponse<{ accessToken: string; expiresAt: string }>>(
      '/auth/login',
      data,
    )
  },
}

// 健康检查API
export const HealthApi = {
  // 22. func HealthApi.check - 检查后端服务健康状态
  // GET /health
  check() {
    // 使用独立的 axios 实例，避免附加 /api 前缀
    return axios.get<string>('/health')
  },
}

// NVR 管理API
export const NvrApi = {
  // 23. func NvrApi.list - 获取NVR列表或单条详情
  // GET /api/nvr?id=1
  list(params?: { id?: number }) {
    return http.get<ApiResponse<NvrList | Nvr>>('/nvr', { params })
  },

  // 24. func NvrApi.create - 创建NVR信息
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

  // 25. func NvrApi.update - 更新NVR信息
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

  // 26. func NvrApi.remove - 删除NVR信息
  // DELETE /api/nvr
  remove(data: { id: number }) {
    return http.delete<ApiResponse<{ deleted: boolean }>>('/nvr', { data })
  },
}





