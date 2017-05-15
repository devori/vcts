import lowdb from 'lowdb';
import rule from './rule';
import trader from './trader';

const INTERVAL_TIME = 5 * 60 * 1000 + 5000;
const currencies = lowdb('./data/currencies.json');
const accounts = lowdb('./data/accounts.json');

let intervalId;

function start(accountName = 'sample') {
  if (intervalId) {
    return;
  }
  intervalId = setInterval(() => {
    trader.info('LTC', (balance) => {
      let assets = accounts.get(accountName).get('assets').value();
      let currency = 'LTC';
      // for (let currency in assets) {
      let history = currencies.get(currency).last().value();
      let judgement = rule.judge(currency, history, Number(balance.available_krw), assets[currency]);
      if (judgement.sellId) {
        trader.sell(currency, judgement.sellId);
      }
      if (judgement.buyUnits) {
        trader.buy(currency, judgement.buyUnits);
      }
      // }
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
