import express from 'express';
import compression from 'compression'
import bodyParser from 'body-parser';
import pubilcRouter from './router/public';
import privateRouter from './router/private';
import logger from './util/logger';

let app = express();

app.use(compression());
app.use(bodyParser.json());
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
