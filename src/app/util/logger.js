import path from 'path';
import fs from 'fs';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const LOG_DIR_PATH = path.resolve(__dirname, '../../../logs');

if (!fs.existsSync(LOG_DIR_PATH)) {
  fs.mkdirSync(LOG_DIR_PATH);
}

let logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(),
    new DailyRotateFile({
      filename: './logs/app.log',
      datePattern: 'yyyy-MM-dd.',
      prepend: true,
      level: 'debug',
      timestamp: (() => new Date().toLocaleString())
    })
  ]
});

export default logger;
