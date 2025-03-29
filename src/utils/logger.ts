import winston from 'winston';
import path from 'path';
import fs from 'fs';

// 定義日誌格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// 創建 logger 實例
export const log = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // 寫入所有日誌到 logs/combined.log
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'mantis-mcp-server-combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // 寫入所有錯誤到 logs/error.log
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'mantis-mcp-server-error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// 永遠不輸出到Console
// // 如果不是生產環境，也將日誌輸出到控制台
// if (process.env.NODE_ENV !== 'production') {
//   log.add(new winston.transports.Console({
//     format: winston.format.combine(
//       winston.format.colorize(),
//       winston.format.simple()
//     ),
//   }));
// }

// 確保日誌目錄存在
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// 預設配置
const defaultConfig = {
  LOG_LEVEL: 'info',
  NODE_ENV: 'development'
};

// 更新日誌配置的函數
export const updateLoggerConfig = (config: { LOG_LEVEL: string; NODE_ENV: string }) => {
  log.level = config.LOG_LEVEL;
  
  // 根據環境重新配置控制台輸出
  const hasConsoleTransport = log.transports.some(t => t instanceof winston.transports.Console);
  
  // if (config.NODE_ENV !== 'production' && !hasConsoleTransport) {
  //   log.add(new winston.transports.Console({
  //     format: winston.format.combine(
  //       winston.format.colorize(),
  //       winston.format.simple()
  //     )
  //   }));
  // } else if (config.NODE_ENV === 'production' && hasConsoleTransport) {
  //   log.transports = log.transports.filter(t => !(t instanceof winston.transports.Console));
  // }
};

export default log; 