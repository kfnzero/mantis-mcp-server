#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "./config/index.js";
import { createServer } from "./server.js";
import { log } from "./utils/logger.js";

async function main() {
  // 輸出環境配置
  log.info("=== Mantis MCP Server 環境配置 ===", {
    api_url: config.MANTIS_API_URL,
    api_key_set: !!config.MANTIS_API_KEY,
    environment: config.NODE_ENV,
    log_level: config.LOG_LEVEL,
    cache_enabled: config.CACHE_ENABLED,
    cache_ttl: config.CACHE_TTL_SECONDS
  });

  const server: McpServer = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log.info("Mantis MCP Server running on stdio");
}

main().catch((error) => {
  log.error("Fatal error in main()", { error: error.message, stack: error.stack });
  process.exit(1);
});
