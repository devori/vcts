import request from 'request';
import lowdb from 'lowdb';

const currencies = lowdb('./data/currencies.json');
const INTERVAL_TIME = 5 * 60 * 1000;

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
      request(`https://api.bithumb.com/public/ticker/${c}`, (err, res, body) => {
        currencies.get(c).push(JSON.parse(body).data).write();
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
