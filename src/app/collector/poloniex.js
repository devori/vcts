import request from 'request';
import priceFileDB from '../database/price-file-db';
import logger from '../util/logger';

function collect() {
  let priceDB = priceFileDB.load('poloniex');

  function addToDB(vcType, rate, price) {
    let data = {
      price,
      rate,
      units: 1,
      timestamp: new Date().getTime()
    };
    priceDB.add(vcType, data);
    let beforeOneDay = new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 2);
    priceDB.remove(vcType, info => {
      return info.timestamp < beforeOneDay.getTime();
    });
  }

  return new Promise((resolve, reject) => {
    request('https://poloniex.com/public?command=returnTicker', (err, res, body) => {
      let data = JSON.parse(body);
      let usdtPerBtc = Number(data.USDT_BTC.last);
      let addedData = [];
      addedData.push(addToDB('BTC', 1, usdtPerBtc));

      for (let k in data) {
        let pair = k.split('_');
        if (pair[0] !== 'BTC') {
          continue;
        }
        let price = Number(data[k].last);
        price =  Math.trunc(price * usdtPerBtc * 100000000) / 100000000;

        addedData.push(addToDB(pair[1], Number(data[k].last), price));
      }
      logger.verbose('[Collector-Poloniex] Collected');
      resolve(addedData);
    });
  });
}

export default {
  collect
};
