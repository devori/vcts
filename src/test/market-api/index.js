import { expect, should } from 'chai';
import sinon from 'sinon';
import * as marketApi from '../../app/market-api';
import * as poloniexApi from '../../app/market-api/poloniex-api';
import * as account from '../../app/account';

describe('market-api/index.js', function () {

  let mockAccount;
  before(() => {
    sinon.stub(poloniexApi, 'getTickers').callsFake(() => {
      return Promise.resolve({ tickers: 'temp data' });
    });
    sinon.stub(poloniexApi, 'getBalances').callsFake(() => {
      return Promise.resolve({ balances: 'temp data' });
    });
    sinon.stub(poloniexApi, 'buy').callsFake(() => {
      return Promise.resolve({ trades: 'temp data' });
    });
    sinon.stub(poloniexApi, 'sell').callsFake(() => {
      return Promise.resolve({ trades: 'temp data' });
    });
  });

  it('should throw exception when there is not marketName', () => {
    expect(() => {
      marketApi.load('test-market');
    }).to.throw('test-market is not supported');
  });

  it('should call poloniex-getTickers api when getTickers call', done => {
    marketApi.load(marketApi.MARKET.POLONIEX).getTickers().then(result => {
      expect(result.tickers).to.equal('temp data');
      done();
    });
    this.timeout(3000);
  });

  it('should call poloniex-getBalances api when getBalances call', done => {
    marketApi.load(marketApi.MARKET.POLONIEX).getBalances({}).then(result => {
      expect(result.balances).to.equal('temp data');
      done();
    });
    this.timeout(3000);
  });

  it('should call poloniex-buy api when buy call', done => {
    marketApi.load(marketApi.MARKET.POLONIEX).buy({}).then(result => {
      expect(result.trades).to.equal('temp data');
      done();
    });
    this.timeout(3000);
  });

  it('should call poloniex-sell api when sell call', done => {
    marketApi.load(marketApi.MARKET.POLONIEX).sell({}).then(result => {
      expect(result.trades).to.equal('temp data');
      done();
    });
    this.timeout(3000);
  });

  it('should return api instance when marketName is valid', () => {
    expect(marketApi.load(marketApi.MARKET.POLONIEX).getTickers).to.exist;
    expect(marketApi.load(marketApi.MARKET.POLONIEX).getBalances).to.exist;
    expect(marketApi.load(marketApi.MARKET.POLONIEX).buy).to.exist;
    expect(marketApi.load(marketApi.MARKET.POLONIEX).sell).to.exist;
  });

  after(() => {
    poloniexApi.getTickers.restore();
    poloniexApi.getBalances.restore();
    poloniexApi.buy.restore();
    poloniexApi.sell.restore();
  });
});
