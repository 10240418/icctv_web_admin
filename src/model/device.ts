import type { ModelFields, PaginatedResult } from './base'

export interface Device extends ModelFields {
  ismartid: string
  name: string
  icctv_auth_service_remote_port: number
  ssh_remote_port: number
  is_active: boolean
}

export type DeviceList = PaginatedResult<Device>

export interface DeviceStats {
  totalDevices: number
  activeDevices: number
  buildingBounded: number
  lastSync: string
}


