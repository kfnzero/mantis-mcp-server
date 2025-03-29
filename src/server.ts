import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { isMantisConfigured } from "./config/index.js";
import mantisApi, { MantisApiError } from "./services/mantisApi.js";
import { log } from "./utils/logger.js";

// 定義日誌數據類型
interface LogData {
  tool: string;
  [key: string]: any;
  error?: any;
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: "Mantis MCP Server",
    version: "0.1.0",
  });

  // 獲取問題列表
  server.tool(
    "get_issues",
    "獲取 Mantis 問題列表，可根據多個條件進行過濾",
    {
      projectId: z.number().optional().describe("專案 ID"),
      statusId: z.number().optional().describe("狀態 ID"),
      handlerId: z.number().optional().describe("處理人 ID"),
      reporterId: z.number().optional().describe("報告者 ID"),
      search: z.string().optional().describe("搜尋關鍵字"),
      limit: z.number().optional().default(20).describe("回傳數量限制"),
      offset: z.number().optional().default(0).describe("分頁起始位置"),
    },
    async (params) => {
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
          };
        }

        // 從 Mantis API 獲取問題
        const issues = await mantisApi.getIssues(params);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(issues, null, 2),
            },
          ],
        };
      } catch (error) {
        // 處理錯誤情況
        let errorMessage = "獲取問題時發生錯誤";
        let logData: LogData = { tool: "get_issues", params };
        
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
        };
      }
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
          };
        }

        // 從 Mantis API 獲取問題詳情
        const issue = await mantisApi.getIssueById(issueId);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(issue, null, 2),
            },
          ],
        };
      } catch (error) {
        // 處理錯誤情況
        let errorMessage = "獲取問題詳情時發生錯誤";
        let logData: LogData = { tool: "get_issue_by_id", issueId };
        
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
        };
      }
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
          };
        }

        // 從 Mantis API 根據用戶名稱查詢用戶
        const user = await mantisApi.getUserByUsername(params.username);

        return {
          content: [
            {
              type: "text", 
              text: JSON.stringify(user, null, 2),
            },
          ],
        };
      } catch (error) {
        // 處理錯誤情況
        let errorMessage = "查詢用戶時發生錯誤";
        let logData: LogData = { tool: "get_user", username: params.username };
        
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
        };
      }
    }
  );

  // 獲取專案列表
  server.tool(
    "get_projects",
    "獲取 Mantis 專案列表",
    {},
    async () => {
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
          };
        }

        // 從 Mantis API 獲取專案
        const projects = await mantisApi.getProjects();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(projects, null, 2),
            },
          ],
        };
      } catch (error) {
        // 處理錯誤情況
        let errorMessage = "獲取專案列表時發生錯誤";
        let logData: LogData = { tool: "get_projects" };
        
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
        };
      }
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
          };
        }

        // 從 Mantis API 獲取問題並處理統計
        const issues = await mantisApi.getIssues({
          projectId: params.projectId,
          limit: 1000 // 獲取大量數據用於統計
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
        /**
         * 根據時間範圍過濾issues
         * @param period 時間範圍: all-全部, today-今天, week-本週, month-本月
         */
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        switch(params.period) {
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
        if(!filteredIssues || filteredIssues.length === 0){
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ error: "沒有查詢到任何Issue" }, null, 2),
              },
            ]
          }
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

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(statistics, null, 2),
            },
          ],
        };
      } catch (error) {
        // 處理錯誤情況
        let errorMessage = "獲取問題統計時發生錯誤";
        let logData: LogData = { 
          tool: "get_issue_statistics", 
          params,
          groupBy: params.groupBy,
          period: params.period
        };
        
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
        };
      }
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
          };
        }

        // 獲取問題
        const issues = await  mantisApi.getIssues({
          projectId: params.projectId,
          limit: 1000 // 獲取大量數據用於統計
        })
        
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

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(statistics, null, 2),
            },
          ],
        };
      } catch (error) {
        // 處理錯誤情況
        let errorMessage = "獲取分派統計時發生錯誤";
        let logData: LogData = { 
          tool: "get_assignment_statistics", 
          params,
          includeUnassigned: params.includeUnassigned,
          hasStatusFilter: !!params.statusFilter
        };
        
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
        };
      }
    }
  );

  return server;
}
