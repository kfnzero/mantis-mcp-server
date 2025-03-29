import dotenv from 'dotenv';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { log } from '../utils/logger.js';

// 取得當前文件的目錄路徑
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  
  // 日誌配置
  LOG_DIR: z.string().default(path.join(__dirname, '../../logs')),
  ENABLE_FILE_LOGGING: z.coerce.boolean().default(false),
});

// 嘗試載入.env文件,但不強制要求
try {
  dotenv.config();
} catch (error: unknown) {
  log.warn('無法載入 .env 檔案,將使用預設配置', { 
    error: error instanceof Error ? error.message : String(error) 
  });
}

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
      LOG_DIR: process.env.LOG_DIR,
      ENABLE_FILE_LOGGING: process.env.ENABLE_FILE_LOGGING,
    });

    // 如果啟用檔案日誌,確保日誌目錄存在
    if (parsedConfig.ENABLE_FILE_LOGGING) {
      try {
        const logDir = path.resolve(parsedConfig.LOG_DIR);
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }
      } catch (error: unknown) {
        log.warn('無法建立日誌目錄,檔案日誌功能將被停用', { 
          dir: parsedConfig.LOG_DIR,
          error: error instanceof Error ? error.message : String(error)
        });
        parsedConfig.ENABLE_FILE_LOGGING = false;
      }
    }

    // 輸出警告但不阻止程式運行
    if (!parsedConfig.MANTIS_API_KEY) {
      log.warn('未設定 MANTIS_API_KEY，部分 API 功能可能無法使用');
    }

    if (parsedConfig.MANTIS_API_URL === 'https://mantisbt.org/bugs/api/rest') {
      log.warn('使用預設的 MANTIS_API_URL，請確認是否需要修改');
    }

    return parsedConfig;
  } catch (error: unknown) {
    // 配置驗證失敗時使用預設值
    if (error instanceof z.ZodError) {
      log.warn('配置驗證失敗,將使用預設值:', {
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      });
      return ConfigSchema.parse({}); // 使用所有預設值
    }
    
    // 其他錯誤也使用預設值
    log.error('配置解析失敗,將使用預設值', { 
      error: error instanceof Error ? error.message : String(error)
    });
    return ConfigSchema.parse({});
  }
};

// 導出配置
export const config = parseConfig();

// 檢查是否設置了API Key
export const isMantisConfigured = () => {
  return !!config.MANTIS_API_KEY;
};

export default config; 