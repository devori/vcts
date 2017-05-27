import request from 'request';
import vc from '../virtual-currency/virtual-currency';

const INTERVAL_TIME = 5 * 60 * 1000;

let intervalId;

function start() {
  let kinds = ['BTC', 'ETH', 'DASH', 'LTC', 'ETC'];
  intervalId = setInterval(() => {
    kinds.forEach((c) => {
      request(`https://api.bithumb.com/public/ticker/${c}`, (err, res, body) => {
        vc.add(c, JSON.parse(body).data);
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
