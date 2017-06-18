import * as poloniexApi from './poloniex-api';

export const MARKET = {
  POLONIEX: 'poloniex'
}

const wrapperPoloniexApi = {
  getTickers() {
    return poloniexApi.getTickers();
  },
  getBalances (auth) {
    return poloniexApi.getBalances(auth);
  },
  sell (auth, base, vcType, units, price) {
    return poloniexApi.sell(auth, base, vcType, units, price).then(result => {
      return result;
    });
  },
  buy (auth, base, vcType, units, price) {
    return poloniexApi.buy(auth, base, vcType, units, price).then(result => {
      return result;
    });
  }
}

export function load(marketName) {
  switch (marketName) {
  case MARKET.POLONIEX:
    return wrapperPoloniexApi;
  default:
    throw `${marketName} is not supported`;
  }
}
