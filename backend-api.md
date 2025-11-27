# OrangePi 后台管理系统 - HTTP Service API 文档

## � 项目简介

本项目是一个基于 Go 语言开发的 OrangePi 设备后台管理系统的 HTTP 服务端,提供设备管理、建筑信息管理、录像文件管理、公网配置等功能。

## �📋 完整API接口列表

### 核心管理接口

| 编号 | 接口 | 方法 | 功能 | 使用场景 | 权限要求 |
|------|------|------|------|----------|----------|
| 1 | `/health` | GET | 健康检查 | 应用启动时检查服务状态 | 无 |
| 2 | `/api/auth/public` | POST | 获取公开访问Token | 第三方系统集成 | 无(有速率限制) |(暂时不用做)
| 3 | `/api/auth/login` | POST | 管理员登录 | 管理员登录获取JWT Token | 无 |

### 管理员账户管理 (Adminer)

| 编号 | 接口 | 方法 | 功能 | 权限要求 |
|------|------|------|------|----------|
| 4 | `/api/admin` | GET | 查询管理员列表/详情 | 超级管理员 |
| 5 | `/api/admin` | POST | 创建管理员账户 | 超级管理员 |
| 6 | `/api/admin` | PUT | 更新管理员信息 | 超级管理员 |
| 7 | `/api/admin` | DELETE | 删除管理员账户 | 超级管理员 |

### OrangePi设备管理

| 编号 | 接口 | 方法 | 功能 | 权限要求 |
|------|------|------|------|----------|
| 8 | `/api/device` | GET | 查询OrangePi设备列表/详情 | 管理员 |
| 9 | `/api/device` | POST | 创建OrangePi设备记录 | 管理员 |
| 10 | `/api/device` | PUT | 更新OrangePi设备信息 | 管理员 |
| 11 | `/api/device` | DELETE | 删除OrangePi设备记录 | 管理员 |

### 建筑信息管理 (Building)

| 编号 | 接口 | 方法 | 功能 | 权限要求 |
|------|------|------|------|----------|
| 12 | `/api/building` | GET | 查询建筑列表/详情 | 管理员 |
| 13 | `/api/building` | POST | 创建建筑信息 | 管理员 |
| 14 | `/api/building` | PUT | 更新建筑信息 | 管理员 |
| 15 | `/api/building` | DELETE | 删除建筑信息 | 管理员 |

### nvr(网络硬盘录像机) (nvr)

| 编号 | 接口 | 方法 | 功能 | 权限要求 |
|------|------|------|------|----------|
| 16 | `/api/nvr` | GET | 查询nvr列表/详情 | 管理员 |
| 17 | `/api/nvr` | POST | 创建nvr信息 | 管理员 |
| 18 | `/api/nvr` | PUT | 更新nvr信息 | 管理员 |
| 19 | `/api/nvr` | DELETE | 删除nvr信息 | 管理员 |

### 设备与网络配置

| 编号 | 接口 | 方法 | 功能 | 权限要求 |
|------|------|------|------|----------|
| 21 | `/api/device/info` | GET | 获取设备信息 | 管理员 |(暂时不做)
| 22 | `/api/orangepi/remote/ports` | POST | 远程更新FRPC端口并重启 | 管理员 |(暂时不做)
| 23 | `/api/publicnet/config` | PUT | 修改公网配置 | 管理员 |

## 核心管理接口详细文档

### 1. 健康检查

#### 接口信息
```http
GET /health
```

#### 测试命令
```powershell
# 本地测试
Invoke-RestMethod -Uri "http://127.0.0.1:8080/health" -Method GET
```

#### 响应示例
```
ok
```

---

### 2. 获取公开访问Token

#### 接口信息
```http
POST /api/auth/public
Content-Type: application/json
```

#### 请求参数
```json
{
  "building_id": "ismart_001",  // 必填 - 建筑ISmartID
  "channels": ["channel1", "channel2"]  // 必填 - 视频频道列表，至少包含一个频道
}
```

#### 测试命令
```powershell
# 本地测试
$body = @{
  building_id = "ismart_001"
  channels = @("channel1", "channel2")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/auth/public" -Method POST -Body $body -ContentType "application/json"
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "token": "eyJjaGFubmVscyI6WyJjaGFubmVsMSIsImNoYW5uZWwyIl0sImJ1aWxkaW5nX2lkIjoiaXNtYXJ0XzAwMSIsImV4cCI6MTczMjUwNDgwMCwiaWF0IjoxNzMyNDE4NDAwfQ.signature"  // HMAC-SHA256签名的视频访问Token，24小时有效期
  }
}
```

#### 错误响应示例
```json
{
  "success": false,
  "error": "building not found: ismart_001"  // 建筑不存在
}
```

```json
{
  "success": false,
  "error": "channels cannot be empty"  // 频道列表为空
}
```

#### 注意事项
- 🆔 building_id 必须是已存在的建筑ISmartID
- 🔄 该建筑必须关联至少一个OrangePi设备
- 📝 Token有效期为24小时
- 🔐 Token格式：base64(payload).signature

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
  "username": "admin",  // 必填 - 管理员用户名
  "password": "123456"   // 必填 - 管理员密码
}
```

#### 测试命令
```powershell
# 本地测试
$body = @{
  username = "admin"
  password = "123456"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/auth/login" -Method POST -Body $body -ContentType "application/json"
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoxLCJ1c2VybmFtZSI6ImFkbWluIiwiZXhwIjoxNzMyNDI2NDAwLCJpYXQiOjE3MzI0MTg0MDAsInN1YiI6IjEifQ.signature",  // JWT Token，用于后续API认证
    "expiresAt": "2025-11-26T11:00:00+08:00"  // Token过期时间（默认120分钟）
  }
}
```

#### 错误响应示例
```json
{
  "success": false,
  "error": "invalid credentials"  // 用户名或密码错误
}
```

#### 注意事项
- 🆔 默认管理员账户：username: `admin`, password: `123456`
- 🔄 Token默认有效期为120分钟，可通过环境变量 `JWT_TTL_MINUTES` 配置
- 📝 后续API请求需要在Header中携带：`Authorization: Bearer <accessToken>`
- 🔐 Token包含管理员ID和用户名信息

---

## 管理员账户管理接口详细文档

### 4. 查询管理员列表/详情

#### 接口信息
```http
GET /api/admin
Authorization: Bearer <accessToken>
```

#### 查询参数

**查询单条详情：**
- `id` (必填) - 管理员ID

**查询列表（分页）：**
- `pageNum` (可选) - 页码，默认 1
- `pageSize` (可选) - 每页数量，默认 20，最大 100
- `asc` (可选) - 是否升序，默认 false（降序）

#### 测试命令

**查询单条详情：**
```powershell
# 本地测试
$token = "your_jwt_token_here"
$headers = @{
  "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/admin?id=1" -Method GET -Headers $headers
```

**查询列表：**
```powershell
# 本地测试
$token = "your_jwt_token_here"
$headers = @{
  "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/admin?pageNum=1&pageSize=20&asc=false" -Method GET -Headers $headers
```

#### 响应示例

**单条详情响应：**
```json
{
  "success": true,
  "data": {
    "id": 1,  // 管理员ID
    "username": "admin",  // 用户名
    "createdAt": "2025-11-25T10:00:00+08:00",  // 创建时间
    "updatedAt": "2025-11-25T10:00:00+08:00"   // 更新时间
  }
}
```

**列表响应：**
```json
{
  "success": true,
  "data": {
    "items": [  // 管理员列表
      {
        "id": 1,
        "username": "admin",
        "createdAt": "2025-11-25T10:00:00+08:00",
        "updatedAt": "2025-11-25T10:00:00+08:00"
      },
      {
        "id": 2,
        "username": "test_user",
        "createdAt": "2025-11-25T11:00:00+08:00",
        "updatedAt": "2025-11-25T11:00:00+08:00"
      }
    ],
    "page": {  // 分页信息
      "total": 2,      // 总记录数
      "pageNum": 1,    // 当前页码
      "pageSize": 20   // 每页数量
    }
  }
}
```

#### 错误响应示例
```json
{
  "success": false,
  "error": "record not found"  // 管理员不存在
}
```

#### 注意事项
- 🆔 需要管理员权限（Bearer Token）
- 🔄 查询单条时，id 为必填参数
- 📝 查询列表时，支持分页和排序
- 🔐 密码哈希不会返回给前端

---

### 5. 创建管理员账户

#### 接口信息
```http
POST /api/admin
Content-Type: application/json
Authorization: Bearer <accessToken>
```

#### 请求参数
```json
{
  "username": "new_admin",  // 必填 - 管理员用户名（唯一）
  "password": "password123"  // 必填 - 管理员密码
}
```

#### 测试命令
```powershell
# 本地测试
$token = "your_jwt_token_here"
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

$body = @{
  username = "new_admin"
  password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/admin" -Method POST -Headers $headers -Body $body
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "id": 3,  // 新创建的管理员ID
    "username": "new_admin",  // 用户名
    "createdAt": "2025-11-25T12:00:00+08:00",  // 创建时间
    "updatedAt": "2025-11-25T12:00:00+08:00"   // 更新时间
  }
}
```

#### 错误响应示例
```json
{
  "success": false,
  "error": "username and password are required"  // 用户名或密码为空
}
```

```json
{
  "success": false,
  "error": "Error 1062: Duplicate entry 'new_admin' for key 'adminers.username'"  // 用户名已存在
}
```

#### 注意事项
- 🆔 需要管理员权限（Bearer Token）
- 🔄 用户名必须唯一
- 📝 密码会自动使用 bcrypt 加密存储
- 🔐 密码不会在响应中返回

---

### 6. 更新管理员信息

#### 接口信息
```http
PUT /api/admin
Content-Type: application/json
Authorization: Bearer <accessToken>
```

#### 请求参数
```json
{
  "id": 2,              // 必填 - 管理员ID
  "username": "updated_admin",  // 可选 - 新用户名
  "password": "newpass123"      // 可选 - 新密码
}
```

#### 测试命令
```powershell
# 本地测试
$token = "your_jwt_token_here"
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

$body = @{
  id = 2
  username = "updated_admin"
  password = "newpass123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/admin" -Method PUT -Headers $headers -Body $body
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "id": 2,  // 管理员ID
    "username": "updated_admin",  // 更新后的用户名
    "createdAt": "2025-11-25T11:00:00+08:00",  // 创建时间
    "updatedAt": "2025-11-25T12:30:00+08:00"   // 更新时间（已更新）
  }
}
```

#### 错误响应示例
```json
{
  "success": false,
  "error": "id is required"  // ID 参数缺失
}
```

```json
{
  "success": false,
  "error": "record not found"  // 管理员不存在
}
```

#### 注意事项
- 🆔 需要管理员权限（Bearer Token）
- 🔄 id 为必填参数，username 和 password 至少提供一个
- 📝 如果只更新用户名，可以不传 password
- 📝 如果只更新密码，可以不传 username
- 🔐 密码会自动使用 bcrypt 重新加密

---

### 7. 删除管理员账户

#### 接口信息
```http
DELETE /api/admin
Content-Type: application/json
Authorization: Bearer <accessToken>
```

#### 请求参数
```json
{
  "id": 2  // 必填 - 要删除的管理员ID
}
```

#### 测试命令
```powershell
# 本地测试
$token = "your_jwt_token_here"
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

$body = @{
  id = 2
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/admin" -Method DELETE -Headers $headers -Body $body
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "deleted": true  // 删除成功标识
  }
}
```

#### 错误响应示例
```json
{
  "success": false,
  "error": "id is required"  // ID 参数缺失
}
```

```json
{
  "success": false,
  "error": "record not found"  // 管理员不存在
}
```

#### 注意事项
- 🆔 需要管理员权限（Bearer Token）
- 🔄 使用软删除，记录不会真正从数据库删除
- 📝 删除后记录会标记 deleted_at 字段
- ⚠️ 删除操作不可恢复，请谨慎操作

---

## OrangePi设备管理接口详细文档

### 8. 查询OrangePi设备列表/详情

#### 接口信息
```http
GET /api/device
Authorization: Bearer <accessToken>
```

#### 查询参数
- `ismartid` (可选) - 建筑ISmartID，用于筛选特定建筑下的设备

#### 测试命令
```powershell
# 本地测试 - 查询所有设备
$token = "your_jwt_token_here"
$headers = @{
  "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/device" -Method GET -Headers $headers
```

```powershell
# 本地测试 - 按建筑筛选设备
$token = "your_jwt_token_here"
$headers = @{
  "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/device?ismartid=ismart_001" -Method GET -Headers $headers
```

#### 响应示例
```json
{
  "success": true,
  "data": [
    {
      "id": 1,  // 设备ID
      "ismartid": "ismart_001",  // 关联建筑ISmartID
      "name": "OrangePi-A-001",  // 设备名称
      "icctv_auth_service_remote_port": 30001,  // 远程认证服务端口
      "ssh_remote_port": 20001,  // SSH远程端口
      "is_active": true,  // 是否激活
      "createdAt": "2025-11-25T10:00:00+08:00",  // 创建时间
      "updatedAt": "2025-11-25T10:00:00+08:00",  // 更新时间
      "building": {  // 关联建筑信息（如果存在）
        "id": 1,
        "ismartid": "ismart_001",
        "name": "A栋主楼",
        "remark": "主要办公区域"
      }
    },
    {
      "id": 2,
      "ismartid": "ismart_001",
      "name": "OrangePi-A-002",
      "icctv_auth_service_remote_port": 30002,
      "ssh_remote_port": 20002,
      "is_active": true,
      "createdAt": "2025-11-25T10:30:00+08:00",
      "updatedAt": "2025-11-25T10:30:00+08:00"
    }
  ]
}
```

#### 错误响应示例
```json
{
  "success": false,
  "error": "internal server error"  // 服务器内部错误
}
```

#### 注意事项
- 🆔 需要管理员权限（Bearer Token）
- 🔄 不提供 ismartid 参数时，返回所有设备
- 📝 返回结果包含关联的建筑信息（如果存在）
- 🔐 使用软删除，已删除的设备不会出现在列表中

---

### 9. 创建OrangePi设备记录

#### 接口信息
```http
POST /api/device
Content-Type: application/json
Authorization: Bearer <accessToken>
```

#### 请求参数
```json
{
  "ismartid": "ismart_001",  // 必填 - 关联建筑ISmartID
  "name": "OrangePi-A-001",  // 必填 - 设备名称
  "icctv_auth_service_remote_port": 30001,  // 必填 - 远程认证服务端口
  "ssh_remote_port": 20001,  // 必填 - SSH远程端口
  "is_active": true  // 可选 - 是否激活，默认 true
}
```

#### 测试命令
```powershell
# 本地测试
$token = "your_jwt_token_here"
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

$body = @{
  ismartid = "ismart_001"
  name = "OrangePi-A-001"
  icctv_auth_service_remote_port = 30001
  ssh_remote_port = 20001
  is_active = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/device" -Method POST -Headers $headers -Body $body
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "id": 3,  // 新创建的设备ID
    "ismartid": "ismart_001",  // 关联建筑ISmartID
    "name": "OrangePi-A-001",  // 设备名称
    "icctv_auth_service_remote_port": 30001,  // 远程认证服务端口
    "ssh_remote_port": 20001,  // SSH远程端口
    "is_active": true,  // 是否激活
    "createdAt": "2025-11-25T12:00:00+08:00",  // 创建时间
    "updatedAt": "2025-11-25T12:00:00+08:00"   // 更新时间
  }
}
```

#### 错误响应示例
```json
{
  "success": false,
  "error": "Error 1452: Cannot add or update a child row: a foreign key constraint fails"  // 关联的建筑不存在
}
```

```json
{
  "success": false,
  "error": "empty body"  // 请求体为空
}
```

#### 注意事项
- 🆔 需要管理员权限（Bearer Token）
- 🔄 ismartid 必须是已存在的建筑ISmartID
- 📝 端口号必须唯一，不能与其他设备冲突
- 🔐 is_active 字段可选，默认为 true

---

### 10. 更新OrangePi设备信息

#### 接口信息
```http
PUT /api/device?id=<device_id>
Content-Type: application/json
Authorization: Bearer <accessToken>
```

#### 查询参数
- `id` (必填) - 设备ID

#### 请求参数
```json
{
  "ismartid": "ismart_002",  // 可选 - 关联建筑ISmartID
  "name": "UpdatedOrangePi",  // 可选 - 设备名称
  "icctv_auth_service_remote_port": 30003,  // 可选 - 远程认证服务端口
  "ssh_remote_port": 20003,  // 可选 - SSH远程端口
  "is_active": false  // 可选 - 是否激活
}
```

#### 测试命令
```powershell
# 本地测试
$token = "your_jwt_token_here"
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

$body = @{
  name = "UpdatedOrangePi"
  icctv_auth_service_remote_port = 30003
  is_active = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/device?id=1" -Method PUT -Headers $headers -Body $body
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "id": 1,  // 设备ID
    "ismartid": "ismart_001",  // 关联建筑ISmartID（未更新）
    "name": "UpdatedOrangePi",  // 更新后的设备名称
    "icctv_auth_service_remote_port": 30003,  // 更新后的远程认证服务端口
    "ssh_remote_port": 20001,  // SSH远程端口（未更新）
    "is_active": false,  // 更新后的激活状态
    "createdAt": "2025-11-25T10:00:00+08:00",  // 创建时间
    "updatedAt": "2025-11-25T12:30:00+08:00"   // 更新时间（已更新）
  }
}
```

#### 错误响应示例
```json
{
  "success": false,
  "error": "id is required"  // ID 参数缺失
}
```

```json
{
  "success": false,
  "error": "record not found"  // 设备不存在
}
```

#### 注意事项
- 🆔 需要管理员权限（Bearer Token）
- 🔄 id 为必填查询参数，其他字段均为可选
- 📝 只更新提供的字段，未提供的字段保持不变
- 🔐 如果更新 ismartid，新值必须是已存在的建筑ISmartID
- 📝 端口号更新时需确保不与其他设备冲突

---

### 11. 删除OrangePi设备记录

#### 接口信息
```http
DELETE /api/device
Content-Type: application/json
Authorization: Bearer <accessToken>
```

#### 请求参数
```json
{
  "id": 1  // 必填 - 要删除的设备ID
}
```

#### 测试命令
```powershell
# 本地测试
$token = "your_jwt_token_here"
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

$body = @{
  id = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/device" -Method DELETE -Headers $headers -Body $body
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "deleted": true  // 删除成功标识
  }
}
```

#### 错误响应示例
```json
{
  "success": false,
  "error": "id is required"  // ID 参数缺失
}
```

```json
{
  "success": false,
  "error": "record not found"  // 设备不存在
}
```

#### 注意事项
- 🆔 需要管理员权限（Bearer Token）
- 🔄 使用软删除，记录不会真正从数据库删除
- 📝 删除后记录会标记 deleted_at 字段
- ⚠️ 删除操作不可恢复，请谨慎操作
- 🔐 删除设备不会影响关联的建筑信息

## 建筑信息管理接口详细文档

### 12. 查询建筑列表/详情

#### 接口信息
```http
GET /api/building
Authorization: Bearer <accessToken>
```

#### 查询参数
无（返回所有建筑及其关联的OrangePi设备）

#### 测试命令
```powershell
# 本地测试
$token = "your_jwt_token_here"
$headers = @{
  "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/building" -Method GET -Headers $headers
```

#### 响应示例
```json
{
  "success": true,
  "data": [
    {
      "id": 1,  // 建筑ID
      "ismartid": "ismart_001",  // ismart系统ID（唯一标识）
      "name": "A栋主楼",  // 楼栋名称
      "remark": "主要办公区域",  // 备注信息
      "createdAt": "2025-11-25T10:00:00+08:00",  // 创建时间
      "updatedAt": "2025-11-25T10:00:00+08:00",  // 更新时间
      "orangepis": [  // 关联的OrangePi设备列表
        {
          "id": 1,
          "ismartid": "ismart_001",
          "name": "OrangePi-A-001",
          "icctv_auth_service_remote_port": 30001,
          "ssh_remote_port": 20001,
          "is_active": true,
          "createdAt": "2025-11-25T10:30:00+08:00",
          "updatedAt": "2025-11-25T10:30:00+08:00"
        },
        {
          "id": 2,
          "ismartid": "ismart_001",
          "name": "OrangePi-A-002",
          "icctv_auth_service_remote_port": 30002,
          "ssh_remote_port": 20002,
          "is_active": true,
          "createdAt": "2025-11-25T11:00:00+08:00",
          "updatedAt": "2025-11-25T11:00:00+08:00"
        }
      ]
    },
    {
      "id": 2,
      "ismartid": "ismart_002",
      "name": "B栋副楼",
      "remark": "研发中心",
      "createdAt": "2025-11-25T11:30:00+08:00",
      "updatedAt": "2025-11-25T11:30:00+08:00",
      "orangepis": []  // 无关联设备
    }
  ]
}
```

#### 错误响应示例
```json
{
  "success": false,
  "error": "internal server error"  // 服务器内部错误
}
```

#### 注意事项
- 🆔 需要管理员权限（Bearer Token）
- 🔄 返回所有建筑及其关联的OrangePi设备
- 📝 使用软删除，已删除的建筑不会出现在列表中
- 🔐 关联的OrangePi设备通过 ismart_id 字段关联

---

### 13. 创建建筑信息

#### 接口信息
```http
POST /api/building
Content-Type: application/json
Authorization: Bearer <accessToken>
```

#### 请求参数
```json
{
  "ismartid": "ismart_003",  // 必填 - ismart系统ID（唯一标识）
  "name": "C栋宿舍",  // 必填 - 楼栋名称
  "remark": "员工宿舍楼"  // 可选 - 备注信息
}
```

#### 测试命令
```powershell
# 本地测试
$token = "your_jwt_token_here"
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

$body = @{
  ismartid = "ismart_003"
  name = "C栋宿舍"
  remark = "员工宿舍楼"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/building" -Method POST -Headers $headers -Body $body
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "id": 3,  // 新创建的建筑ID
    "ismartid": "ismart_003",  // ismart系统ID
    "name": "C栋宿舍",  // 楼栋名称
    "remark": "员工宿舍楼",  // 备注信息
    "createdAt": "2025-11-25T12:00:00+08:00",  // 创建时间
    "updatedAt": "2025-11-25T12:00:00+08:00"   // 更新时间
  }
}
```

#### 错误响应示例
```json
{
  "success": false,
  "error": "Error 1062: Duplicate entry 'ismart_003' for key 'buildings.ismart_id'"  // ismartid已存在
}
```

```json
{
  "success": false,
  "error": "empty body"  // 请求体为空
}
```

#### 注意事项
- 🆔 需要管理员权限（Bearer Token）
- 🔄 ismartid 必须唯一，不能重复
- 📝 name 为必填字段，remark 为可选字段
- 🔐 创建后可以通过 ismartid 关联OrangePi设备

---

### 14. 更新建筑信息

#### 接口信息
```http
PUT /api/building?id=<building_id>
Content-Type: application/json
Authorization: Bearer <accessToken>
```

#### 查询参数
- `id` (必填) - 建筑ID

#### 请求参数
```json
{
  "ismartid": "ismart_003_updated",  // 可选 - 新的ismart系统ID
  "name": "更新后的C栋",  // 可选 - 新的楼栋名称
  "remark": "已更新备注"  // 可选 - 新的备注信息
}
```

#### 测试命令
```powershell
# 本地测试
$token = "your_jwt_token_here"
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

$body = @{
  name = "更新后的C栋"
  remark = "已更新备注"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/building?id=3" -Method PUT -Headers $headers -Body $body
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "id": 3,  // 建筑ID
    "ismartid": "ismart_003",  // ismart系统ID（未更新）
    "name": "更新后的C栋",  // 更新后的楼栋名称
    "remark": "已更新备注",  // 更新后的备注信息
    "createdAt": "2025-11-25T12:00:00+08:00",  // 创建时间
    "updatedAt": "2025-11-25T12:30:00+08:00"   // 更新时间（已更新）
  }
}
```

#### 错误响应示例
```json
{
  "success": false,
  "error": "id is required"  // ID 参数缺失
}
```

```json
{
  "success": false,
  "error": "record not found"  // 建筑不存在
}
```

```json
{
  "success": false,
  "error": "Error 1062: Duplicate entry 'ismart_003_updated' for key 'buildings.ismart_id'"  // 新的ismartid已存在
}
```

#### 注意事项
- 🆔 需要管理员权限（Bearer Token）
- 🔄 id 为必填查询参数，所有请求字段均为可选
- 📝 只更新提供的字段，未提供的字段保持不变
- 🔐 如果更新 ismartid，新值必须唯一且不能与其他建筑重复
- ⚠️ 更新 ismartid 会影响关联的OrangePi设备（通过外键关联）

---

### 15. 删除建筑信息

#### 接口信息
```http
DELETE /api/building
Content-Type: application/json
Authorization: Bearer <accessToken>
```

#### 请求参数
```json
{
  "id": 3  // 必填 - 要删除的建筑ID
}
```

#### 测试命令
```powershell
# 本地测试
$token = "your_jwt_token_here"
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

$body = @{
  id = 3
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/building" -Method DELETE -Headers $headers -Body $body
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "deleted": true  // 删除成功标识
  }
}
```

#### 错误响应示例
```json
{
  "success": false,
  "error": "id is required"  // ID 参数缺失
}
```

```json
{
  "success": false,
  "error": "record not found"  // 建筑不存在
}
```

#### 注意事项
- 🆔 需要管理员权限（Bearer Token）
- 🔄 使用软删除，记录不会真正从数据库删除
- 📝 删除后记录会标记 deleted_at 字段
- ⚠️ 删除操作不可恢复，请谨慎操作
- 🔐 删除建筑不会自动删除关联的OrangePi设备，但会解除关联关系（外键约束：OnDelete:SET NULL）

## NVR(网络硬盘录像机)管理接口详细文档

### 12. 查询NVR列表/详情

#### 接口信息
```http
GET /api/nvr
Authorization: Bearer <accessToken>
```

#### 查询参数
- `id` (可选) - NVR ID，提供时返回单条详情，不提供时返回列表

#### 测试命令

**查询列表：**
```powershell
# 本地测试
$token = "your_jwt_token_here"
$headers = @{
  "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/nvr" -Method GET -Headers $headers
```

**查询详情：**
```powershell
# 本地测试
$token = "your_jwt_token_here"
$headers = @{
  "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/nvr?id=1" -Method GET -Headers $headers
```

#### 响应示例

**列表响应：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,  // NVR ID
      "name": "A楼监控系统",  // NVR名称
      "url": "192.168.1.100:8080",  // NVR访问地址
      "building_id": 1,  // 关联建筑ID
      "admin_user": {  // 管理员账户
        "name": "admin",
        "password": "admin123"
      },
      "users": [  // 普通用户列表
        {
          "name": "operator1",
          "password": "pass123"
        },
        {
          "name": "operator2",
          "password": "pass456"
        }
      ],
      "rtsp_urls": [  // RTSP地址列表
        {
          "channel": 1,
          "url": "rtsp://192.168.1.100:554/stream1"
        },
        {
          "channel": 2,
          "url": "rtsp://192.168.1.100:554/stream2"
        }
      ],
      "createdAt": "2025-11-25T10:00:00+08:00",  // 创建时间
      "updatedAt": "2025-11-25T10:00:00+08:00",  // 更新时间
      "building": {  // 关联建筑信息
        "id": 1,
        "ismartid": "ismart_001",
        "name": "A栋主楼",
        "remark": "主要办公区域"
      }
    }
  ]
}
```

**详情响应：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "A楼监控系统",
    "url": "192.168.1.100:8080",
    "building_id": 1,
    "admin_user": {
      "name": "admin",
      "password": "admin123"
    },
    "users": [
      {
        "name": "operator1",
        "password": "pass123"
      }
    ],
    "rtsp_urls": [
      {
        "channel": 1,
        "url": "rtsp://192.168.1.100:554/stream1"
      },
      {
        "channel": 2,
        "url": "rtsp://192.168.1.100:554/stream2"
      },
      {
        "channel": 3,
        "url": "rtsp://192.168.1.100:554/stream3"
      },
      {
        "channel": 4,
        "url": "rtsp://192.168.1.100:554/stream4"
      }
    ],
    "createdAt": "2025-11-25T10:00:00+08:00",
    "updatedAt": "2025-11-25T10:00:00+08:00",
    "building": {
      "id": 1,
      "ismartid": "ismart_001",
      "name": "A栋主楼"
    }
  }
}
```

#### 错误响应示例
```json
{
  "success": false,
  "error": "record not found"  // NVR不存在
}
```

#### 注意事项
- 🆔 需要管理员权限（Bearer Token）
- 🔄 不提供 id 参数时，返回所有NVR列表
- 📝 返回结果包含关联的建筑信息
- 🔐 使用软删除，已删除的NVR不会出现在列表中

---

### 13. 创建NVR信息

#### 接口信息
```http
POST /api/nvr
Content-Type: application/json
Authorization: Bearer <accessToken>
```

#### 请求参数
```json
{
  "name": "A楼监控系统",  // 必填 - NVR名称
  "url": "192.168.1.100:8080",  // 必填 - NVR访问地址 (IP:Port格式)
  "building_id": 1,  // 必填 - 关联建筑ID
  "admin_user": {  // 可选 - 管理员账户
    "name": "admin",
    "password": "admin123"
  },
  "users": [  // 可选 - 普通用户列表
    {
      "name": "operator1",
      "password": "pass123"
    },
    {
      "name": "operator2",
      "password": "pass456"
    }
  ],
  "rtsp_urls": [  // 可选 - RTSP地址列表
    {
      "channel": 1,
      "url": "rtsp://192.168.1.100:554/stream1"
    },
    {
      "channel": 2,
      "url": "rtsp://192.168.1.100:554/stream2"
    },
    {
      "channel": 3,
      "url": "rtsp://192.168.1.100:554/stream3"
    },
    {
      "channel": 4,
      "url": "rtsp://192.168.1.100:554/stream4"
    }
  ]
}
```

#### 测试命令
```powershell
# 本地测试
$token = "your_jwt_token_here"
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

$body = @{
  name = "A楼监控系统"
  url = "192.168.1.100:8080"
  building_id = 1
  admin_user = @{
    name = "admin"
    password = "admin123"
  }
  users = @(
    @{
      name = "operator1"
      password = "pass123"
    },
    @{
      name = "operator2"
      password = "pass456"
    }
  )
  rtsp_urls = @(
    @{
      channel = 1
      url = "rtsp://192.168.1.100:554/stream1"
    },
    @{
      channel = 2
      url = "rtsp://192.168.1.100:554/stream2"
    }
  )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/nvr" -Method POST -Headers $headers -Body $body
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "id": 1,  // 新创建的NVR ID
    "name": "A楼监控系统",  // NVR名称
    "url": "192.168.1.100:8080",  // NVR访问地址
    "building_id": 1,  // 关联建筑ID
    "admin_user": {  // 管理员账户
      "name": "admin",
      "password": "admin123"
    },
    "users": [  // 普通用户列表
      {
        "name": "operator1",
        "password": "pass123"
      },
      {
        "name": "operator2",
        "password": "pass456"
      }
    ],
    "rtsp_urls": [  // RTSP地址列表
      {
        "channel": 1,
        "url": "rtsp://192.168.1.100:554/stream1"
      },
      {
        "channel": 2,
        "url": "rtsp://192.168.1.100:554/stream2"
      }
    ],
    "createdAt": "2025-11-25T12:00:00+08:00",  // 创建时间
    "updatedAt": "2025-11-25T12:00:00+08:00"   // 更新时间
  }
}
```

#### 错误响应示例
```json
{
  "success": false,
  "error": "Error 1452: Cannot add or update a child row: a foreign key constraint fails"  // 关联的建筑不存在
}
```

```json
{
  "success": false,
  "error": "empty body"  // 请求体为空
}
```

#### 注意事项
- 🆔 需要管理员权限（Bearer Token）
- 🔄 building_id 必须是已存在的建筑ID
- 📝 name 和 url 为必填字段
- 🔐 admin_user、users、rtsp_urls 为可选字段，以JSON格式存储
- 📝 url 格式应为 IP:Port（如：192.168.1.100:8080）

---

### 14. 更新NVR信息

#### 接口信息
```http
PUT /api/nvr?id=<nvr_id>
Content-Type: application/json
Authorization: Bearer <accessToken>
```

#### 查询参数
- `id` (必填) - NVR ID

#### 请求参数
```json
{
  "name": "更新后的NVR名称",  // 可选 - NVR名称
  "url": "192.168.1.200:8080",  // 可选 - NVR访问地址
  "building_id": 2,  // 可选 - 关联建筑ID
  "admin_user": {  // 可选 - 管理员账户（需要同时提供name和password才会更新）
    "name": "new_admin",
    "password": "newpass123"
  },
  "users": [  // 可选 - 普通用户列表（提供时会替换整个列表）
    {
      "name": "operator3",
      "password": "pass789"
    }
  ],
  "rtsp_urls": [  // 可选 - RTSP地址列表（提供时会替换整个列表）
    {
      "channel": 1,
      "url": "rtsp://192.168.1.200:554/updated_stream1"
    },
    {
      "channel": 2,
      "url": "rtsp://192.168.1.200:554/updated_stream2"
    },
    {
      "channel": 5,
      "url": "rtsp://192.168.1.200:554/new_stream5"
    }
  ]
}
```

#### 测试命令
```powershell
# 本地测试
$token = "your_jwt_token_here"
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

$body = @{
  name = "更新后的NVR名称"
  rtsp_urls = @(
    @{
      channel = 1
      url = "rtsp://192.168.1.200:554/updated_stream1"
    },
    @{
      channel = 2
      url = "rtsp://192.168.1.200:554/updated_stream2"
    }
  )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/nvr?id=1" -Method PUT -Headers $headers -Body $body
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "id": 1,  // NVR ID
    "name": "更新后的NVR名称",  // 更新后的NVR名称
    "url": "192.168.1.100:8080",  // NVR访问地址（未更新）
    "building_id": 1,  // 关联建筑ID（未更新）
    "admin_user": {  // 管理员账户（未更新）
      "name": "admin",
      "password": "admin123"
    },
    "users": [  // 普通用户列表（未更新）
      {
        "name": "operator1",
        "password": "pass123"
      }
    ],
    "rtsp_urls": [  // 更新后的RTSP地址列表
      {
        "channel": 1,
        "url": "rtsp://192.168.1.200:554/updated_stream1"
      },
      {
        "channel": 2,
        "url": "rtsp://192.168.1.200:554/updated_stream2"
      }
    ],
    "createdAt": "2025-11-25T10:00:00+08:00",  // 创建时间
    "updatedAt": "2025-11-25T12:30:00+08:00"   // 更新时间（已更新）
  }
}
```

#### 错误响应示例
```json
{
  "success": false,
  "error": "id is required"  // ID 参数缺失
}
```

```json
{
  "success": false,
  "error": "record not found"  // NVR不存在
}
```

#### 注意事项
- 🆔 需要管理员权限（Bearer Token）
- 🔄 id 为必填查询参数，所有请求字段均为可选
- 📝 只更新提供的字段，未提供的字段保持不变
- 🔐 如果更新 building_id，新值必须是已存在的建筑ID
- 📝 users 和 rtsp_urls 提供时会替换整个列表，不是追加
- 🔐 admin_user 需要同时提供 name 和 password 才会更新

---

### 15. 删除NVR信息

#### 接口信息
```http
DELETE /api/nvr
Content-Type: application/json
Authorization: Bearer <accessToken>
```

#### 请求参数
```json
{
  "id": 1  // 必填 - 要删除的NVR ID
}
```

#### 测试命令
```powershell
# 本地测试
$token = "your_jwt_token_here"
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

$body = @{
  id = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/nvr" -Method DELETE -Headers $headers -Body $body
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "deleted": true  // 删除成功标识
  }
}
```

#### 错误响应示例
```json
{
  "success": false,
  "error": "id is required"  // ID 参数缺失
}
```

```json
{
  "success": false,
  "error": "record not found"  // NVR不存在
}
```

#### 注意事项
- 🆔 需要管理员权限（Bearer Token）
- 🔄 使用软删除，记录不会真正从数据库删除
- 📝 删除后记录会标记 deleted_at 字段
- ⚠️ 删除操作不可恢复，请谨慎操作
- 🔐 删除NVR不会影响关联的建筑信息



## 设备与网络配置接口详细文档

### 16. 获取设备信息

#### 接口信息
```http
GET /api/device/info
Authorization: Bearer <accessToken>
```

#### 查询参数
无

#### 测试命令
```powershell
# 本地测试
$token = "your_jwt_token_here"
$headers = @{
  "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/device/info" -Method GET -Headers $headers
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "totalDevices": 10,  // 总设备数
    "activeDevices": 8,  // 活跃设备数
    "buildingBounded": 5,  // 已绑定建筑数
    "lastSync": "2025-11-25T12:00:00+08:00"  // 最后同步时间
  }
}
```

#### 错误响应示例
```json
{
  "success": false,
  "error": "internal server error"  // 服务器内部错误
}
```

#### 注意事项
- 🆔 需要管理员权限（Bearer Token）
- 🔄 返回设备统计概览信息
- 📝 totalDevices：所有OrangePi设备总数（包括已删除的）
- 📝 activeDevices：is_active 为 true 的设备数量
- 📝 buildingBounded：已关联建筑的设备数量（通过 ismart_id 关联）
- 🔐 lastSync：当前时间戳，表示数据同步时间

---

### 17. 远程更新FRPC端口并重启

#### 接口信息
```http
POST /api/orangepi/remote/ports
Content-Type: application/json
Authorization: Bearer <accessToken>
```

#### 请求参数
```json
{
  "id": 1,  // 必填 - OrangePi设备ID
  "ssh_remote_port": 20005,  // 必填 - 新的SSH远程端口
  "icctv_auth_service_remote_port": 30005  // 必填 - 新的认证服务远程端口
}
```

#### 测试命令
```powershell
# 本地测试
$token = "your_jwt_token_here"
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

$body = @{
  id = 1
  ssh_remote_port = 20005
  icctv_auth_service_remote_port = 30005
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/orangepi/remote/ports" -Method POST -Headers $headers -Body $body
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "success": true,  // 远程更新是否成功
    "message": "Ports updated and service restarted",  // 操作结果消息
    "restarted": true  // 服务是否已重启
  }
}
```

#### 错误响应示例
```json
{
  "success": false,
  "error": "id, ssh_remote_port and icctv_auth_service_remote_port are required"  // 参数缺失
}
```

```json
{
  "success": false,
  "error": "record not found"  // 设备不存在
}
```

```json
{
  "success": false,
  "error": "public network configuration not found"  // 公网配置不存在
}
```

```json
{
  "success": false,
  "error": "failed to connect to remote device: connection timeout"  // 远程设备连接失败
}
```

#### 注意事项
- 🆔 需要管理员权限（Bearer Token）
- 🔄 所有参数均为必填
- 📝 此接口会通过公网IP和当前认证服务端口连接到远程OrangePi设备
- 🔐 远程更新成功后，本地数据库中的端口信息会自动更新
- ⚠️ 更新端口后，远程设备会重启FRPC服务
- 🔐 需要确保公网配置（external_ip）已正确设置
- 📝 远程设备必须在线且可访问，否则会返回连接错误

---

### 19. 修改公网配置

#### 接口信息
```http
PUT /api/publicnet/config
Content-Type: application/json
Authorization: Bearer <accessToken>
```

#### 请求参数
```json
{
  "external_ip": "203.0.113.100"  // 必填 - 外部公网IP地址
}
```

#### 测试命令
```powershell
# 本地测试
$token = "your_jwt_token_here"
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

$body = @{
  external_ip = "203.0.113.100"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/publicnet/config" -Method PUT -Headers $headers -Body $body
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "id": 1,  // 配置ID
    "external_ip": "203.0.113.100",  // 外部公网IP地址
    "createdAt": "2025-11-25T10:00:00+08:00",  // 创建时间
    "updatedAt": "2025-11-25T12:30:00+08:00"   // 更新时间（已更新）
  }
}
```

#### 错误响应示例
```json
{
  "success": false,
  "error": "external ip is required"  // IP地址为空
}
```

```json
{
  "success": false,
  "error": "empty body"  // 请求体为空
}
```

#### 注意事项
- 🆔 需要管理员权限（Bearer Token）
- 🔄 external_ip 为必填参数
- 📝 如果配置不存在，会自动创建；如果已存在，则更新现有配置
- 🔐 公网IP用于远程访问OrangePi设备，必须确保IP地址正确
- 📝 更新公网IP后，会影响所有远程OrangePi设备的访问地址
- ⚠️ 请谨慎修改，确保新IP地址可访问且正确



## 📊 数据模型规范

### 0. 通用字段 ModelFields

所有业务模型统一继承 `ModelFields`，用于存储主键与时间戳：

```go
type ModelFields struct {
    ID        int64          `gorm:"primary_key" json:"id"`           // 主键ID
    CreatedAt time.Time      `json:"createdAt"`                       // 创建时间
    UpdatedAt time.Time      `json:"updatedAt"`                       // 更新时间
    DeletedAt gorm.DeletedAt `json:"deletedAt,omitempty" gorm:"index"`// 软删除时间
}
```

后续的 `Adminer`、`OrangePi`、`Building` 均通过匿名字段方式引入：

```go
type ExampleModel struct {
    ModelFields
    // ...业务字段...
}
```

### 1. Adminer(管理员) 模型

```go
type Adminer struct {
    ModelFields
    Username       string    `json:"username"`         // 登录用户名(唯一)
    PasswordHash   string    `json:"password_hash"`    // Bcrypt 哈希
}
```

### 2. OrangePi (设备) 模型

```go
type OrangePi struct {
    ModelFields

    Base                        string `json:"base"`          // 关联楼栋 base
    Name                        string `json:"name"`          // Orangepi 名称
    ICCTVAuthServiceRemotePort  int    `json:"icctv_auth_service_remote_port"` // 远程认证服务
    SSHRemotePort               int    `json:"ssh_remote_port"` // SSH 远程端口
    AdminPorts                  []int  `json:"admin_ports"`   // 可用管理端口列表(1~6)
    IsActive                    bool   `json:"is_active"`     // 是否在用
}
```

### 3. Building (建筑) 模型

```go
type Building struct {
    ModelFields

    Base     string `json:"base"`     // 物理园区/楼栋唯一标识
    ISmartID string `json:"ismartid"` // ismart 系统ID
    Name     string `json:"name"`     // 楼栋名称
    Remark   string `json:"remark"`   // 备注信息
    
    // 关联关系 (一对多)
    OrangePis []OrangePi `json:"orangepis,omitempty"` // 关联的OrangePi设备列表
    NVRs      []NVR      `json:"nvrs,omitempty"`      // 关联的NVR设备列表
}
```

### 4. PublicNetConfig (公网配置) 模型

```go
type PublicNetConfig struct {
    IP string `json:"external_ip"`  // 外部IP地址
}
```

### 5. NVR (网络硬盘录像机) 模型

#### 用户认证信息子模型

```go
// AdminUser 管理员账户信息
type AdminUser struct {
    Name     string `json:"name"`     // 管理员用户名
    Password string `json:"password"` // 管理员密码
}

// User 普通用户账户信息
type User struct {
    Name     string `json:"name"`     // 用户名
    Password string `json:"password"` // 密码
}

// ChannelURL RTSP频道地址
type ChannelURL struct {
    Channel int    `json:"channel"` // 通道号
    URL     string `json:"url"`     // RTSP 地址
}
```

#### NVR 完整模型

```go
type NVR struct {
    ModelFields
    
    Name       string       `json:"name"`        // NVR 名称
    URL        string       `json:"url"`         // NVR 访问地址 (IP:Port)
    BuildingID int64        `json:"building_id"` // 关联建筑ID (外键)
    AdminUser  AdminUser    `json:"admin_user"`  // 管理员账户
    Users      []User       `json:"users"`       // 普通用户列表
    RTSPUrls   []ChannelURL `json:"rtsp_urls"`   // RTSP 地址列表
    
    // 关联关系 (多对一)
    Building   Building     `json:"building,omitempty"` // 所属建筑
}
```

**字段说明:**
- `name`: NVR 设备的显示名称
- `url`: NVR 的管理访问地址，格式为 `IP:Port` (如: `192.168.1.100:80`)
- `building_id`: 关联的建筑ID
- `admin_user`: 管理员账户信息
- `users`: 普通用户列表
- `rtsp_urls`: RTSP流地址列表，每个包含通道号和对应的RTSP URL

**完整数据示例:**

```json
{
    "id": 1,
    "name": "A楼监控系统",
    "url": "192.168.1.100:8080",
    "building_id": 5,
    "admin_user": {
        "name": "admin",
        "password": "admin123"
    },
    "users": [
        {
            "name": "operator1",
            "password": "pass123"
        },
        {
            "name": "operator2",
            "password": "pass456"
        }
    ],
    "rtsp_urls": [
        {
            "channel": 1,
            "url": "rtsp://192.168.1.100:554/stream1"
        },
        {
            "channel": 2,
            "url": "rtsp://192.168.1.100:554/stream2"
        },
        {
            "channel": 3,
            "url": "rtsp://192.168.1.100:554/stream3"
        }
    ],
    "building": {
        "id": 5,
        "name": "办公楼A栋"
    },
    "createdAt": "2025-11-24T10:00:00Z",
    "updatedAt": "2025-11-24T10:00:00Z"
}
```