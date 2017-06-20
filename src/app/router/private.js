import { Router } from 'express';
import * as marketApi from '../market-api';
import * as account from '../account';
import logger from '../util/logger';

let router = Router();
router.use('/accounts/:accountId', (req, res, next) => {
  logger.verbose(`[${Date()}] ${req.url} called`);
  let signObj = req.body || {};
  signObj.nonce = req.headers.nonce;
  let auth = account.authenticate(req.params.accountId, signObj, req.headers.sign);
  if (!auth) {
    res.sendStatus(401);
    return;
  }
  next();
});

router.get('/accounts/:accountId/markets/:market/balances', (req, res) => {
  let keys = account.getMarketKeys(req.params.accountId, req.params.market);
  marketApi.load(req.params.market).getBalances(keys).then(result => {
    res.json(result.balances);
  });
});

router.post('/accounts/:accountId/markets/:market/:base/:vcType', (req, res) => {
  let keys = account.getMarketKeys(req.params.accountId, req.params.market);
  marketApi.load(req.params.market).buy(
    keys,
    req.params.base,
    req.params.vcType,
    req.body.units,
    req.body.price
  ).then(result => {
    result.trades.forEach(t => {
      account.addAsset(req.params.accountId, req.params.market, t);
      account.addHistory(req.params.accountId, req.params.market, t);
    });
    res.json(result);
  });
});


router.delete('/accounts/:accountId/markets/:market/:base/:vcType', (req, res) => {
  let keys = account.getMarketKeys(req.params.accountId, req.params.market);
  marketApi.load(req.params.market).buy(
    keys,
    req.params.base,
    req.params.vcType,
    req.body.units,
    req.body.price
  ).then(result => {
    result.trades.forEach(t => {
      account.removeAsset(req.params.accountId, req.params.market, t);
      account.addHistory(req.params.accountId, req.params.market, t);
    });
    res.json(result);
  });
});

export default router;
