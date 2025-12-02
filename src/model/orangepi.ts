export interface OrangePiRemotePortsResult {
  updated: boolean
  ssh_port: number
  auth_port: number
}

export interface OrangePiRemoteInfo {
  device_id: string
  mediamtx_version: string
  frpc_server: string
  frpc_auth_remote_port: number
  frpc_ssh_remote_port: number
  frpc_auth_proxy_name?: string
  frpc_ssh_proxy_name?: string
  available_channels: string[]
  status: string
}

export interface OrangePiRemoteHealth {
  status: string
  service: string
  docker_services?: {
    [key: string]: boolean
  }
}

export interface MediaMTXPath {
  name: string
  ready: boolean
  confName: string
  readyTime?: string
  source?: string  // RTSP URL
}

export interface MediaMTXPathDetail {
  name: string
  conf: {
    source?: string
    sourceOnDemand?: boolean
    record?: boolean
    recordPath?: string
    recordPartDuration?: string
    [key: string]: any
  }
}

export interface MediaMTXPathsResponse {
  items: MediaMTXPath[]
  itemsPage: number
  itemsTotal: number
}

export interface MediaMTXPathOperationResult {
  action: string
  name: string
  status_code: number
  mediamtx_response: any
}

export interface PublicTokenResponse {
  token: string
  orangepis: Array<{
    orangepi_id: number
    orangepi_name: string
    urls: string[]
  }>
}


