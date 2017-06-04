import express from 'express';
import bodyParser from 'body-parser';
import accountRouter from './account/router';
import tradeRouter from './trade/router';
import autoCollectorForBithumb from './auto-collector/bithumb';
import autoTrader from './auto-trader/auto-trader';

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

autoCollectorForBithumb.start();
autoTrader.start('test');
