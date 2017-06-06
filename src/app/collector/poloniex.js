import request from 'request';
import priceFileDB from '../database/price-file-db';
import logger from '../util/logger';

function collect() {
  let priceDB = priceFileDB.load('poloniex');
  let btcPrice = priceDB.getLast('BTC').price;
  return new Promise((resolve, reject) => {
    request('https://poloniex.com/public?command=returnTicker', (err, res, body) => {
      let data = JSON.parse(body);
      for (let k in data) {
        let pair = k.split('_');
        let price = Number(data[k].lowestAsk);
        if (pair[0] === 'USDT' && pair[1] === 'BTC') {
          btcPrice = price;
        } else if (pair[0] === 'BTC') {
          price =  Math.trunc(price * btcPrice * 100000000) / 100000000;
        } else {
          continue;
        }
        priceDB.add(pair[1], {
          price: price,
          units: 1,
          timestamp: new Date().getTime()
        });
        let beforeOneDay = new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 2);
        priceDB.remove(pair[1], info => {
          return info.timestamp < beforeOneDay.getTime();
        });
      }
      logger.verbose('[Collector-Poloniex] Collected');
      resolve(data);
    });
  });
}

export default {
  collect
};
