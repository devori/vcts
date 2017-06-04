import express from 'express';
import bodyParser from 'body-parser';
import accountRouter from './account/router';
import tradeRouter from './trade/router';
import collectorForBithumb from './collector/bithumb';
import autoTraderForBithumb from './auto-trader/bithumb';

let app = express();

app.use(bodyParser.json());
app.use('/api/v1/accounts', accountRouter);
app.use('/api/v1/trade', tradeRouter);
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
  console.log('Start Server on port 3000');
});

setInterval(() => {
  collectorForBithumb.collect().catch(reason => {
    console.log('[Collector Error] for Bithumb:', reason);
  });
}, 5 * 60 * 1000);

setInterval(() => {
  autoTraderForBithumb.trade('test').catch(reason => {
    console.log('[Trader Error] for Bithumb:', reason);
  });
}, 5 * 60 * 1000 + 3000);
