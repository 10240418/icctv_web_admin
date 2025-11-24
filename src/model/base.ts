export interface ModelFields {
  id: number
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export interface PageMeta {
  total: number
  current: number
  size: number
}

export interface PaginatedResult<T> {
  items: T[]
  page: PageMeta
}


