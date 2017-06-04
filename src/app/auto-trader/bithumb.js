import trade from '../trade/trade';
import account from '../account/account';
import priceFileDB from '../database/priceFileDB';
import rule from './rule';
import { VCTYPES } from '../properties';

const INTERVAL_TIME = 5 * 60 * 1000 + 5000;

let priceDB = priceFileDB.load('bithumb');
let intervalId;
let availableKrw = -1;

function getBalance() {
  if (availableKrw < 0) {
    return trade.info('ALL').then(balance => {
      availableKrw = balance.krw;
      return availableKrw;
    });
  }
  return new Promise((resolve, reject) => {
    resolve(availableKrw);
  });
}

function getPriceInfo() {
  let priceInfo = {};
  VCTYPES.forEach(vcType => {
    priceInfo[vcType] = priceDB.search(vcType);
  });
  return priceInfo;
}

function run(accountId) {
  let priceInfo = getPriceInfo();

  return getBalance().then(krw => {
    let threshold = krw * 0.9;
    VCTYPES.forEach(vcType => {
      let asset = account.searchAssets(accountId, vcType) || [];
      let judgement = rule.judgeForPurchase(vcType, priceInfo[vcType], asset, threshold);
      let units = judgement.units;
      if (units < 0.1) {
        return;
      }
      console.log(`[${Date()}] Auto-Trader Schedule: Threshold - ${threshold}`);
      console.log(`[${Date()}] Purchase Judgement: ${vcType} - ${judgement.price} : ${units}`);
      units = Math.trunc(units * 10000) / 10000;
      trade.buy(accountId, vcType, null, units).then(data => {
        data.forEach(row => {
          threshold -= Number(row.total);
        });
      }).catch(reason => {
        console.log(`[${Date()}] Purchase Error: ${vcType} - ${units}`, reason);
      });
      availableKrw = -1;
    });

    VCTYPES.forEach(vcType => {
      let asset = account.searchAssets(accountId, vcType);
      if (!asset) {
        return;
      }
      let judgement = rule.judgeForSale(vcType, priceInfo[vcType], asset);
      let units = judgement.units;
      if (units <= 0.001) {
        return;
      }
      console.log(`[${Date()}] Sale Judgement: ${vcType} - ${units}`);
      units = Math.trunc(units * 10000) / 10000;
      trade.sell(accountId, vcType, null, units).catch(reason => {
        console.log(`[${Date()}] Sale Error: ${vcType} - ${units}`, reason);
      });
      availableKrw = -1;
    });
  });
}

export default {
  run
}
