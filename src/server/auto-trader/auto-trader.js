import trade from '../trade/trade';
import account from '../account/account';
import vc from '../virtual-currency/virtual-currency';

const INTERVAL_TIME = 0 * 1000 + 5000;

let intervalId;

function start(accountId) {
  if (intervalId) {
    return;
  }
  intervalId = setInterval(() => {
    let assets = account.searchAssets(accountId);
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
