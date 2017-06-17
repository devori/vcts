import async from 'async';
import poloniexApi from '../trade/poloniex-api';
import account from '../account/account';
import rule from './rule-poloniex';
import { VCTYPES_POLONIEX } from '../properties';
import logger from '../util/logger';

function run(accountId) {
  return new Promise((resolve, reject) => {
    async.series({
      tickers: callback => {
        poloniexApi.getTickers().then(tickers => {
          callback(null, tickers);
        });
      },
      balances: callback => {
        poloniexApi.getBalances().then(balances => {
          callback(null, balances);
        });
      }
    }, (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(results);
    });
  }).then(info => {
    let balances = info.balances;
    let tickers = info.tickers;
    if (isNaN(balances.BTC) || isNaN(balances.USDT)) {
      logger.info('[Auto-Trader-Poloniex] Balance: NaN');
      return;
    }
    logger.verbose(`[${Date()}] Auto-Trader-Poloniex Available Balance: ${balances.BTC} (BTC), ${balances.USDT} (USDT)`);

    let promise = Promise.resolve();

    VCTYPES_POLONIEX.forEach(vcType => {
      let asset = account.searchAssets(accountId, vcType) || [];
      let bal;
      if (vcType.startsWith('USDT')) {
        bal = balances.USDT > 150 ? 150 : balances.USDT;
      } else if (vcType.startsWith('BTC')) {
        bal = balances.BTC > 0.05 ? 0.05 : balances.BTC;
      } else {
        return;
      }
      let judgement = rule.judgeForPurchase(vcType, tickers[vcType], asset, bal);
      let units = Math.trunc(judgement.units * 10000) / 10000;
      if (vcType.startsWith('BTC')) {
        if (units * judgement.rate < 0.0001) {
          return;
        }
      } else {
        if (units * judgement.rate < 1) {
          return;
        }
      }
      if (vcType.startsWith('USDT')) {
        balances.USDT -= judgement.rate * judgement.units;
      } else {
        balances.BTC -= judgement.rate * judgement.units;
      }
      promise = promise.then(() => {
        return poloniexApi.buy(accountId, vcType, judgement.rate, units).then(result => {
          result.resultingTrades && result.resultingTrades.forEach(row => {
            let asset = {};
            asset.units = Number(row.amount) * 0.9975;
            asset.price = Number(row.rate);
            asset.date = new Date().getTime();
            account.addAsset(accountId, vcType, asset);
            account.addHistory(accountId, vcType, Object.assign(row, { date: new Date().getTime() }));
          });
        }).catch(reason => {
          logger.error(`[${Date()}] Auto-Trader-Poloniex Purchase Error: ${vcType} - ${units}`, reason);
        });
      });
    });

    VCTYPES_POLONIEX.forEach(vcType => {
      let asset = account.searchAssets(accountId, vcType);
      if (!asset || asset.length === 0) {
        return;
      }
      let judgement = rule.judgeForSale(vcType, tickers[vcType], asset);
      let units = Math.trunc(judgement.units * 10000) / 10000;
      if (vcType.startsWith('BTC')) {
        if (units * judgement.rate < 0.0001) {
          return;
        }
      } else {
        if (units * judgement.rate < 1) {
          return;
        }
      }
      promise = promise.then(() => {
        return poloniexApi.sell(accountId, vcType, judgement.rate, units).then(result => {
          let total = result.resultingTrades.reduce((p, c) => p + Number(c.amount), 0);
          account.removeAsset(accountId, vcType, total);
          result.resultingTrades.forEach(row => {
            account.addHistory(accountId, vcType, Object.assign(row, { date: new Date().getTime() }));
          });
        }).catch(reason => {
          logger.error(`[${Date()}] Auto-Trader-Poloniex Sale Error: ${vcType} - ${units}`, reason);
        });
      });
    });
  });
}

export default {
  run
}
