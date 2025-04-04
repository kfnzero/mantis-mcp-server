import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { isMantisConfigured } from "./config/index.js";
import mantisApi, { MantisApiError, User } from "./services/mantisApi.js";
import { log } from "./utils/logger.js";
import { gzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);

// 定義壓縮閾值（單位：字節）
const COMPRESSION_THRESHOLD = 1024 * 100; // 100KB

// 定義日誌數據類型
interface LogData {
  tool: string;
  [key: string]: any;
  error?: any;
}

// 高階函數：檢查 Mantis 配置並執行工具邏輯
async function withMantisConfigured<T>(
  toolName: string,
  action: () => Promise<T>
): Promise<{
  [x: string]: unknown;
  content: Array<{
    [x: string]: unknown;
    type: "text";
    text: string;
  }>;
  _meta?: { [key: string]: unknown } | undefined;
  isError?: boolean | undefined;
}> {
  try {
    // 檢查是否已配置 Mantis API
    if (!isMantisConfigured()) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: "Mantis API 尚未配置",
                message: "請在環境變數中設定 MANTIS_API_URL 和 MANTIS_API_KEY"
              },
              null,
              2
            ),
          },
        ],
        isError: true
      };
    }

    // 執行工具邏輯
    const result = await action();
    return {
      content: [
        {
          type: "text",
          text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    // 處理錯誤情況
    let errorMessage = `執行 ${toolName} 時發生錯誤`;
    let logData: LogData = { tool: toolName };

    if (error instanceof MantisApiError) {
      errorMessage = `Mantis API 錯誤: ${error.message}`;
      if (error.statusCode) {
        errorMessage += ` (HTTP ${error.statusCode})`;
        logData = { ...logData, statusCode: error.statusCode };
      }
      log.error(errorMessage, { ...logData, error: error.message });
    } else if (error instanceof Error) {
      errorMessage = error.message;
      log.error(errorMessage, { ...logData, error: error.stack });
    } else {
      log.error(errorMessage, { ...logData, error });
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: errorMessage,
            },
            null,
            2
          ),
        },
      ],
      isError: true
    };
  }
}

// 壓縮 JSON 數據
async function compressJsonData(data: any): Promise<string> {
  const jsonString = JSON.stringify(data);
  if (jsonString.length < COMPRESSION_THRESHOLD) {
    return jsonString;
  }

  const compressed = await gzipAsync(Buffer.from(jsonString));
  return compressed.toString('base64');
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: "Mantis MCP Server",
    version: "0.1.0",
  });

  // 獲取問題列表
  server.tool(
    "get_issues",
    "獲取 Mantis 問題列表，可根據多個條件進行過濾，建議查詢時select選擇id,summary,description就好，資訊過多可能導致程式異常",
    {
      projectId: z.number().optional().describe("專案 ID"),
      statusId: z.number().optional().describe("狀態 ID"),
      handlerId: z.number().optional().describe("處理人 ID"),
      reporterId: z.number().optional().describe("報告者 ID"),
      search: z.string().optional().describe("搜尋關鍵字"),
      pageSize: z.number().optional().default(20).describe("頁數大小"),
      page: z.number().optional().default(0).describe("分頁起始位置，從1開始"),
      select: z.array(z.string()).optional().describe("選擇要返回的欄位，例如：['id', 'summary', 'description']"),
    },
    async (params) => {
      return withMantisConfigured("get_issues", async () => {
        const issues = await mantisApi.getIssues(params);
        const jsonString = JSON.stringify(issues);
        
        if (jsonString.length < COMPRESSION_THRESHOLD) {
          return jsonString;
        }

        const compressed = await gzipAsync(Buffer.from(jsonString));
        const base64Data = compressed.toString('base64');

        return JSON.stringify({
          compressed: true,
          data: base64Data,
          originalSize: jsonString.length,
          compressedSize: base64Data.length
        });
      });
    }
  );

  // 根據 ID 獲取問題詳情
  server.tool(
    "get_issue_by_id",
    "根據 ID 獲取 Mantis 問題詳情",
    {
      issueId: z.number().describe("問題 ID"),
    },
    async ({ issueId }) => {
      return withMantisConfigured("get_issue_by_id", async () => {
        const issue = await mantisApi.getIssueById(issueId);
        return JSON.stringify(issue, null, 2);
      });
    }
  );

  // 根據用戶名稱查詢用戶
  server.tool(
    "get_user",
    "根據用戶名稱查詢 Mantis 用戶",
    {
      username: z.string().describe("用戶名稱")
    },
    async (params) => {
      return withMantisConfigured("get_user", async () => {
        const user = await mantisApi.getUserByUsername(params.username);
        return JSON.stringify(user, null, 2);
      });
    }
  );

  // 獲取專案列表
  server.tool(
    "get_projects",
    "獲取 Mantis 專案列表",
    {},
    async () => {
      return withMantisConfigured("get_projects", async () => {
        const projects = await mantisApi.getProjects();
        return JSON.stringify(projects, null, 2);
      });
    }
  );

  // 獲取問題統計
  server.tool(
    "get_issue_statistics",
    "獲取 Mantis 問題統計數據，根據不同維度進行分析",
    {
      projectId: z.number().optional().describe("專案 ID"),
      groupBy: z.enum(['status', 'priority', 'severity', 'handler', 'reporter']).describe("分組依據"),
      period: z.enum(['all', 'today', 'week', 'month']).default('all').describe("時間範圍<all-全部, today-今天, week-本週, month-本月>"),
    },
    async (params) => {
      return withMantisConfigured("get_issue_statistics", async () => {
        // 從 Mantis API 獲取問題並處理統計
        const issues = await mantisApi.getIssues({
          projectId: params.projectId,
          pageSize: 1000 // 獲取大量數據用於統計
        });

        // 建立統計結果
        const statistics = {
          total: issues.length,
          groupedBy: params.groupBy,
          period: params.period,
          data: {} as Record<string, number>
        };

        // 根據時間範圍過濾
        let filteredIssues = issues;
        log.debug("根據時間範圍過濾issues", { issues, params });
        
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        switch (params.period) {
          case 'today':
            filteredIssues = issues.filter(issue => {
              const createdAt = new Date(issue.created_at);
              return createdAt >= startOfDay;
            });
            break;
          case 'week':
            filteredIssues = issues.filter(issue => {
              const createdAt = new Date(issue.created_at);
              return createdAt >= startOfWeek;
            });
            break;
          case 'month':
            filteredIssues = issues.filter(issue => {
              const createdAt = new Date(issue.created_at);
              return createdAt >= startOfMonth;
            });
            break;
          case 'all':
          default:
            // 保持原有的issues不變
            break;
        }

        if (!filteredIssues || filteredIssues.length === 0) {
          return { error: "沒有查詢到任何Issue" };
        }

        // 根據分組依據進行統計
        filteredIssues.forEach(issue => {
          let key = '';

          switch (params.groupBy) {
            case 'status':
              key = issue.status?.name || 'unknown';
              break;
            case 'priority':
              key = issue.priority?.name || 'unknown';
              break;
            case 'severity':
              key = issue.severity?.name || 'unknown';
              break;
            case 'handler':
              key = issue.handler?.name || 'unassigned';
              break;
            case 'reporter':
              key = issue.reporter?.name || 'unknown';
              break;
          }

          statistics.data[key] = (statistics.data[key] || 0) + 1;
        });

        return JSON.stringify(statistics, null, 2);
      });
    }
  );

  // 獲取分派統計
  server.tool(
    "get_assignment_statistics",
    "獲取 Mantis 問題分派統計數據，分析不同用戶的問題分派情況",
    {
      projectId: z.number().optional().describe("專案 ID"),
      includeUnassigned: z.boolean().default(true).describe("是否包含未分派問題"),
      statusFilter: z.array(z.number()).optional().describe("狀態過濾器，只計算特定狀態的問題"),
    },
    async (params) => {
      return withMantisConfigured("get_assignment_statistics", async () => {
        // 獲取問題
        const issues = await mantisApi.getIssues({
          projectId: params.projectId,
          pageSize: 1000 // 獲取大量數據用於統計
        });

        // 過濾問題
        let filteredIssues = issues;
        if (params.statusFilter?.length) {
          filteredIssues = issues.filter(issue =>
            params.statusFilter?.includes(issue.status.id)
          );
        }

        // 建立用戶問題統計
        const userMap = new Map<number, {
          id: number;
          name: string;
          email: string;
          issueCount: number;
          openIssues: number;
          closedIssues: number;
          issues: number[];
        }>();

        // 從問題中收集所有處理人ID
        const handlerIds = new Set<number>();
        filteredIssues.forEach(issue => {
          if (issue.handler?.id) {
            handlerIds.add(issue.handler.id);
          }
        });

        // 查詢每個處理人的詳細資訊並初始化統計
        for (const handlerId of handlerIds) {
          const user = await mantisApi.getUser(handlerId);
          userMap.set(user.id, {
            id: user.id,
            name: user.name,
            email: user.email || '',
            issueCount: 0,
            openIssues: 0,
            closedIssues: 0,
            issues: []
          });
        }

        // 未分派問題統計
        let unassignedCount = 0;
        let unassignedIssues: number[] = [];

        // 計算統計
        filteredIssues.forEach(issue => {
          if (issue.handler && issue.handler.id) {
            const userStat = userMap.get(issue.handler.id);
            if (userStat) {
              userStat.issueCount++;
              userStat.issues.push(issue.id);

              // 根據狀態判斷是否為關閉狀態
              if (issue.status.name.toLowerCase().includes('closed') ||
                issue.status.name.toLowerCase().includes('resolved')) {
                userStat.closedIssues++;
              } else {
                userStat.openIssues++;
              }
            }
          } else if (params.includeUnassigned) {
            unassignedCount++;
            unassignedIssues.push(issue.id);
          }
        });

        // 構建結果
        const statistics = {
          totalIssues: filteredIssues.length,
          assignedIssues: filteredIssues.length - unassignedCount,
          unassignedIssues: unassignedCount,
          userStatistics: Array.from(userMap.values())
            .filter(stat => stat.issueCount > 0)
            .sort((a, b) => b.issueCount - a.issueCount)
        };

        if (params.includeUnassigned && unassignedCount > 0) {
          statistics.userStatistics.push({
            id: 0,
            name: "未分派",
            email: "",
            issueCount: unassignedCount,
            openIssues: unassignedCount,
            closedIssues: 0,
            issues: unassignedIssues
          });
        }

        return JSON.stringify(statistics, null, 2);
      });
    }
  );

  // 獲取指定專案的所有用戶
  server.tool(
    "get_users_by_project_id",
    "獲取指定專案的所有用戶",
    {
      projectId: z.number().describe("專案 ID"),
    },
    async (params) => {
      return withMantisConfigured("get_users_by_project_id", async () => {
        const users = await mantisApi.getUsersByProjectId(params.projectId);
        return JSON.stringify(users, null, 2);
      });
    }
  );

  // 獲取所有用戶
  server.tool(
    "get_users",
    "用暴力法強制取得所有用戶",
    {},
    async () => {
      return withMantisConfigured("get_users", async () => {
        let notFoundCount = 0;
        let id = 1;
        let users: User[] = [];
        do {
          try {
            const user = await mantisApi.getUser(id);
            users.push(user);
            id++;
            notFoundCount = 0; // 重置計數器
          } catch (error) {
            if (error instanceof MantisApiError && error.statusCode === 404) {
              notFoundCount++;
              id++;
            }
          }
        } while (notFoundCount < 10);
        return JSON.stringify(users, null, 2);
      });
    }
  );

  return server;
}
