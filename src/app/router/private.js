import { Router } from 'express';
import * as marketApi from '../market-api';
import * as account from '../account';
import logger from '../util/logger';

let router = Router();

router.use((req, res, next) => {
  let username = req.url.match(/^\/users\/([a-zA-Z0-9-.]*)/)[1];
  let user = account.getUser(username);
  if (!user) {
    res.sendStatus(404);
    return;
  }
  next();
});

router.get('/users/:user', (req, res) => {
  let user = account.getUser(req.params.user);
  if (!user) {
    res.sendStatus(404);
    return;
  }
  res.json(user);
});

router.get('/users/:user/markets/:market/assets/:base?/:vcType?', (req, res) => {
  let { user, market, base, vcType } = req.params;
  let assets = account.searchAssets(user, market, base, vcType);
  res.json(assets);
});

router.post('/users/:user/markets/:market/assets/:base/:vcType', (req, res) => {
  let { user, market, base, vcType } = req.params;
  let keys = account.getMarketKeys(user, market);
  marketApi.load(market).buy(
    keys,
    base,
    vcType,
    req.body.units,
    req.body.rate
  ).then(result => {
    result.trades.forEach(t => {
      account.addAsset(user, market, t);
      account.addHistory(user, market, t);
    });
    res.status(201).json(result);
    logger.info(`[${Date()}] Purchase - ${base}_${vcType} : ${req.body.units} - ${req.body.rate}`);
    logger.info(result.trades);
  }).catch(err => {
    res.status(500).send(err);
  });
});


router.delete('/users/:user/markets/:market/assets/:base/:vcType', (req, res) => {
  let { user, market, base, vcType } = req.params;
  let keys = account.getMarketKeys(user, market);
  marketApi.load(req.params.market).sell(
    keys,
    base,
    vcType,
    req.body.units,
    req.body.rate
  ).then(result => {
    result.trades.forEach(t => {
      account.removeAsset(user, market, t.base, t.vcType, t.units);
      account.addHistory(user, market, t);
    });
    res.json(result);
    logger.info(`[${Date()}] Sale - ${base}_${vcType} : ${req.body.units} - ${req.body.rate}`);
    logger.info(result.raw);
  }).catch(err => {
    res.status(500).send(err);
  });
});

router.get('/users/:user/markets/:market/histories/:base?/:vcType?', (req, res) => {
  let { user, market, base, vcType } = req.params;
  let result = account.getHistory(user, market, base, vcType);
  res.json(result);
});

router.put('/users/:user/markets/:market/assets/:base/:vcType?', (req,res) => {
  let { user, market, base, vcType } = req.params;
  if (req.query.mode === 'sync') {
    let keys = account.getMarketKeys(user, market);
    return marketApi.load(market).getBalances(keys, base).then(balances => {
      if (vcType) {
        balances = { [vcType]: (balances[vcType] ? balances[vcType] : 0) };
      }
      return balances;
    }).then(balances => {
      return marketApi.load(market).getTickers().then(tickers => {
        tickers = tickers[base];
        tickers[base] = { ask: 1, bid: 1 };
        return {
          balances,
          tickers
        }
      });
    }).then(({ tickers, balances }) => {
      res.json(account.syncAssets(user, market, base, balances, tickers));
    }).catch(err => {
      console.error(err);
      res.status(500).json({
        error: err
      });
    });
  } else {
    res.status(500).json({
      error: 'mode is required'
    });
  }
});

export default router;
