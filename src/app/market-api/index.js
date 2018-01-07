import * as poloniexApi from './poloniex-api';
import * as binanceApi from './binance-api';

export const MARKET = {
  POLONIEX: 'poloniex',
  BINANCE: 'binance'
}

export function load(marketName) {
  switch (marketName) {
  case MARKET.POLONIEX:
    return poloniexApi;
  case MARKET.BINANCE:
    return binanceApi;
  default:
    throw `${marketName} is not supported`;
  }
}
