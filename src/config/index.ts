import dotenv from 'dotenv';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { log, updateLoggerConfig } from '../utils/logger.js';

// 確保日誌目錄存在
const LOG_DIR = 'logs';
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

// 加載.env文件
const result = dotenv.config();
if (result.error) {
  const errorMessage = `無法載入 .env 檔案: ${result.error.message}`;
  fs.appendFileSync(path.join(LOG_DIR, 'error.log'), `${new Date().toISOString()} - ${errorMessage}\n`);
  throw new Error(errorMessage);
}

// 定義配置模式
const ConfigSchema = z.object({
  // Mantis API 配置
  MANTIS_API_URL: z.string().url().default('https://mantisbt.org/bugs/api/rest'),
  MANTIS_API_KEY: z.string().optional(),
  
  // 應用配置
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // 快取配置
  CACHE_ENABLED: z.coerce.boolean().default(true),
  CACHE_TTL_SECONDS: z.coerce.number().default(300), // 5分鐘
});

// 解析環境變數
const parseConfig = () => {
  try {
    const parsedConfig = ConfigSchema.parse({
      MANTIS_API_URL: process.env.MANTIS_API_URL,
      MANTIS_API_KEY: process.env.MANTIS_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
      LOG_LEVEL: process.env.LOG_LEVEL,
      CACHE_ENABLED: process.env.CACHE_ENABLED,
      CACHE_TTL_SECONDS: process.env.CACHE_TTL_SECONDS,
    });

    // 更新日誌配置
    updateLoggerConfig({
      LOG_LEVEL: parsedConfig.LOG_LEVEL,
      NODE_ENV: parsedConfig.NODE_ENV
    });

    // 檢查必要的配置
    if (!parsedConfig.MANTIS_API_KEY) {
      log.warn('未設定 MANTIS_API_KEY，API 呼叫可能會失敗');
    }

    if (parsedConfig.MANTIS_API_URL === 'https://mantisbt.org/bugs/api/rest') {
      log.warn('使用預設的 MANTIS_API_URL，請確認是否需要修改');
    }

    return parsedConfig;
  } catch (error: any) {
    const errorMessages = [];
    
    if (error instanceof z.ZodError) {
      errorMessages.push('配置驗證失敗:');
      error.errors.forEach((err) => {
        errorMessages.push(`- ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      errorMessages.push(`配置解析失敗: ${error.message || '未知錯誤'}`);
    }

    // 寫入錯誤日誌
    const errorLog = errorMessages.join('\n');
    fs.appendFileSync(path.join(LOG_DIR, 'error.log'), `${new Date().toISOString()} - ${errorLog}\n`);
    throw error;
  }
};

// 導出配置
export const config = parseConfig();

// 檢查是否設置了API Key
export const isMantisConfigured = () => {
  return !!config.MANTIS_API_KEY;
};

export default config; 