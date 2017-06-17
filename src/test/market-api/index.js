import { expect, should } from 'chai';
import sinon from 'sinon';
import * as marketApi from '../../app/market-api';
import * as poloniexApi from '../../app/market-api/poloniex-api';

describe('market-api/index.js', function () {

  it('should throw exception when there is not marketName', () => {
    expect(() => {
      marketApi.load('test-market');
    }).to.throw('test-market is not supported');
  });

  it('should return api instance when marketName is valid', () => {
    expect(marketApi.load(marketApi.MARKET.POLONIEX)).to.equal(poloniexApi);
  });
});
