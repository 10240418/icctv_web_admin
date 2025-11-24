# OrangePi 后台管理系统 - HTTP Service API 文档

## 项目简介

本项目是一个基于 Go 语言开发的 OrangePi 设备后台管理系统的 HTTP 服务端，提供设备管理、建筑信息管理、公网配置等功能。

**服务地址**：`http://127.0.0.1:8080`

---

## 📋 完整 API 接口列表

### 核心管理接口

| 编号 | 接口 | 方法 | 功能 | 使用场景 | 权限要求 |
|------|------|------|------|----------|----------|
| 1 | `/health`            | GET | 健康检查 | 应用启动时检查服务状态 | 无 |
| 2 | `/api/auth/public`   | POST | 生成视频访问Token | 视频播放器获取MediaMTX授权 | 无 |
| 3 | `/api/auth/login`    | POST | 管理员登录 | 后台管理系统登录 | 用户名密码 |

| 4 | `/api/admin` | GET | 查询管理员列表/详情 | 超级管理员 |
| 5 | `/api/admin` | POST | 创建管理员账户 | 超级管理员 |
| 6 | `/api/admin` | PUT | 更新管理员信息 | 超级管理员 |
| 7 | `/api/admin` | DELETE | 删除管理员账户 | 超级管理员 |

| 8 | `/api/device`  | GET | 查询OrangePi设备列表/详情 | 管理员 |
| 9 | `/api/device`  | POST | 创建OrangePi设备记录 | 管理员 |
| 10 | `/api/device` | PUT | 更新OrangePi设备信息 | 管理员 |
| 11 | `/api/device` | DELETE | 删除OrangePi设备记录 | 管理员 |

| 12 | `/api/building` | GET | 查询建筑列表/详情 | 管理员 |
| 13 | `/api/building` | POST | 创建建筑信息 | 管理员 |
| 14 | `/api/building` | PUT | 更新建筑信息 | 管理员 |
| 15 | `/api/building` | DELETE | 删除建筑信息 | 管理员 |

| 16 | `/api/building/bind`    | POST | 绑定OrangePi到建筑 | 管理员 |
| 17 | `/api/building/unbind`  | POST | 解绑OrangePi设备 | 管理员 |
| 18 | `/api/building/bind`    | PUT | 更新OrangePi绑定关系 | 管理员 |

| 19 | `/api/orangepi/remote/ports`  | POST | 远程更新OrangePi端口 | 管理员 |
| 20 | `/api/orangepi/remote/info`   | GET | 远程获取OrangePi设备信息 | 管理员 |
| 21 | `/api/orangepi/remote/health` | GET | 远程检查OrangePi健康状态 | 管理员 |

| 22 | `/api/device/info`      | GET | 获取设备信息 | 操作员 |
| 23 | `/api/publicnet/config` | PUT | 修改公网配置 | 管理员 |

---

## 核心接口

### 1. 健康检查

#### 接口信息

```http
GET /health
```

#### 测试命令（PowerShell）

```powershell
$response = Invoke-RestMethod -Uri "http://127.0.0.1:8080/health" -Method Get
Write-Host $response
```

#### 响应示例

```
ok
```

---

### 2. 生成视频访问 Token

#### 接口信息

```http
POST /api/auth/public
Content-Type: application/json
```

#### 请求参数

```json
{
  "building_id": "ismart_001",            // 必填 建筑ISmartID
  "channels": ["channel1", "channel2"]    // 必填 可访问的频道列表
}
```

#### 测试命令（PowerShell）

```powershell
$body = @{
  building_id = "ismart_001"
  channels = @("channel1", "channel2", "channel3", "channel4", "channel5", "channel6")
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/auth/public" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body

Write-Host ($response | ConvertTo-Json)
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "token": "eyJjaGFubmVscyI6WyJjaGFubmVsMSIsImNoYW5uZWwyIl0sImJ1aWxkaW5nX2lkIjoiYnVpbGRpbmdfYSIsImV4cCI6MTczMTk4MzIwMCwiaWF0IjoxNzMxODk2ODAwfQ.a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z"
  }
}
```

#### 说明

- 该 Token 用于 MediaMTX 视频流播放认证
- Token 有效期为 24 小时
- 使用 HMAC-SHA256 签名格式：`base64(payload).signature`
- Payload 包含：channels（可访问频道）、building_id（建筑ISmartID）、exp（过期时间）、iat（签发时间）

---

### 3. 管理员登录

#### 接口信息

```http
POST /api/auth/login
Content-Type: application/json
```

#### 请求参数

```json
{
  "username": "admin",  // 必填 用户名
  "password": "123456"  // 必填 密码
}
```

#### 测试命令（PowerShell）

```powershell
$body = @{
  username = "admin"
  password = "123456"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body

Write-Host ($response | ConvertTo-Json)
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoxLCJ1c2VybmFtZSI6ImFkbWluIn0...",
    "expiresAt": "2025-11-20T10:00:00Z"
  }
}
```

#### 说明

- 该 Token 用于后台管理系统的身份认证（JWT 格式）
- Token 包含 adminId 和 username 信息
- 后续请求需要在 Authorization 头中包含：`Bearer {accessToken}`
- Token 有效期默认为 120 分钟

---

## 管理员管理

### 4. 查询管理员列表

#### 接口信息

```http
GET /api/admin?pageNum=1&pageSize=20
Authorization: Bearer {token}
```

#### 查询参数

| 参数 | 类型 | 说明 |
|------|------|------|
| pageNum | int | 可选 页码，默认1 |
| pageSize | int | 可选 每页数量，默认20 |
| id | int | 可选 查询单条详情时使用 |

#### 测试命令（PowerShell）

```powershell
# 先获取 JWT Token
$loginBody = @{
  username = "admin"
  password = "123456"
} | ConvertTo-Json

$loginResp = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body $loginBody

$token = $loginResp.data.accessToken

# 查询列表
$headers = @{ "Authorization" = "Bearer $token" }
$response = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/admin?pageNum=1&pageSize=20" `
  -Method Get `
  -Headers $headers

Write-Host ($response | ConvertTo-Json)
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "username": "admin",
        "createdAt": "2025-11-19T10:00:00+08:00",
        "updatedAt": "2025-11-19T10:00:00+08:00"
      }
    ],
    "page": {
      "total": 1,
      "current": 1,
      "size": 20
    }
  }
}
```

---

### 5. 创建管理员

#### 接口信息

```http
POST /api/admin
Content-Type: application/json
Authorization: Bearer {token}
```

#### 请求参数

```json
{
  "username": "newadmin1",  // 必填 用户名
  "password": "admin123" // 必填 密码
}
```

#### 测试命令（PowerShell）

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$body = @{
  username = "newadmin1"
  password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/admin" `
  -Method Post `
  -ContentType "application/json" `
  -Headers $headers `
  -Body $body

Write-Host ($response | ConvertTo-Json)
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": 2,
    "username": "newadmin",
    "createdAt": "2025-11-19T10:30:00+08:00",
    "updatedAt": "2025-11-19T10:30:00+08:00"
  }
}
```

---

### 6. 更新管理员

#### 接口信息

```http
PUT /api/admin
Content-Type: application/json
Authorization: Bearer {token}
```

#### 请求参数

```json
{
  "id": 2,              // 必填 管理员ID
  "username": "admin2",  // 可选 新用户名
  "password": "newpass"  // 可选 新密码
}
```

#### 测试命令（PowerShell）

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$body = @{
  id = 2
  username = "admin2"
  password = "newpass"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/admin" `
  -Method Put `
  -ContentType "application/json" `
  -Headers $headers `
  -Body $body

Write-Host ($response | ConvertTo-Json)
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": 2,
    "username": "admin2",
    "createdAt": "2025-11-19T10:30:00+08:00",
    "updatedAt": "2025-11-19T11:00:00+08:00"
  }
}
```

---

### 7. 删除管理员

#### 接口信息

```http
DELETE /api/admin
Content-Type: application/json
Authorization: Bearer {token}
```

#### 请求参数

```json
{
  "id": 2  // 必填 管理员ID
}
```

#### 测试命令（PowerShell）

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$body = @{
  id = 2
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/admin" `
  -Method Delete `
  -ContentType "application/json" `
  -Headers $headers `
  -Body $body

Write-Host ($response | ConvertTo-Json)
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

---

## 建筑信息管理

### 8. 查询建筑列表

#### 接口信息

```http
GET /api/building
Authorization: Bearer {token}
```

#### 测试命令（PowerShell）

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$response = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/building" `
  -Method Get `
  -Headers $headers

Write-Host ($response | ConvertTo-Json)
```

#### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ismartid": "ismart_001",
      "name": "A栋",
      "remark": "主楼",
      "createdAt": "2025-11-19T10:00:00+08:00",
      "updatedAt": "2025-11-19T10:00:00+08:00"
    }
  ]
}
```

---

### 9. 创建建筑

#### 接口信息

```http
POST /api/building
Content-Type: application/json
Authorization: Bearer {token}
```

#### 请求参数

```json
{
  "ismartid": "ismart_002",   // 必填 ismart系统ID，唯一标识
  "name": "B栋",              // 必填 建筑名称
  "remark": "办公楼"          // 可选 备注
}
```

#### 测试命令（PowerShell）

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$body = @{
  ismartid = "ismart_002"
  name = "B栋"
  remark = "办公楼"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/building" `
  -Method Post `
  -ContentType "application/json" `
  -Headers $headers `
  -Body $body

Write-Host ($response | ConvertTo-Json)
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": 2,
    "ismartid": "ismart_002",
    "name": "B栋",
    "remark": "办公楼",
    "createdAt": "2025-11-19T10:30:00+08:00",
    "updatedAt": "2025-11-19T10:30:00+08:00"
  }
}
```

---

### 10. 更新建筑

#### 接口信息

```http
PUT /api/building?id=2
Content-Type: application/json
Authorization: Bearer {token}
```

#### 请求参数

```json
{
  "ismartid": "ismart_002",
  "name": "B栋新名称",
  "remark": "办公楼更新"
}
```

#### 测试命令（PowerShell）

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$body = @{
  ismartid = "ismart_002"
  name = "B栋新名称"
  remark = "办公楼更新"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/building?id=2" `
  -Method Put `
  -ContentType "application/json" `
  -Headers $headers `
  -Body $body

Write-Host ($response | ConvertTo-Json)
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": 2,
    "ismartid": "ismart_002",
    "name": "B栋新名称",
    "remark": "办公楼更新",
    "createdAt": "2025-11-19T10:30:00+08:00",
    "updatedAt": "2025-11-19T11:00:00+08:00"
  }
}
```

---

### 11. 删除建筑

#### 接口信息

```http
DELETE /api/building
Content-Type: application/json
Authorization: Bearer {token}
```

#### 请求参数

```json
{
  "id": 2  // 必填 建筑ID
}
```

#### 测试命令（PowerShell）

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$body = @{
  id = 2
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/building" `
  -Method Delete `
  -ContentType "application/json" `
  -Headers $headers `
  -Body $body

Write-Host ($response | ConvertTo-Json)
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

---

## Building-OrangePi 绑定管理

### 16. 绑定 OrangePi 到建筑

#### 接口信息

```http
POST /api/building/bind
Content-Type: application/json
Authorization: Bearer {token}
```

#### 请求参数

```json
{
  "building_id": 1,   // 必填 建筑ID
  "orangepi_id": 2    // 必填 OrangePi设备ID
}
```

#### 测试命令（PowerShell）

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$body = @{
  building_id = 1
  orangepi_id = 2
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/building/bind" `
  -Method Post `
  -ContentType "application/json" `
  -Headers $headers `
  -Body $body

Write-Host ($response | ConvertTo-Json)
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "bound": true
  }
}
```

---

### 17. 解绑 OrangePi 设备

#### 接口信息

```http
POST /api/building/unbind
Content-Type: application/json
Authorization: Bearer {token}
```

#### 请求参数

```json
{
  "orangepi_id": 2    // 必填 OrangePi设备ID
}
```

#### 测试命令（PowerShell）

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$body = @{
  orangepi_id = 2
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/building/unbind" `
  -Method Post `
  -ContentType "application/json" `
  -Headers $headers `
  -Body $body

Write-Host ($response | ConvertTo-Json)
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "unbound": true
  }
}
```

---

### 18. 更新 OrangePi 绑定关系

#### 接口信息

```http
PUT /api/building/bind
Content-Type: application/json
Authorization: Bearer {token}
```

#### 请求参数

```json
{
  "orangepi_id": 2,      // 必填 OrangePi设备ID
  "new_building_id": 3   // 必填 新建筑ID
}
```

#### 测试命令（PowerShell）

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$body = @{
  orangepi_id = 2
  new_building_id = 3
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/building/bind" `
  -Method Put `
  -ContentType "application/json" `
  -Headers $headers `
  -Body $body

Write-Host ($response | ConvertTo-Json)
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "updated": true
  }
}
```

---

## OrangePi 设备管理

### 19. 查询设备列表

#### 接口信息

```http
GET /api/device?ismartid={ismartid}
Authorization: Bearer {token}
```

#### 查询参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ismartid | string | 可选 按建筑ismartid过滤 |

#### 测试命令（PowerShell）

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$response = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/device" `
  -Method Get `
  -Headers $headers

Write-Host ($response | ConvertTo-Json)
```

#### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ismartid": "ismart_001",
      "name": "OrangePi-001",
      "icctv_auth_service_remote_port": 30001,
      "ssh_remote_port": 20001,
      "is_active": true,
      "createdAt": "2025-11-19T10:00:00+08:00",
      "updatedAt": "2025-11-19T10:00:00+08:00"
    }
  ]
}
```

---

### 20. 创建设备

#### 接口信息

```http
POST /api/device
Content-Type: application/json
Authorization: Bearer {token}
```

#### 请求参数

```json
{
  "ismartid": "ismart_001",                 // 必填 关联建筑ismartid
  "name": "OrangePi-002",                   // 必填 设备名称
  "icctv_auth_service_remote_port": 30002,  // 必填 远程认证服务端口
  "ssh_remote_port": 20002,                 // 必填 SSH远程端口
  "is_active": true                         // 可选 是否激活，默认true
}
```

#### 测试命令（PowerShell）

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$body = @{
  ismartid = "ismart_001"
  name = "OrangePi-002"
  icctv_auth_service_remote_port = 30002
  ssh_remote_port = 20002
  is_active = $true
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/device" `
  -Method Post `
  -ContentType "application/json" `
  -Headers $headers `
  -Body $body

Write-Host ($response | ConvertTo-Json)
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": 2,
    "ismartid": "ismart_001",
    "name": "OrangePi-002",
    "icctv_auth_service_remote_port": 30002,
    "ssh_remote_port": 20002,
    "is_active": true,
    "createdAt": "2025-11-19T10:30:00+08:00",
    "updatedAt": "2025-11-19T10:30:00+08:00"
  }
}
```

---

### 21. 更新设备

#### 接口信息

```http
PUT /api/device?id=2
Content-Type: application/json
Authorization: Bearer {token}
```

#### 请求参数

```json
{
  "ismartid": "ismart_001",
  "name": "OrangePi-002-Updated",
  "icctv_auth_service_remote_port": 30002,
  "ssh_remote_port": 20002,
  "is_active": true
}
```

#### 测试命令（PowerShell）

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$body = @{
  ismartid = "ismart_001"
  name = "OrangePi-002-Updated"
  icctv_auth_service_remote_port = 30002
  ssh_remote_port = 20002
  is_active = $true
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/device?id=2" `
  -Method Put `
  -ContentType "application/json" `
  -Headers $headers `
  -Body $body

Write-Host ($response | ConvertTo-Json)
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": 2,
    "ismartid": "ismart_001",
    "name": "OrangePi-002-Updated",
    "icctv_auth_service_remote_port": 30002,
    "ssh_remote_port": 20002,
    "is_active": true,
    "createdAt": "2025-11-19T10:30:00+08:00",
    "updatedAt": "2025-11-19T11:00:00+08:00"
  }
}
```

---

### 22. 删除设备

#### 接口信息

```http
DELETE /api/device
Content-Type: application/json
Authorization: Bearer {token}
```

#### 请求参数

```json
{
  "id": 2  // 必填 设备ID
}
```

#### 测试命令（PowerShell）

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$body = @{
  id = 2
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/device" `
  -Method Delete `
  -ContentType "application/json" `
  -Headers $headers `
  -Body $body

Write-Host ($response | ConvertTo-Json)
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

---

## OrangePi 远程管理

### 23. 远程更新 OrangePi 端口

#### 接口信息

```http
POST /api/orangepi/remote/ports
Content-Type: application/json
Authorization: Bearer {token}
```

#### 请求参数

```json
{
  "id": 1,                                  // 必填 OrangePi设备ID
  "ssh_remote_port": 20001,                 // 必填 新的SSH远程端口
  "icctv_auth_service_remote_port": 30001   // 必填 新的认证服务远程端口
}
```

#### 测试命令（PowerShell）

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$body = @{
  id = 1
  ssh_remote_port = 20001
  icctv_auth_service_remote_port = 30001
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/orangepi/remote/ports" `
  -Method Post `
  -ContentType "application/json" `
  -Headers $headers `
  -Body $body

Write-Host ($response | ConvertTo-Json)
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "updated": true,
    "ssh_port": 20001,
    "auth_port": 30001
  }
}
```

---

### 24. 远程获取 OrangePi 设备信息

#### 接口信息

```http
GET /api/orangepi/remote/info?id={id}
Authorization: Bearer {token}
```

#### 查询参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | int | 必填 OrangePi设备ID |

#### 测试命令（PowerShell）

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$response = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/orangepi/remote/info?id=1" `
  -Method Get `
  -Headers $headers

Write-Host ($response | ConvertTo-Json)
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "hostname": "orangepi-001",
    "ip_address": "192.168.1.100",
    "cpu_usage": 15.2,
    "memory_usage": 45.8,
    "disk_usage": 32.1,
    "uptime": "5 days, 3 hours",
    "last_update": "2025-11-20T15:30:00+08:00"
  }
}
```

#### 注意事项

- 🔄 该接口会通过公网IP和设备端口远程调用OrangePi设备
- 📝 需要OrangePi设备在线且网络可达
- ⏱️ 请求超时时间为30秒

---

### 25. 远程检查 OrangePi 健康状态

#### 接口信息

```http
GET /api/orangepi/remote/health?id={id}
Authorization: Bearer {token}
```

#### 查询参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | int | 必填 OrangePi设备ID |

#### 测试命令（PowerShell）

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$response = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/orangepi/remote/health?id=1" `
  -Method Get `
  -Headers $headers

Write-Host ($response | ConvertTo-Json)
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "response_time": "45ms",
    "services": {
      "icctv_auth_service": "running",
      "mediamtx": "running",
      "frpc": "running"
    },
    "last_check": "2025-11-20T15:35:00+08:00"
  }
}
```

#### 注意事项

- 🆔 该接口用于快速检查OrangePi设备是否在线
- 🔄 会检查关键服务的运行状态
- ✅ 响应时间超过5秒视为不健康

---

## 设备信息与网络配置

### 26. 获取设备信息

#### 接口信息

```http
GET /api/device/info
Authorization: Bearer {token}
```

#### 测试命令（PowerShell）

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$response = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/device/info" `
  -Method Get `
  -Headers $headers

Write-Host ($response | ConvertTo-Json)
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "totalDevices": 5,
    "activeDevices": 4,
    "buildingBounded": 3,
    "lastSync": "2025-11-20T13:08:42.3339963+08:00"
  }
}
```

---

### 27. 更新公网配置

#### 接口信息

```http
PUT /api/publicnet/config
Content-Type: application/json
Authorization: Bearer {token}
```

#### 请求参数

```json
{
  "external_ip": "203.0.113.0"  // 必填 公网出口IP
}
```

#### 测试命令（PowerShell）

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$body = @{
  external_ip = "203.0.113.0"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/publicnet/config" `
  -Method Put `
  -ContentType "application/json" `
  -Headers $headers `
  -Body $body

Write-Host ($response | ConvertTo-Json)
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": 1,
    "external_ip": "203.0.113.0",
    "createdAt": "2025-11-19T10:00:00+08:00",
    "updatedAt": "2025-11-19T11:00:00+08:00"
  }
}
```

---

## 注意事项

- 🆔 所有需要认证的接口都需要在请求头中包含 `Authorization: Bearer {token}`
- 🔄 Token 通过 `/api/auth/login` 获取，使用 JWT 格式
- 📝 所有测试命令均为本地 `127.0.0.1:8080` 端口
- ✅ 所有 JSON 请求需要设置 `Content-Type: application/json` 头
- 🔧 数据库使用 MySQL，自动迁移表结构
- ⏱️ 时间戳均为 UTC 时区
