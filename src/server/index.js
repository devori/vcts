import express from 'express';
import apiRouter from './route/api';
import collector from './collector/collector';
import autoTransaction from './auto-transaction/auto-transaction';

collector.start();
autoTransaction.start();

let app = express();
app.use('/api/v1', apiRouter);

app.listen(3000, () => {
  console.log('Start Server on port 3000');
});
