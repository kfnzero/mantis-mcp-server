# Mantis MCP Server

Mantis MCP Server 是一個基於 Model Context Protocol (MCP) 的服務，用於與 Mantis Bug Tracker 系統進行集成。它提供了一系列工具，允許用戶通過 MCP 協議查詢和分析 Mantis 系統中的數據。

## 功能

- 問題管理
  - 獲取問題列表（支持多種過濾條件）
  - 根據 ID 查詢問題詳情
- 用戶管理
  - 根據用戶名稱查詢用戶
  - 獲取所有用戶列表
- 專案管理
  - 獲取專案列表
- 統計分析
  - 問題統計（支持多維度分析）
  - 分派統計（分析問題分派情況）
- 完整的錯誤處理和日誌記錄

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

### MantisBT API Key 獲取方式

1. 登入您的 MantisBT 帳戶
2. 點擊右上角的用戶名稱，選擇「我的帳戶」
3. 切換到「API 令牌」標籤
4. 點擊「創建新令牌」按鈕
5. 輸入令牌名稱（例如：MCP Server）
6. 複製生成的 API 令牌，並將其貼入 `.env` 文件的 `MANTIS_API_KEY` 設置中

## 構建與運行

```bash
# 構建
npm run build

# 運行
npm start

# 開發模式（監視變更）
npm run watch
```

## API 工具說明

### 1. 獲取問題列表 (get_issues)

獲取 Mantis 問題列表，可根據多個條件進行過濾。

**參數：**
- `projectId` (可選): 專案 ID
- `statusId` (可選): 狀態 ID
- `handlerId` (可選): 處理人 ID
- `reporterId` (可選): 報告者 ID
- `search` (可選): 搜尋關鍵字
- `limit` (可選, 默認 20): 回傳數量限制
- `offset` (可選, 默認 0): 分頁起始位置

### 2. 獲取問題詳情 (get_issue_by_id)

根據 ID 獲取 Mantis 問題詳情。

**參數：**
- `issueId`: 問題 ID

### 3. 查詢用戶 (get_user)

根據用戶名稱查詢 Mantis 用戶。

**參數：**
- `username`: 用戶名稱

### 4. 獲取專案列表 (get_projects)

獲取 Mantis 專案列表。

**參數：** 無

### 5. 獲取問題統計 (get_issue_statistics)

獲取 Mantis 問題統計數據，根據不同維度進行分析。

**參數：**
- `projectId` (可選): 專案 ID
- `groupBy`: 分組依據，可選值: 'status', 'priority', 'severity', 'handler', 'reporter'
- `period` (默認 'all'): 時間範圍，可選值: 'all', 'today', 'week', 'month'

### 6. 獲取分派統計 (get_assignment_statistics)

獲取 Mantis 問題分派統計數據，分析不同用戶的問題分派情況。

**參數：**
- `projectId` (可選): 專案 ID
- `includeUnassigned` (默認 true): 是否包含未分派問題
- `statusFilter` (可選): 狀態過濾器，只計算特定狀態的問題

### 7. 獲取所有用戶 (get_users)

用暴力法獲取所有用戶列表。

**參數：** 無

## 錯誤處理

服務內建完整的錯誤處理機制：

- Mantis API 錯誤處理
- HTTP 狀態碼處理
- 詳細的錯誤日誌記錄
- 友好的錯誤響應格式

錯誤響應格式：
```json
{
  "error": "錯誤描述",
  "message": "詳細錯誤信息"
}
```

## 許可證

MIT

## 參考

@https://documenter.getpostman.com/view/29959/7Lt6zkP#c0c24256-341e-4649-95cb-ad7bdc179399 


# 發布
npm login
npm run build
npm publish --access public

# 更新版本號
npm version patch  # 修復版本 0.0.x
npm version minor  # 次要版本 0.x.0
npm version major  # 主要版本 x.0.0

# 重新發布
npm publish