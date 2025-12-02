import { http } from '../index'
import type { ApiResponse } from './types'
import type {
  OrangePiRemoteHealth,
  OrangePiRemoteInfo,
  OrangePiRemotePortsResult,
  MediaMTXPathsResponse,
  MediaMTXPathDetail,
  MediaMTXPathOperationResult,
} from '../../model/orangepi'

// 方法索引列表
// 1. func OrangePiRemoteApi.updatePorts - 远程端口更新
// 2. func OrangePiRemoteApi.getInfo - 查询远程设备信息
// 3. func OrangePiRemoteApi.getHealth - 远程健康检查
// 4. func OrangePiRemoteApi.listPaths - 列出 MediaMTX paths
// 5. func OrangePiRemoteApi.getPathDetail - 查询单个 path
// 6. func OrangePiRemoteApi.addPath - 新增 path
// 7. func OrangePiRemoteApi.updatePath - 更新 path
// 8. func OrangePiRemoteApi.deletePath - 删除 path

export const OrangePiRemoteApi = {
  // 1. func OrangePiRemoteApi.updatePorts - 远程端口更新
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

  // 2. func OrangePiRemoteApi.getInfo - 查询远程设备信息
  // GET /api/orangepi/remote/info?id=1&token=xxx
  getInfo(id: number, token: string) {
    return http.get<ApiResponse<OrangePiRemoteInfo>>(`/orangepi/remote/info?id=${id}&token=${token}`)
  },

  // 3. func OrangePiRemoteApi.getHealth - 远程健康检查
  // GET /api/orangepi/remote/health?id=1
  getHealth(id: number) {
    return http.get<ApiResponse<OrangePiRemoteHealth>>(
      `/orangepi/remote/health?id=${id}`,
    )
  },

  // 4. func OrangePiRemoteApi.listPaths - 列出 MediaMTX paths
  // GET /api/orangepi/remote/paths?id=1&token=xxx&page=0&items_per_page=50
  listPaths(data: {
    id: number
    token: string
    page?: number
    items_per_page?: number
  }) {
    const page = data.page ?? 0
    const itemsPerPage = data.items_per_page ?? 50
    return http.get<ApiResponse<MediaMTXPathsResponse>>(
      `/orangepi/remote/paths?id=${data.id}&token=${data.token}&page=${page}&items_per_page=${itemsPerPage}`,
    )
  },

  // 5. func OrangePiRemoteApi.getPathDetail - 查询单个 path
  // GET /api/orangepi/remote/paths/detail?id=1&token=xxx&name=channel1
  getPathDetail(data: { id: number; token: string; name: string }) {
    return http.get<ApiResponse<MediaMTXPathDetail>>(
      `/orangepi/remote/paths/detail?id=${data.id}&token=${data.token}&name=${data.name}`,
    )
  },

  // 6. func OrangePiRemoteApi.addPath - 新增 path
  // POST /api/orangepi/remote/paths?id=1&token=xxx
  addPath(data: {
    id: number
    token: string
    name: string
    config: {
      source: string
      sourceOnDemand?: boolean
      record?: boolean
      recordPath?: string
      recordPartDuration?: string
      [key: string]: any
    }
  }) {
    return http.post<ApiResponse<MediaMTXPathOperationResult>>(
      `/orangepi/remote/paths?id=${data.id}&token=${data.token}`,
      {
        name: data.name,
        config: data.config,
      },
    )
  },

  // 7. func OrangePiRemoteApi.updatePath - 更新 path
  // PATCH /api/orangepi/remote/paths?id=1&token=xxx&name=channel1
  updatePath(data: {
    id: number
    token: string
    name: string
    config: {
      [key: string]: any
    }
  }) {
    return http.patch<ApiResponse<MediaMTXPathOperationResult>>(
      `/orangepi/remote/paths?id=${data.id}&token=${data.token}&name=${data.name}`,
      {
        config: data.config,
      },
    )
  },

  // 8. func OrangePiRemoteApi.deletePath - 删除 path
  // DELETE /api/orangepi/remote/paths?id=1&token=xxx&name=channel1
  deletePath(data: { id: number; token: string; name: string }) {
    return http.delete<ApiResponse<MediaMTXPathOperationResult>>(
      `/orangepi/remote/paths?id=${data.id}&token=${data.token}&name=${data.name}`,
    )
  },
}

