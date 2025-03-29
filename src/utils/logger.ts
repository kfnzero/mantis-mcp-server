import winston from 'winston';
import path from 'path';
import { config } from '../config/index.js';

// 定義日誌格式
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);
const logLevel = process.env.LOG_LEVEL || 'info';
const enableFileLogging = process.env.ENABLE_FILE_LOGGING === 'true';
const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
/**
 * 如果環境參數的ENABLE_FILE_LOGGING是false，則不會寫入日誌到檔案
 * 如果有指定LOG_DIR，則會寫入日誌到指定的目錄
 * 如果沒有指定LOG_DIR，則會寫入日誌到logs目錄
 * 如果沒有指定LOG_LEVEL，則會使用info等級
 * 如果沒有指定NODE_ENV，則會使用development等級
 */

// 創建 logger 實例
export const log = winston.createLogger({
  level: logLevel || 'info',
  format: logFormat,
  transports: [
    // 控制台輸出只處理非錯誤日誌
    // 永遠不輸出到Console
    // new winston.transports.Console({
    //   format: winston.format.combine(
    //     winston.format.colorize(),
    //     winston.format.simple()
    //   ),
    //   level: 'info'  // 只處理 info 及以下級別
    // })
  ]
});

// 如果啟用檔案日誌，添加檔案 transports
if (enableFileLogging) {
  
  // 添加綜合日誌檔案
  log.add(
    new winston.transports.File({
      filename: path.join(logDir, 'mantis-mcp-server-combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // 添加錯誤日誌檔案 - 只處理錯誤級別的日誌
  log.add(
    new winston.transports.File({
      filename: path.join(logDir, 'mantis-mcp-server-error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}