import type { ModelFields, PaginatedResult } from './base'

export interface Nvr extends ModelFields {
  name: string
  url: string
  building_id: number
  admin_user: {
    name: string
    password: string
  }
  users: Array<{
    name: string
    password: string
  }>
  rtsp_urls: Array<{
    channel: number
    url: string
  }>
}

export type NvrList = PaginatedResult<Nvr>



