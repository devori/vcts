import express from 'express';
import bodyParser from 'body-parser';
import vcRouter from './virtual-currency/router';
import accountRouter from './account/router';
import autoCollector from './auto-collector/auto-collector';
import autoTrader from './auto-trader/auto-trader';

let app = express();

app.use(bodyParser.json());
app.use('/api/v1/vcs', vcRouter);
app.use('/api/v1/accounts', accountRouter);
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

autoCollector.start();
autoTrader.start('test');
