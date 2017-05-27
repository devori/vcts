import trade from '../trade/trade';
import account from '../account/account';
import vc from '../virtual-currency/virtual-currency';
import rule from './rule';
import { VCTYPES } from '../properties';

const INTERVAL_TIME = 0 * 1000 + 5000;

let intervalId;

function start(accountId) {
  if (intervalId) {
    return;
  }
  intervalId = setInterval(() => {
    let priceInfo = {};
    VCTYPES.forEach(vcType => {
      priceInfo[vcType] = vc.search(vcType);
    });

    trade.info(VCTYPES[0]).then(balance => {
      let threshold = (balance.krw / VCTYPES.length) * 0.9;
      VCTYPES.forEach(vcType => {
        let asset = account.searchAssets(accountId, vcType) || [];
        let units = rule.judgeForPurchase(vcType, priceInfo[vcType], asset, threshold);
        if (units < 0.1) {
          return;
        }
        trade.buy(accountId, vctype, null, units).catch(reason => {
          console.log(reason);
        });
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
        trade.sell(accountId, vcType, null, units).catch(reason => {
          console.log(reason);
        });
      });
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
