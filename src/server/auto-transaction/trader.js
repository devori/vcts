import lowdb from 'lowdb';
import bithumbApi from './bithumb-api';

const SUCCESS = '0000';
const account = lowdb('./data/accounts.json').get('sample');
const assets = account.get('assets');
const apiKey = account.get('connect').value();
const secretKey = account.get('secret').value();

function sell(currency, id) {
  if (!id || !assets.get(currency).find({id}).value()) {
    return;
  }
  let target = assets.get(currency).find({id}).value();
  bithumbApi.sell(currency, target.units).then((result) => {
    assets.get(currency).unset(id).write();
    console.log('TRADER: ', result);
  });
}

function buy(currency, units) {
  bithumbApi.buy(currency, units).then((result) => {
    if (result.status === SUCCESS) {
      result.data.forEach((tr) => {
        tr.id = String(new Date().getTime());
        assets.get(currency).push(tr).write();
      });
    }
    console.log('TRADER: ', result);
  });
}

function info(currency = 'LTC', callback) {
  bithumbApi.info(currency).then((result) => {
    console.log('TRADER: ', result);
    callback(result.data);
  });
}

export default {
  sell, buy, info
}
