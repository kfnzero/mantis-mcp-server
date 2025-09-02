# Mantis MCP Server

[![smithery badge](https://smithery.ai/badge/@kfnzero/mantis-mcp-server)](https://smithery.ai/server/@kfnzero/mantis-mcp-server)

Mantis MCP Server 是一個基於 Model Context Protocol (MCP) 的服務，用於與 Mantis Bug Tracker 系統進行集成。它提供了一系列工具，允許用戶通過 MCP 協議查詢和分析 Mantis 系統中的數據。

<a href="https://glama.ai/mcp/servers/@kfnzero/mantis-mcp-server">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@kfnzero/mantis-mcp-server/badge" alt="Mantis Server MCP server" />
</a>

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
- 效能優化
  - 欄位選擇（減少回傳資料量）
  - 分頁處理（控制每次返回數量）
  - 自動資料壓縮（大量資料時自動壓縮）
- 完整的錯誤處理和日誌記錄

## 安裝

### Installing via Smithery

To install Mantis Bug Tracker Integration for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@kfnzero/mantis-mcp-server):

```bash
npx -y @smithery/cli install @kfnzero/mantis-mcp-server --client claude
```

### Manual Installation
```bash
npm install mantis-mcp-server
```

## 配置

1. 在專案根目錄建立 `.env` 文件：

```bash
# Mantis API 配置
MANTIS_API_URL=https://your-mantis-instance.com/api/rest
MANTIS_API_KEY=your_api_key_here

# 應用配置
NODE_ENV=development  # development, production, test
LOG_LEVEL=info       # error, warn, info, debug

# 快取配置
CACHE_ENABLED=true
CACHE_TTL_SECONDS=300  # 5分鐘

# 日誌配置
LOG_DIR=logs
ENABLE_FILE_LOGGING=false
```

### MantisBT API Key 獲取方式

1. 登入您的 MantisBT 帳戶
2. 點擊右上角的用戶名稱，選擇「我的帳戶」
3. 切換到「API 令牌」標籤
4. 點擊「創建新令牌」按鈕
5. 輸入令牌名稱（例如：MCP Server）
6. 複製生成的 API 令牌，並將其貼入 `.env` 文件的 `MANTIS_API_KEY` 設置中

## MCP 配置

### 全域安裝

首先，需要全域安裝 mantis-mcp-server：

```bash
npm install -g mantis-mcp-server
```

### Windows 配置

在 Windows 系統中，編輯 `%USERPROFILE%\.cursor\mcp.json`（通常在 `C:\Users\你的用戶名\.cursor\mcp.json`），添加以下配置：

```json
{
  "mcpServers": {
    "mantis-mcp-server": {
      "type": "stdio",
      "command": "cmd",
      "args": [
        "/c",
        "node",
        "%APPDATA%\\npm\\node_modules\\mantis-mcp-server\\dist\\index.js"
      ],
      "env": {
        "MANTIS_API_URL": "YOUR_MANTIS_API_URL",
        "MANTIS_API_KEY": "YOUR_MANTIS_API_KEY",
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### macOS/Linux 配置

在 macOS 或 Linux 系統中，編輯 `~/.cursor/mcp.json`，添加以下配置：

```json
{
  "mcpServers": {
    "mantis-mcp-server": {
      "command": "npx",
      "args": [
        "-y",
        "mantis-mcp-server@latest",
      ],
      "env": {
        "MANTIS_API_URL": "YOUR_MANTIS_API_URL",
        "MANTIS_API_KEY": "YOUR_MANTIS_API_KEY",
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

> 注意：在 macOS/Linux 中，我們使用 npx 來運行最新版本的 mantis-mcp-server，這樣可以確保始終使用最新版本，不需要全域安裝。

### 環境變數說明

- `MANTIS_API_URL`: 您的 Mantis API URL
- `MANTIS_API_KEY`: 您的 Mantis API 金鑰
- `NODE_ENV`: 執行環境，建議設置為 "production"
- `LOG_LEVEL`: 日誌級別，可選值：error、warn、info、debug

### 驗證配置

配置完成後，您可以：

1. 重新載入 Cursor MCP
2. 開啟命令面板（Windows: Ctrl+Shift+P, Mac: Cmd+Shift+P）

## 在 Cursor 中設定

1. 在 `.vscode/mcp.json` 中添加以下配置：

```json
{
  "servers": {
    "mantis-mcp-server": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/dist/index.js"]
    }
  }
}
```

2. 在 `.vscode/launch.json` 中添加以下配置用於除錯：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug MCP Server",
      "skipFiles": ["<node_internals>/**"],
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "runtimeExecutable": "npx",
      "runtimeArgs": [
        "-y",
        "@modelcontextprotocol/inspector",
        "node",
        "dist/index.js"
      ],
      "console": "integratedTerminal",
      "preLaunchTask": "npm: watch",
      "serverReadyAction": {
        "action": "openExternally",
        "pattern": "running at (https?://\\S+)",
        "uriFormat": "%s?timeout=60000"
      },
      "envFile": "${workspaceFolder}/.env"
    }
  ]
}
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
- `pageSize` (可選, 默認 20): 頁數大小
- `page` (可選, 默認 0): 分頁起始位置，從1開始
- `select` (可選): 選擇要返回的欄位，例如：['id', 'summary', 'description']。可用於減少回傳資料量

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

## 代碼結構

### 高階函數
服務使用 `withMantisConfigured` 高階函數來處理共用的檢查邏輯，確保：
- Mantis API 配置檢查
- 統一的錯誤處理
- 標準化的回應格式
- 自動的日誌記錄

### 錯誤處理
完整的錯誤處理機制包括：
- Mantis API 錯誤處理（包含 HTTP 狀態碼）
- 通用錯誤處理
- 結構化的錯誤響應
- 詳細的錯誤日誌

## 開發

```bash
# 安裝依賴
npm install

# 構建
npm run build

# 開發模式（監視變更）
npm run watch

# 運行
npm start
```

## 日誌

如果啟用了檔案日誌（`ENABLE_FILE_LOGGING=true`），日誌文件將保存在：

- `logs/mantis-mcp-server-combined.log`: 所有級別的日誌
- `logs/mantis-mcp-server-error.log`: 僅錯誤級別的日誌

日誌文件大小上限為 5MB，最多保留 5 個歷史文件。

## 許可證

MIT

## 參考

@https://documenter.getpostman.com/view/29959/7Lt6zkP#c0c24256-341e-4649-95cb-ad7bdc179399 


# 發布
npm login --registry=https://registry.npmjs.org/
npm run build
npm publish --access public --registry=https://registry.npmjs.org/

# 更新版本號
npm version patch  # 修復版本 0.0.x
npm version minor  # 次要版本 0.x.0
npm version major  # 主要版本 x.0.0

# 重新發布
npm publish
