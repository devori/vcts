import lowdb from 'lowdb';
import request from 'request';

const INTERVAL_TIME = 100000;
const currencies = lowdb('./data/currencies.json');
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
  clearInterval(intervalId);
}

export default {
  start, stop
}
