import { Router } from 'express';
import * as marketApi from '../market-api';
import * as account from '../account';
import logger from '../util/logger';

let router = Router();
router.all('*', (req, res, next) => {
  logger.verbose(`[${Date()}] ${req.url} called`);
  let nonce = req.headers.nonce;
  if (!nonce || nonce < (new Date().getTime() - 3000)) {
    res.status(401);
    return;
  }
  let signObj = req.body || {};
  signObj.nonce = nonce;

  let apiKey = req.headers['api-key']
  let signValue =  req.headers['sign'];
  let auth = account.authenticate(apiKey, signObj, signValue);
  if (!auth) {
    res.sendStatus(401);
    return;
  }
  next();
});

router.get('/markets/:market/assets/:base?/:vcType?', (req, res) => {
  let apiKey = req.headers['api-key'];
  let base = req.params.base;
  let vcType = req.params.vcType
  let assets = account.searchAssets(apiKey, req.params.market, base, vcType);
  res.json(assets);
});

router.post('/markets/:market/assets/:base/:vcType', (req, res) => {
  let apiKey = req.headers['api-key'];
  let keys = account.getMarketKeys(apiKey, req.params.market);
  marketApi.load(req.params.market).buy(
    keys,
    req.params.base,
    req.params.vcType,
    req.body.units,
    req.body.price
  ).then(result => {
    result.trades.forEach(t => {
      account.addAsset(apiKey, req.params.market, t);
      account.addHistory(apiKey, req.params.market, t);
    });
    res.json(result);
    logger.info(`[${Date()}] Purchase - ${req.params.base}_${req.params.vcType} : ${req.body.units} - ${req.body.price}`);
    logger.info(result.trade);
  }).catch(err => {
    res.status(500).send(err);
  });
});


router.delete('/markets/:market/assets/:base/:vcType', (req, res) => {
  let apiKey = req.headers['api-key'];
  let keys = account.getMarketKeys(apiKey, req.params.market);
  marketApi.load(req.params.market).sell(
    keys,
    req.params.base,
    req.params.vcType,
    req.body.units,
    req.body.price
  ).then(result => {
    result.trades.forEach(t => {
      account.removeAsset(apiKey, req.params.market, t.base, t.vcType, t.units);
      account.addHistory(apiKey, req.params.market, t);
    });
    res.json(result);
    logger.info(`[${Date()}] Sale - ${req.params.base}_${req.params.vcType} : ${req.body.units} - ${req.body.price}`);
    logger.info(result.raw);
  }).catch(err => {
    res.status(500).send(err);
  });
});

router.get('/markets/:market/histories/:base?/:vcType?', (req, res) => {
  let apiKey = req.headers['api-key'];
  let base = req.params.base;
  let vcType = req.params.vcType;
  let result = account.getHistory(apiKey, req.params.market, base, vcType);
  res.json(result);
});

export default router;
