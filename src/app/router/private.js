import {Router} from 'express';
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
    let {user, market, base, vcType} = req.params;
    let assets = account.searchAssets(user, market, base, vcType);
    res.json(assets);
});

router.post('/users/:user/markets/:market/assets/:base/:vcType', (req, res) => {
    let {user, market, base, vcType} = req.params;
    let keys = account.getMarketKeys(user, market);
    marketApi.load(market).buy(
        keys,
        base,
        vcType,
        req.body.units,
        req.body.rate
    ).then(result => {
        account.addAsset(user, market, result.trade);
        res.status(201).json(result);
        logger.info(`[${Date()}] Purchase - ${base}_${vcType} : ${req.body.units} - ${req.body.rate}`);
        logger.info(result.trade);
    }).catch(err => {
        logger.error(err);
        res.status(500).send(err);
    });
});


router.delete('/users/:user/markets/:market/assets/:base/:vcType/:uuid?', (req, res) => {
    let {user, market, base, vcType, uuid} = req.params;
    if (uuid) {
        res.json(account.removeAssetById(user, market, {
            base,
            vcType,
            uuid
        }));
        return;
    }
    let keys = account.getMarketKeys(user, market);
    marketApi.load(req.params.market).sell(
        keys,
        base,
        vcType,
        req.body.units,
        req.body.rate
    ).then(result => {
        account.removeAsset(user, market, result.trade);
        res.json(result);
        logger.info(`[${Date()}] Sale - ${base}_${vcType} : ${req.body.units} - ${req.body.rate}`);
        logger.info(result.trade);
    }).catch(err => {
        res.status(500).send(err);
    });
});

router.get('/users/:user/markets/:market/histories/:base?', (req, res) => {
    const {user, market, base} = req.params;
    const start = Number(req.query.start || 0);
    const end = Number(req.query.end || new Date().getTime())
    const result = account.getHistory(user, market, base, {start, end});
    res.json(result);
});

router.put('/users/:user/markets/:market/assets/:base/:vcType?', (req, res) => {
    let {user, market, base, vcType} = req.params;

    if (req.query.mode === 'merge') {
        res.json(account.mergeAssets(user, market, base, vcType, req.body));
    } else if (req.query.mode === 'sync') {
        let keys = account.getMarketKeys(user, market);
        return marketApi.load(market).getBalances(keys).then(balances => {
            if (vcType) {
                balances = {[vcType]: (balances[vcType] ? balances[vcType] : 0)};
            }
            return balances;
        }).then(balances => {
            return marketApi.load(market).getTickers().then(tickers => {
                tickers = tickers[base];
                tickers[base] = {ask: 1, bid: 1};
                return {
                    balances,
                    tickers
                }
            });
        }).then(({tickers, balances}) => {
            res.json(account.refineAssets(user, market, base, balances, tickers));
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

router.post('/users/:user/markets/:market/order', (req, res) => {
    const {user, market} = req.params;
    const {side, base, vcType, units, rate, ids} = req.body;

    if (!side || !base || !vcType || !units || !rate) {
        res.status(500).json({
            msg: 'missing required fields',
            side, base, vcType, units, rate,
        });
        return;
    }

    if (side !== 'sell') {
        res.stats(500).send(`not supported side : ${side}`);
        return;
    }

    const keys = account.getMarketKeys(user, market);

    marketApi.load(market).sell(
        keys,
        base,
        vcType,
        units,
        rate
    ).then(result => {
        account.removeAssetsByIds(user, market, result.trade, ids);
        res.json(result);
        logger.info(`[${Date()}] Sale - ${base}_${vcType} : ${req.body.units} - ${req.body.rate}`);
        logger.info(result.trade);
    }).catch(err => {
        res.status(500).send(err);
    });
});

export default router;
