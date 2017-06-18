import express from 'express';
import bodyParser from 'body-parser';
import tradeRouter from './router/trade';
import accountRouter from './router/account';
import pubilcRouter from './router/public';
import privateRouter from './router/private';
import collectorForBithumb from './collector/bithumb';
import collectorForPoloniex from './collector/poloniex';
import autoTraderForBithumb from './auto-trader/bithumb';
import autoTraderForPoloniex from './auto-trader/poloniex';
import logger from './util/logger';

let app = express();

app.use(bodyParser.json());
app.use('/api/v1/trade', tradeRouter);
app.use('/api/v1/accounts', accountRouter);
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

app.listen(3000, () => {
  logger.info('Start Server on port 3000');
});

// const COLLECTOR_INTERVAL = 1 * 60 * 1000;
// logger.info(`Start Collector Schedule: ${COLLECTOR_INTERVAL} ms`);
// setInterval(() => {
  // collectorForBithumb.collect().catch(reason => {
  //   logger.error('[Collector Error] for Bithumb:', reason);
  // });

  // collectorForPoloniex.collect().catch(reason => {
  //   logger.error('[Collector Error] for Poloniex:', reason);
  // });
// }, COLLECTOR_INTERVAL);

const AUTO_TRADER_INTERVAL = 1 * 60 * 1000;
logger.info(`Start Auto-Trader Schedule: ${AUTO_TRADER_INTERVAL} ms`);
setInterval(() => {
  // autoTraderForBithumb.run('test').catch(reason => {
  //   logger.error('[Trader Error] for Bithumb:', reason);
  // });

  autoTraderForPoloniex.run('poloniex').then(() => {
    logger.info(`[${Date()}] ---------- Auto-Trader Resolve----------`);
  }, () => {
    logger.warn(`[${Date()}] ---------- Auto-Trader Reject ----------`)
  }).catch(reason => {
    logger.error('[Trader Error] for Poloniex:', reason);
  });
}, AUTO_TRADER_INTERVAL);
