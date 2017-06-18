import * as poloniexApi from './poloniex-api';
import * as account from '../account';

export const MARKET = {
  POLONIEX: 'poloniex'
}

export function load(marketName) {
  switch (marketName) {
  case MARKET.POLONIEX:
    return poloniexApi;
  default:
    throw `${marketName} is not supported`;
  }
}
