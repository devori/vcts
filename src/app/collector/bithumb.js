import request from 'request';
import priceFileDB from '../database/priceFileDB';
import { VCTYPES } from '../properties';


function collect() {
  let priceInfo = priceFileDB.load('bithumb');

  return new Promise((resolve, reject) => {
    request('https://api.bithumb.com/public/ticker/ALL', (err, res, body) => {
      let data = JSON.parse(body).data;
      let addedData = [];
      for (let k in data) {
        addedData[k] = priceInfo.add(k, {
          price: Number(data[k].closing_price),
          units: 1,
          timestamp: new Date().getTime()
        });
        let beforeOneDay = new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 2);
        priceInfo.remove(k, info => {
          return info.timestamp < beforeOneDay.getTime();
        });
      }
      resolve(addedData);
    });
  });
}

export default {
  collect
};
