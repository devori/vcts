import bithumb from './bithumb';
import lowdb from 'lowdb';

const currencies = lowdb('./data/currencies.json');
const INTERVAL_TIME = 60000;

let intervalId;

function start() {
  let kinds = ['BTC', 'ETH', 'DASH', 'LTC'];
  kinds.forEach((c) => {
    if (!currencies.has(c).value()) {
      currencies.set(c, []).write();
    }
  });

  intervalId = setInterval(() => {
    kinds.forEach((c) => {
      bithumb.collect(c, (data) => {
        currencies.get(c).push(data).write();
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
};
