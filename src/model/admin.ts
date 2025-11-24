import type { ModelFields, PaginatedResult } from './base'

export interface Admin extends ModelFields {
  username: string
  passwordHash?: string
}

export type AdminList = PaginatedResult<Admin>


