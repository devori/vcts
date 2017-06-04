import request from 'request';
import vc from '../virtual-currency/virtual-currency';
import { VCTYPES } from '../properties';

const INTERVAL_TIME = 5 * 60 * 1000;

let intervalId;

function start() {
  intervalId = setInterval(() => {
    request('https://api.bithumb.com/public/ticker/ALL', (err, res, body) => {
      let data = JSON.parse(body).data;
      for (let k in data) {
        vc.add(k, {
          price: Number(data[k].closing_price),
          units: 1,
          timestamp: new Date().getTime()
        });
        let beforeOneDay = new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 2);
        vc.remove(k, info => {
          return info.timestamp < beforeOneDay.getTime();
        });
      }
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
