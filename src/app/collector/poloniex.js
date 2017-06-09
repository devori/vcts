import request from 'request';
import priceFileDB from '../database/price-file-db';
import logger from '../util/logger';

function collect() {
  let priceDB = priceFileDB.load('poloniex');

  function addToDB(vcType, data) {
    data.units = 1;
    data.timestamp = Date();

    priceDB.add(vcType, data);
    let beforeOneDay = new Date(new Date().getTime() - 1000 * 60 * 60 * 1);
    priceDB.remove(vcType, info => {
      return new Date(info.timestamp).getTime() < beforeOneDay.getTime();
    });
  }

  return new Promise((resolve, reject) => {
    request('https://poloniex.com/public?command=returnTicker', (err, res, body) => {
      let data = JSON.parse(body);
      let usdtPerBtc = Number(data.USDT_BTC.last);
      let btcData = {
        lowestAskRate: Number(data.USDT_BTC.lowestAsk),
        lowestAskPrice: Number(data.USDT_BTC.lowestAsk),
        highestBidRate: Number(data.USDT_BTC.highestBid),
        highestBidPrice: Number(data.USDT_BTC.highestBid)
      };
      addToDB('BTC', btcData);

      for (let k in data) {
        let pair = k.split('_');
        if (pair[0] !== 'BTC') {
          continue;
        }
        let priceInfo = {
          lowestAskRate: Number(data[k].lowestAsk),
          lowestAskPrice: Number(data[k].lowestAsk) * btcData.lowestAskPrice,
          highestBidRate: Number(data[k].highestBid),
          highestBidPrice: Number(data[k].highestBid) * btcData.highestBidPrice
        };
        priceInfo.lowestAskPrice = Math.trunc(priceInfo.lowestAskPrice * 100000000) / 100000000;
        priceInfo.highestBidPrice = Math.trunc(priceInfo.highestBidPrice * 100000000) / 100000000;

        addToDB(pair[1], priceInfo);
      }
      logger.verbose('[Collector-Poloniex] Collected');
      resolve();
    });
  });
}

export default {
  collect
};
