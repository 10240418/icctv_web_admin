import type { ModelFields, PaginatedResult } from './base'
import type { Building } from './building'
import type { Device } from './device'

export interface Nvr extends ModelFields {
  name: string
  url: string
  building_id: number
  orangepi_id: number
  building?: Building
  orangepi?: Device
  admin_user: {
    name: string
    password: string
  }
  users: Array<{
    name: string
    password: string
  }>
  rtsp_urls: Array<{
    channel?: number
    id?: string
    source_id?: number
    path?: string
    url: string
    remark?: string
    visible?: boolean
    sync_status?: string
    sync_error?: string
    synced_at?: string
    synced_orangepi_id?: number
  }>
}

export type NvrList = PaginatedResult<Nvr>


