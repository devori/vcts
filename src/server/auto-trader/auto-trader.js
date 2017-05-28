import trade from '../trade/trade';
import account from '../account/account';
import vc from '../virtual-currency/virtual-currency';
import rule from './rule';
import { VCTYPES } from '../properties';

const INTERVAL_TIME = 6 * 60 * 1000 + 5000;

let intervalId;

function start(accountId) {
  if (intervalId) {
    return;
  }

  let availableKrw = -1;
  function getBalance() {
    if (availableKrw < 0) {
      return trade.info(VCTYPES[0]).then(balance => {
        availableKrw = balance.krw;
        return availableKrw;
      });
    }
    return new Promise((resolve, reject) => {
      resolve(availableKrw);
    });
  }

  intervalId = setInterval(() => {
    let priceInfo = {};
    VCTYPES.forEach(vcType => {
      priceInfo[vcType] = vc.search(vcType);
    });

    getBalance().then(krw => {
      let threshold = (krw / VCTYPES.length) * 0.9;
      VCTYPES.forEach(vcType => {
        let asset = account.searchAssets(accountId, vcType) || [];
        let units = rule.judgeForPurchase(vcType, priceInfo[vcType], asset, threshold);
        if (units < 0.1) {
          return;
        }
        units = Math.trunc(units * 10000) / 10000;
        console.log(`Purchase: ${vcType} - ${units}`);
        trade.buy(accountId, vcType, null, units).catch(reason => {
          console.log('[Sale Error]', reason);
        });
        availableKrw = -1;
      });

      VCTYPES.forEach(vcType => {
        let asset = account.searchAssets(accountId, vcType);
        if (!asset) {
          return;
        }
        let units = rule.judgeForSale(vcType, priceInfo[vcType], asset);
        if (units === 0) {
          return;
        }
        units = Math.trunc(units * 10000) / 10000;
        console.log(`Sale: ${vcType} - ${units}`);
        trade.sell(accountId, vcType, null, units).catch(reason => {
          console.log('[Sale Error]', reason);
        });
        availableKrw = -1;
      });
    }).catch(reason => {
      console.log('[Info Error]', reason);
    });
  }, INTERVAL_TIME);
}

function stop() {
  if (!intervalId) {
    return;
  }
  clearInterval(intervalId);
  intervalId = null;
}

export default {
  start, stop
}
