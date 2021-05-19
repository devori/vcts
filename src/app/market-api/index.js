import * as poloniexApi from './poloniex-api';
import * as binanceApi from './binance-api';
import * as upbitApi from './upbit-api';
import * as huobiApi from './huobi-api';

export const MARKET = {
  POLONIEX: 'poloniex',
  BINANCE: 'binance',
  UPBIT: 'upbit',
  HUOBI: 'huobi',
}

export function load(marketName) {
  switch (marketName) {
  case MARKET.POLONIEX:
    return poloniexApi;
  case MARKET.BINANCE:
    return binanceApi;
  case MARKET.UPBIT:
    return upbitApi;
  case MARKET.HUOBI:
    return huobiApi;
  default:
    throw `${marketName} is not supported`;
  }
}
