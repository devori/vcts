import { Router } from 'express';
import marketApi from '../market-api';
import * as account from '../account';
import logger from '../util/logger';

let router = Router();
router.use('/accounts/:apiKey', (req, res, next) => {
  let signObj = req.body || {};
  signObj.nonce = req.headers.nonce;
  let auth = account.authenticate(req.params.apiKey, signObj, req.headers.sign);
  if (!auth) {
    res.sendStatus(401);
    return;
  }
  next();
});

router.get('/accounts/:apiKey/markets/:market/balances', (req, res) => {
  logger.verbose(`[${Date()}] ${req.url} called`);
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
  marketApi.load(req.params.market).getBalances({}).then(result => {
    res.json(result.balances);
  });
});

export default router;
