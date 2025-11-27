import type { ModelFields, PaginatedResult } from './base'
import type { Device } from './device'
import type { Nvr } from './nvr'

export interface Building extends ModelFields {
  ismartid: string
  name: string
  remark?: string
  orangepis?: Device[]
  nvrs?: Nvr[]
}

export type BuildingList = PaginatedResult<Building>


