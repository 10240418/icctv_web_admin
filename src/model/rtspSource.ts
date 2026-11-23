import type { ModelFields } from './base'
import type { Building } from './building'

export interface RTSPSource extends ModelFields {
  url: string
  remark: string
  building_id: number
  building?: Building
  usages: Array<{
    group_id: number
    group_name: string
    path: string
    building_id: number
    orangepi_id: number
  }>
}

export interface RTSPSourceInput {
  url: string
  remark: string
  building_id: number
}
