import express from 'express';
import apiRouter from './route/api';
import collector from './collector/collector';
import autoTransaction from './auto-transaction/auto-transaction';
import trader from './auto-transaction/trader';

collector.start();
autoTransaction.start();

let app = express();
app.use('/api/v1', apiRouter);
// trader.info('LTC');

app.listen(3000, () => {
  console.log('Start Server on port 3000');
});
