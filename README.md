# Mantis MCP Server

Mantis MCP Server 是一個基於 Model Context Protocol (MCP) 的服務，用於與 Mantis Bug Tracker 系統進行集成。它提供了一系列工具，允許用戶通過 MCP 協議查詢和與 Mantis 系統進行交互。

## 功能

- 獲取問題列表，支持多種過濾條件
- 根據 ID 查詢問題詳情
- 獲取用戶列表
- 獲取項目列表
- 緩存機制，提高響應速度
- 完整的錯誤處理

## 安裝

```bash
npm install
```

## 配置

1. 複製 `.env.example` 文件並重命名為 `.env`：
   ```bash
   cp .env.example .env
   ```

2. 在 `.env` 文件中設置您的 Mantis API 配置：
   ```
   MANTIS_API_URL=https://your-mantis-instance.com/api/rest
   MANTIS_API_KEY=your_api_key_here
   ```

### MantisBT 2.26.0 API Key 獲取方式

1. 登入您的 MantisBT 帳戶
2. 點擊右上角的用戶名稱，選擇「我的帳戶」
3. 切換到「API 令牌」標籤
4. 點擊「創建新令牌」按鈕
5. 輸入令牌名稱（例如：MCP Server）
6. 複製生成的 API 令牌，並將其貼入 `.env` 文件的 `MANTIS_API_KEY` 設置中

注意：MantisBT 2.26.0 需要使用 `Bearer` 認證方式，本應用已經內建該支持。

## 構建

```bash
npm run build
```

## 運行

```bash
npm start
```

## 開發

監視模式下運行（自動重新編譯）：

```bash
npm run watch
```

## 工具說明

### 獲取問題列表

```
get_issues
```

參數：
- `projectId` (可選): 項目 ID
- `statusId` (可選): 狀態 ID
- `handlerId` (可選): 處理人 ID
- `reporterId` (可選): 報告者 ID
- `search` (可選): 搜尋關鍵字
- `limit` (可選, 默認 20): 返回數量限制
- `offset` (可選, 默認 0): 分頁起始位置

### 獲取問題詳情

```
get_issue_by_id
```

參數：
- `issueId`: 問題 ID

### 獲取用戶列表

```
get_users
```

無需參數

### 獲取項目列表

```
get_projects
```

無需參數

### 獲取問題統計

```
get_issue_statistics
```

參數：
- `projectId` (可選): 項目 ID
- `groupBy`: 分組依據，可選值: 'status', 'priority', 'severity', 'handler', 'reporter'
- `period` (可選, 默認 'all'): 時間範圍，可選值: 'all', 'today', 'week', 'month'

### 獲取分派統計

```
get_assignment_statistics
```

參數：
- `projectId` (可選): 項目 ID
- `includeUnassigned` (可選, 默認 true): 是否包含未分派問題
- `statusFilter` (可選): 狀態過濾器，只計算特定狀態的問題，格式為狀態 ID 數組

## API 文檔

### 響應格式

所有 API 響應都使用 JSON 格式。成功的響應將直接返回數據，錯誤響應將包含錯誤信息。

### 認證

API 使用 Bearer Token 認證。在發送請求時，需要在 HTTP Header 中包含：

```
Authorization: your_api_token_here
```

### API 端點

#### 獲取問題列表 GET /issues

獲取問題列表，支持多種過濾條件。

**請求參數:**
- `limit` (可選, 默認 50): 返回結果數量限制
- `offset` (可選, 默認 0): 分頁偏移量
- `project_id` (可選): 按項目 ID 過濾
- `status_id` (可選): 按狀態 ID 過濾
- `handler_id` (可選): 按處理人 ID 過濾
- `reporter_id` (可選): 按報告者 ID 過濾
- `priority` (可選): 按優先級過濾
- `severity` (可選): 按嚴重程度過濾
- `search` (可選): 搜索關鍵字

**響應示例:**
```json
[
  {
    "id": 1,
    "summary": "問題標題",
    "description": "問題描述",
    "status": {
      "id": 10,
      "name": "新建"
    },
    "project": {
      "id": 1,
      "name": "測試項目"
    },
    "category": {
      "id": 1,
      "name": "一般"
    },
    "reporter": {
      "id": 1,
      "name": "reporter",
      "email": "reporter@example.com"
    },
    "created_at": "2024-03-20T10:00:00Z",
    "updated_at": "2024-03-20T10:00:00Z"
  }
]
```

#### 獲取問題詳情 GET /issues/{id}

獲取單個問題的詳細信息。

**路徑參數:**
- `id`: 問題 ID

**響應格式同問題列表的單個問題對象**

#### 獲取當前用戶信息 GET /users/me

獲取當前認證用戶的信息。

**響應示例:**
```json
{
  "id": 1,
  "name": "username",
  "email": "user@example.com",
  "real_name": "Real Name",
  "access_level": {
    "id": 90,
    "name": "administrator"
  },
  "enabled": true
}
```

#### 獲取用戶信息 GET /users/{id}

獲取指定用戶的信息。

**路徑參數:**
- `id`: 用戶 ID

**響應格式同當前用戶信息**

#### 獲取項目列表 GET /projects

獲取所有可訪問的項目列表。

**響應示例:**
```json
[
  {
    "id": 1,
    "name": "測試項目",
    "description": "項目描述",
    "enabled": true,
    "status": {
      "id": 10,
      "name": "開發中"
    }
  }
]
```

### 錯誤處理

當發生錯誤時，API 將返回適當的 HTTP 狀態碼和錯誤信息：

```json
{
  "message": "錯誤描述",
  "code": "錯誤代碼"
}
```

常見錯誤碼：
- 400: 請求參數錯誤
- 401: 未認證或認證失敗
- 403: 權限不足
- 404: 資源不存在
- 500: 服務器內部錯誤

## 許可證

MIT


## 參考

@https://documenter.getpostman.com/view/29959/7Lt6zkP#c0c24256-341e-4649-95cb-ad7bdc179399 