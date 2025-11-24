import type { ModelFields, PaginatedResult } from './base'

export interface Building extends ModelFields {
  ismartid: string
  name: string
  remark?: string
}

export type BuildingList = PaginatedResult<Building>


