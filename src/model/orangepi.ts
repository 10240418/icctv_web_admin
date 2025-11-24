export interface OrangePiRemotePortsResult {
  updated: boolean
  ssh_port: number
  auth_port: number
}

export interface OrangePiRemoteInfo {
  hostname: string
  ip_address: string
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  uptime: string
  last_update: string
}

export interface OrangePiRemoteHealth {
  status: string
  response_time: string
  services: {
    icctv_auth_service: string
    mediamtx: string
    frpc: string
  }
  last_check: string
}


