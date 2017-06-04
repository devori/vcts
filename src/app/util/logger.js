import path from 'path';
import winston from 'winston';
import winstonDailyRotateFile from 'winston-daily-rotate-file';


let logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(),
    new (winston.transports.DailyRotateFile)({
      filename: './logs/app.log',
      datePattern: 'yyyy-MM-dd.',
      prepend: true,
      level: 'debug',
      timestamp: (() => new Date().toLocaleString())
    })
  ]
});

export default logger;
