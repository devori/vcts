import poloniexApi from '../trade/poloniex-api';
import account from '../account/account';
import priceFileDB from '../database/price-file-db';
import rule from './rule-poloniex';
import { VCTYPES_POLONIEX } from '../properties';
import logger from '../util/logger';

let priceDB = priceFileDB.load('poloniex');

function getBalance() {
  return poloniexApi.info().then(data => {
    return Number(data.BTC);
  });
}

function run(accountId) {
  return getBalance().then(balance => {
    if (isNaN(balance)) {
      logger.info('[Auto-Trader-Poloniex] Balance: NaN');
      return;
    }
    logger.verbose(`[${Date()}] Auto-Trader-Poloniex Available Balance: ${balance}`);
    let btcPriceInfo = priceDB.getLast('BTC');

    let promise = Promise.resolve();

    VCTYPES_POLONIEX.forEach(vcType => {
      let asset = account.searchAssets(accountId, vcType) || [];
      let judgement = rule.judgeForPurchase(vcType, priceDB.search(vcType), asset, balance);
      let units = judgement.units;
      if (units * judgement.rate < 0.0001) {
        return;
      }
      balance -= judgement.rate * judgement.units;
      units = Math.trunc(units * 10000) / 10000;
      promise = promise.then(() => {
        return poloniexApi.buy(accountId, vcType, judgement.rate, units).then(result => {
          result.resultingTrades && result.resultingTrades.forEach(row => {
            let asset = {};
            asset.units = Number(row.amount) * 0.9975;
            asset.price = Number(row.rate) * btcPriceInfo.lowestAskPrice;
            asset.date = new Date().getTime();
            account.addAsset(accountId, vcType, asset);
            account.addHistory(accountId, vcType, Object.assign({
              usdt_btc: btcPriceInfo.lowestAskPrice,
              price: Number(row.rate) * btcPriceInfo.lowestAskPrice
            }, row));
          });
        }).catch(reason => {
          logger.error(`[${Date()}] Auto-Trader-Poloniex Purchase Error: ${vcType} - ${units}`, reason);
        });
      });
    });

    VCTYPES_POLONIEX.forEach(vcType => {
      let asset = account.searchAssets(accountId, vcType);
      if (!asset) {
        return;
      }
      let judgement = rule.judgeForSale(vcType, priceDB.search(vcType), asset);
      let units = judgement.units;
      if (units * judgement.rate <= 0.0001) {
        return;
      }
      units = Math.trunc(units * 10000) / 10000;
      promise = promise.then(() => {
        return poloniexApi.sell(accountId, vcType, judgement.rate, units).then(result => {
          let total = result.resultingTrades.reduce((p, c) => p + Number(c.amount), 0);
          account.removeAsset(accountId, vcType, total);
          result.resultingTrades.forEach(row => {
            account.addHistory(accountId, vcType, {
              usdt_btc: btcPriceInfo.highestBidPrice,
              price: Number(row.rate) * btcPriceInfo.highestBidPrice,
              amount: Number(amount),
              date: new Date().getTime(),
              rate: Number(rate),
              totla: Number(total),
              tradeID: row.tradeID,
              type: row.type
            });
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
