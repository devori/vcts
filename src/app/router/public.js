import { Router } from 'express';
import * as marketApi from '../market-api';
import logger from '../util/logger';

let router = Router();
router.use((req, res, next) => {
  next();
});

router.get('/markets/:market/tickers/:base?/:vcType?', (req, res) => {
  logger.verbose(`[${Date()}] ${req.url} called`);
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
  marketApi.load(req.params.market).getTickers().then(tickers => {
    let base = req.params.base;
    let vcType = req.params.vcType;
    if (base) {
      if (vcType) {
        res.json(tickers[base][vcType]);
      } else {
        res.json(tickers[base]);
      }
    } else {
      res.json(tickers);
    }
  });
});

export default router;
