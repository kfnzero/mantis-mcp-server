#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config, isMantisConfigured } from "./config/index.js";
import { createServer } from "./server.js";
import { log } from "./utils/logger.js";

async function main() {
  // 輸出環境配置
  log.info("=== Mantis MCP Server 配置資訊 ===", {
    api_url: config.MANTIS_API_URL,
    api_configured: isMantisConfigured(),
    environment: config.NODE_ENV,
    log_level: config.LOG_LEVEL,
    cache_enabled: config.CACHE_ENABLED,
    cache_ttl: config.CACHE_TTL_SECONDS,
    file_logging: config.ENABLE_FILE_LOGGING ? `啟用 (${config.LOG_DIR})` : '停用'
  });

  if (!isMantisConfigured()) {
    log.warn("Mantis API 未完整配置,部分功能可能無法使用");
  }

  const server: McpServer = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log.info("Mantis MCP Server 已在 stdio 上啟動");
}

main().catch((error) => {
  log.error("主程序發生致命錯誤", { error: error.message, stack: error.stack });
  process.exit(1);
});
