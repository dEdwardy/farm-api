# Supabase Edge Functions 接口文档

## 1. 云函数基本信息

### 1.1 函数概览

| 函数名称 | 功能描述 | 部署环境 |
|---------|---------|----------|
| farm-file | 养殖场文件管理，包括数据导出、导入和文件上传预签名URL生成 | Supabase Edge Functions |

### 1.2 部署信息

- **运行环境**：Deno Edge Runtime
- **框架**：Hono
- **依赖**：
  - hono@^4.12.5
  - @supabase/supabase-js@^2.39.0
  - xlsx@^0.18.5
  - zod@^4.3.6

## 2. 接口详情

### 2.1 导出养殖场数据接口

#### 2.1.1 基本信息

- **接口路径**：`/farm-file/export`
- **请求方法**：POST
- **功能描述**：导出养殖场数据为Excel文件
- **认证方式**：JWT Token（通过Authorization头传递）

#### 2.1.2 请求参数

| 参数名称 | 类型 | 必填 | 描述 | 默认值 |
|---------|------|------|------|--------|
| Authorization | string | 是 | 认证Token，格式为 `Bearer <token>` | 无 |
| page | number | 否 | 页码 | 1 |
| limit | number | 否 | 每页记录数，0表示无限制 | 0 |

#### 2.1.3 返回数据结构

- **成功响应**：
  - 类型：Excel文件（application/vnd.openxmlformats-officedocument.spreadsheetml.sheet）
  - 文件名：`Farm_Export_<timestamp>.xlsx`

- **失败响应**：

| 字段名称 | 类型 | 描述 |
|---------|------|------|
| success | boolean | 操作是否成功 |
| message | string | 错误信息 |
| error | string | 详细错误信息（可选） |

#### 2.1.4 错误码说明

| 状态码 | 错误信息 | 描述 |
|-------|---------|------|
| 400 | 请求体格式错误，必须是有效的JSON | 请求体不是有效的JSON格式 |
| 401 | 缺少认证token | 未提供有效的JWT Token |
| 500 | 服务器内部错误 | 服务器内部错误 |

#### 2.1.5 调用限制及注意事项

- 需携带有效的JWT Token
- 导出的数据量默认限制为1000条记录，可通过limit参数调整
- 当limit=0时，导出全部数据（但可能受服务器内存限制）

#### 2.1.6 调用示例

```javascript
// 调用导出接口（导出全部数据）
async function exportAllFarmsData(token) {
  try {
    const response = await fetch('https://your-project.supabase.co/functions/v1/farm-file/export', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        limit: 0 // 导出全部数据
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '导出失败');
    }

    // 处理Excel文件响应
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('导出失败:', error);
    throw error;
  }
}

// 调用导出接口（分页导出）
async function exportFarmsDataWithPagination(token, page, limit) {
  try {
    const response = await fetch('https://your-project.supabase.co/functions/v1/farm-file/export', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        page,
        limit
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '导出失败');
    }

    // 处理Excel文件响应
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('导出失败:', error);
    throw error;
  }
}
```

### 2.2 导入养殖场数据接口

#### 2.2.1 基本信息

- **接口路径**：`/farm-file/import`
- **请求方法**：POST
- **功能描述**：从Excel文件导入养殖场数据
- **认证方式**：JWT Token（通过Authorization头传递）

#### 2.2.2 请求参数

| 参数名称 | 类型 | 必填 | 描述 | 默认值 |
|---------|------|------|------|--------|
| file | File | 是 | Excel文件，支持.xlsx和.xls格式 | 无 |
| Authorization | string | 是 | 认证Token，格式为 `Bearer <token>` | 无 |

#### 2.2.3 返回数据结构

| 字段名称 | 类型 | 描述 |
|---------|------|------|
| success | boolean | 操作是否成功 |
| message | string | 操作结果消息 |
| data | object | 导入结果详情 |
| data.total | number | 总记录数 |
| data.successCount | number | 成功导入的记录数 |
| data.failCount | number | 导入失败的记录数 |
| data.errors | array | 错误详情列表 |
| data.errors[].row | number | 错误所在行 |
| data.errors[].field | string | 错误字段 |
| data.errors[].error | string | 错误信息 |
| data.warnings | array | 警告信息列表 |

#### 2.2.4 错误码说明

| 状态码 | 错误信息 | 描述 |
|-------|---------|------|
| 400 | 请上传Excel文件 | 未提供文件 |
| 400 | Excel文件中没有数据 | Excel文件为空或只有表头 |
| 400 | 缺少必要字段：xxx | 缺少必要的养殖场信息字段 |
| 400 | 单次导入最多支持1000条记录 | 导入记录数超过限制 |
| 401 | 缺少认证token | 未提供有效的JWT Token |
| 413 | 文件大小不能超过10MB | 文件大小超过限制 |
| 415 | 只支持.xlsx和.xls格式的Excel文件 | 文件格式不支持 |
| 500 | 服务器内部错误 | 服务器内部错误 |

#### 2.2.5 调用限制及注意事项

- 需携带有效的JWT Token
- 文件大小限制：10MB
- 单次导入最大记录数：1000条
- 支持的文件格式：.xlsx和.xls
- Excel文件需包含必要的养殖场信息字段

#### 2.2.6 调用示例

```javascript
// 调用导入接口
async function importFarmsData(token, file) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://your-project.supabase.co/functions/v1/farm-file/import', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // 注意：使用FormData时不要设置Content-Type
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '导入失败');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('导入失败:', error);
    throw error;
  }
}
```

### 2.3 生成OSS上传预签名URL接口

#### 2.3.1 基本信息

- **接口路径**：`/farm-file/sign-url`
- **请求方法**：POST
- **功能描述**：生成OSS上传预签名URL，用于前端直接上传文件到OSS
- **认证方式**：JWT Token（通过Authorization头传递）

#### 2.3.2 请求参数

| 参数名称 | 类型 | 必填 | 描述 | 默认值 |
|---------|------|------|------|--------|
| fileName | string | 是 | 文件名 | 无 |
| fileType | string | 是 | 文件MIME类型 | 无 |
| Authorization | string | 是 | 认证Token，格式为 `Bearer <token>` | 无 |

#### 2.3.3 返回数据结构

| 字段名称 | 类型 | 描述 |
|---------|------|------|
| uploadUrl | string | 预签名上传URL |
| objectKey | string | OSS对象键 |
| originalName | string | 原始文件名 |
| expires | number | URL过期时间（秒） |

#### 2.3.4 错误码说明

| 状态码 | 错误信息 | 描述 |
|-------|---------|------|
| 400 | fileName和fileType为必填参数 | 缺少必要参数 |
| 400 | fileName必须是非空字符串 | fileName格式错误 |
| 400 | fileName长度不能超过255个字符 | fileName长度超过限制 |
| 400 | fileType必须是非空字符串 | fileType格式错误 |
| 400 | 文件类型不允许，支持的类型：xxx | 文件类型不支持 |
| 401 | 缺少认证token | 未提供有效的JWT Token |
| 500 | 服务器内部错误 | 服务器内部错误 |

#### 2.3.5 调用限制及注意事项

- 需携带有效的JWT Token
- 支持的文件类型：
  - 图片：image/jpeg, image/png, image/gif
  - 文档：application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document
  - 表格：application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  - 演示文稿：application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation
- 预签名URL有效期：1小时

#### 2.3.6 调用示例

```javascript
// 调用生成预签名URL接口
async function generateUploadUrl(token, fileName, fileType) {
  try {
    const response = await fetch('https://your-project.supabase.co/functions/v1/farm-file/sign-url', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName,
        fileType
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '生成预签名URL失败');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('生成预签名URL失败:', error);
    throw error;
  }
}
```

## 3. 通用错误处理

所有接口的错误响应格式统一为：

```json
{
  "success": false,
  "message": "错误信息",
  "error": "详细错误信息" // 可选
}
```

## 4. 调用注意事项

1. **认证**：所有接口都需要在请求头中携带有效的JWT Token
2. **文件大小**：导入文件大小限制为10MB
3. **导入记录数**：单次导入最多支持1000条记录
4. **文件格式**：导入只支持.xlsx和.xls格式的Excel文件
5. **预签名URL**：生成的预签名URL有效期为1小时
6. **文件类型**：上传文件类型需在白名单内
7. **导出限制**：默认导出限制为1000条记录，可通过limit参数调整

## 5. 部署信息

- **函数名称**：farm-file
- **部署命令**：`supabase functions deploy farm-file`
- **本地开发**：`supabase functions serve farm-file`

## 6. 代码结构

```
supabase/functions/farm-file/
├── index.ts              # 函数入口，定义路由
└── services/
    ├── middleware/
    │   ├── auth.ts       # JWT认证中间件
    │   ├── cors.ts       # CORS中间件
    │   └── error.ts      # 错误处理中间件
    ├── constants.ts      # 常量定义
    ├── database.ts       # 数据库操作
    ├── excel.ts          # Excel处理
    ├── handlers.ts       # 接口处理函数
    ├── header-matching.ts # 表头匹配
    ├── oss.ts            # OSS操作
    ├── types.ts          # 类型定义
    ├── utils.ts          # 工具函数
    └── validation.ts     # 数据验证
```