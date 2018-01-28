import path from 'path';
import fs from 'fs';
import express from 'express';
import compression from 'compression'
import bodyParser from 'body-parser';
import * as historyMigrator from './migration/history';
import pubilcRouter from './router/public';
import privateRouter from './router/private';
import logger from './util/logger';

const DATA_DIR_PATH = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR_PATH)) {
    fs.mkdirSync(DATA_DIR_PATH);
}

const ACCOUNTS_DIR_PATH = path.resolve(DATA_DIR_PATH, 'accounts');
if (!fs.existsSync(ACCOUNTS_DIR_PATH)) {
    fs.mkdirSync(ACCOUNTS_DIR_PATH);
}

if (historyMigrator.shouldBeMigrated()) {
    historyMigrator.migrate();
}

const app = express();

app.use(compression());
app.use(bodyParser.json());
app.use((req, res, next) => {
    logger.info(`[${Date()}] ${req.method} ${req.url}`);
    next();
});
app.use('/api/v1/public', pubilcRouter);
app.use('/api/v1/private', privateRouter);
app.use((err, req, res, next) => {
    if (err) {
        res.status(500);
        res.json({
            code: 500,
            result: err
        });
    }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    logger.info(`Start Server on port ${PORT}`);
});
