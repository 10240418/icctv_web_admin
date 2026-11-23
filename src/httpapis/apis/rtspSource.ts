import { http } from '../index'
import type { ApiResponse } from './types'
import type { RTSPSource, RTSPSourceInput } from '@/model/rtspSource'

export const RTSPSourceApi = {
  list() {
    return http.get<ApiResponse<RTSPSource[]>>('/rtsp-sources')
  },
  create(data: RTSPSourceInput) {
    return http.post<ApiResponse<RTSPSource>>('/rtsp-sources', data)
  },
  update(id: number, data: RTSPSourceInput & { expected_version: string; confirmed_groups: number[] }) {
    return http.put<ApiResponse<{ source: RTSPSource; sync_errors: string[] }>>(`/rtsp-sources?id=${id}`, data, { timeout: 120_000 })
  },
  remove(id: number) {
    return http.delete<ApiResponse<{ deleted: boolean }>>(`/rtsp-sources?id=${id}`)
  },
}
