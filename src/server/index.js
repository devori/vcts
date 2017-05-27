import express from 'express';
import bodyParser from 'body-parser';
import vcRouter from './virtual-currency/router';
import collector from './collector/collector';
import accountRouter from './account/router';

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

collector.start();
