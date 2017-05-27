import account from '../account/account';
import bithumbApi from './bithumb-api';

const SUCCESS = '0000';

function sell(accountId, vcType, price, units) {
  if (price === null) {
    return bithumbApi.sell(vcType, units).then((result) => {
      if (result.status !== SUCCESS) {
        throw result;
      }
      return result.data;
    }).then(data => {
      account.removeAsset(accountId, vcType, units);
      return data;
    });
  }
}

function buy(accountId, vcType, price, units) {
  if (price === null) {
    return bithumbApi.buy(vcType, units).then((result) => {
      if (result.status !== SUCCESS) {
        throw result;
      }
      return result.data;
    }).then(data => {
      data.forEach(asset => {
        asset.units = Number(asset.units);
        asset.price = Number(asset.price);
        return account.addAsset(accountId, vcType, asset);
      });
      return data;
    });
  }
}

function info(vcType) {
  return bithumbApi.info(vcType).then((result) => {
    if (result.status !== SUCCESS) {
      throw result;
    }
    return result.data;
  }).then(data => {
    return {
      krw: Number(data.available_krw)
    };
  });
}

export default {
  sell, buy, info
}
