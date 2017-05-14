import lowdb from 'lowdb';
import bithumbApi from './bithumb-api';

const SUCCESS = '0000';
const account = lowdb('./data/accounts.json').get('sample');
const assets = account.get('assets');
const apiKey = account.get('connect').value();
const secretKey = account.get('secret').value();

function sell(currency, id) {
  if (!id || !assets.get(currency).has(id).value()) {
    return;
  }
  let target = assets.get(currency).get(id).value();
  bithumbApi.sell(currency, target.units).then((result) => {
    assets.get(currency).unset(id).write();
    console.log(result);
  });
}

function buy(currency, units) {
  bithumbApi.buy(currency, units).then((result) => {
    if (result.status === SUCCESS) {
      result.data.forEach((tr) => {
        assets.get(currency).set(String(new Date().getTime()), tr).write();
      });
    }
    console.log(result);
  });
}

function info(currency = 'LTC') {
  bithumbApi.info(currency).then((result) => {
    console.log(result);
  });
}

export default {
  sell, buy, info
}
