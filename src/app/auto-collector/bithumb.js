import request from 'request';
import priceFileDB from '../database/priceFileDB';
import { VCTYPES } from '../properties';

const INTERVAL_TIME = 5 * 60 * 1000;

let intervalId;
let priceInfo = priceFileDB('bithumb');

function start() {
  intervalId = setInterval(() => {
    request('https://api.bithumb.com/public/ticker/ALL', (err, res, body) => {
      let data = JSON.parse(body).data;
      for (let k in data) {
        priceInfo.add(k, {
          price: Number(data[k].closing_price),
          units: 1,
          timestamp: new Date().getTime()
        });
        let beforeOneDay = new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 2);
        priceInfo.remove(k, info => {
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
