import { Router } from 'express';
import * as marketApi from '../market-api';
import * as account from '../account';
import logger from '../util/logger';

let router = Router();
router.use((req, res, next) => {
  logger.verbose(`[${Date()}] ${req.url} called`);
  next();
});

router.get('/markets/:market/tickers/:base?/:vcType?', (req, res) => {
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

router.post('/users', (req, res) => {
  if (account.existUser(req.body.username)) {
    res.sendStatus(409);
    return;
  }
  let result = account.register(req.body);
  res.status(201).json(result);
});

export default router;
