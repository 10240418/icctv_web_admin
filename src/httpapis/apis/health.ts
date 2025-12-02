import axios from 'axios'

// 方法索引列表
// 1. func HealthApi.check - 检查后端服务健康状态 ✓ 已应用

export const HealthApi = {
  // 1. func HealthApi.check - 检查后端服务健康状态 ✓ 已应用
  // GET /health
  check() {
    return axios.get<string>('/health')
  },
}

