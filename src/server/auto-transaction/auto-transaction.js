import lowdb from 'lowdb';
import rule from './rule';
import trader from './trader';

const INTERVAL_TIME = 5 * 60 * 1000;
const currencies = lowdb('./data/currencies.json');
const accounts = lowdb('./data/accounts.json');

let intervalId;

function start(accountName = 'sample') {
  if (intervalId) {
    return;
  }
  intervalId = setInterval(() => {
    let assets = accounts.get(accountName).get('assets').value();
    for (let currency in assets) {
      let history = currencies.get(currency).value();
      let judgement = rule.judge(history, assets[currency]);
      if (judgement.sellList.length > 0) {
        trader.sell(judgement.sellList);
      }
      if (judgement.buyList.length > 0) {
        trader.buy(...judgement.buyList[0]);
      }
    }
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
