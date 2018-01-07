import { expect, should } from 'chai';
import nock from 'nock';
import crypto from 'crypto';
import * as binanceApi from '../../app/market-api/binance-api';

describe('market-api/binance-api.js', function () {
  const BASE_URL = 'https://api.binance.com';
  const API_KEY = 'api-key';
  const SECRET_KEY = 'secret-key';

  describe('getTickers', () => {
    before(() => {
      nock(BASE_URL)
      .get('/api/v3/ticker/bookTicker')
      .reply(200, [
        {
          "symbol": "LTCBTC",
          "bidPrice": "4.00000000",
          "bidQty": "431.00000000",
          "askPrice": "4.00000200",
          "askQty": "9.00000000"
        },
        {
          "symbol": "ETHBTC",
          "bidPrice": "0.07946700",
          "bidQty": "9.00000000",
          "askPrice": "100000.00000000",
          "askQty": "1000.00000000"
        }
      ]);
    });

    after(() => {
      nock.cleanAll();
    });

    it('should return refined tickers when getTickers call', done => {
      let prom = binanceApi.getTickers();
      expect(prom).to.be.a('promise');
      prom.then(result => {
        expect(result.BTC).to.exist;
        expect(result.BTC.LTC).to.exist;
        expect(result.BTC.LTC.base).to.equal('BTC');
        expect(result.BTC.LTC.vcType).to.equal('LTC');
        expect(result.BTC.LTC.bid).to.equal(4.00000000);
        expect(result.BTC.LTC.ask).to.equal(4.00000200);

        expect(result.BTC).to.exist;
        expect(result.BTC.ETH).to.exist;
        expect(result.BTC.ETH.base).to.equal('BTC');
        expect(result.BTC.ETH.vcType).to.equal('ETH');
        expect(result.BTC.ETH.bid).to.equal(0.07946700);
        expect(result.BTC.ETH.ask).to.equal(100000.00000000);
        done();
      });
    });
  });

  describe('getBalances', () => {
    before(() => {
      nock(BASE_URL)
        .matchHeader('X-MBX-APIKEY', API_KEY)
        .get('/api/v3/account')
        .query(qs => {
            const paramString = encodeURIComponent('timestamp') + '=' + encodeURIComponent(qs.timestamp);
            const signature = crypto.createHmac('sha256', SECRET_KEY).update(paramString).digest('hex');
            return qs.timestamp
                  && qs.signature === signature;
        })
        .reply(200, {
          "makerCommission": 15,
          "takerCommission": 15,
          "buyerCommission": 0,
          "sellerCommission": 0,
          "canTrade": true,
          "canWithdraw": true,
          "canDeposit": true,
          "updateTime": 123456789,
          "balances": [
            {
              "asset": "BTC",
              "free": "123.456",
              "locked": "0.00000000"
            },
            {
              "asset": "LTC",
              "free": "234.567",
              "locked": "0.00000000"
            }
          ]
        });
    });

    after(() => {
      nock.cleanAll();
    });

    it('should return refined balances when getBalances call', done => {
      let prom = binanceApi.getBalances({
        apiKey: API_KEY,
        secretKey: SECRET_KEY
      });
      expect(prom).to.be.a('promise');
      prom.then(result => {
        expect(result.BTC).to.equal(123.456);
        expect(result.LTC).to.equal(234.567);
        done();
      });
    });
  });

  describe('sell', () => {
    beforeEach(() => {
      nock(BASE_URL)
      .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
      .post('/api/v3/order', body => {
          const paramString = Object.keys(body).filter(key => key !== 'signature').map(key => {
            return encodeURIComponent(key) + '=' + encodeURIComponent(body[key]);
          }).join('&');
          const signature = crypto.createHmac('sha256', SECRET_KEY).update(paramString).digest('hex');
          return body.timestamp && signature === body.signature;
      })
      .reply(200, (uri, reqbody) => {
        const result = {
          "symbol": "XRPBTC",
          "orderId": 28,
          "clientOrderId": "6gCrw2kRUAF9CvJDGP16IP",
          "transactTime": 1507725176595,
          "price": "0.00000000",
          "origQty": "3.00000000",
          "executedQty": "2.00000000",
          "status": "FILLED",
          "timeInForce": "IOC",
          "type": "LIMIT",
          "side": "SELL",
          "fills": []
        };

        if (reqbody.startsWith('symbol=XRP')) {
          result.fills = [
            {
              "price": "0.00015",
              "qty": "1.00000000",
              "commission": "0.00000015",
              "commissionAsset": "BTC"
            },
            {
              "price": "0.00016",
              "qty": "1.00000000",
              "commission": "0.00000015",
              "commissionAsset": "BTC"
            }
          ]
        }

        return result;
      });
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should return merged sell result when buy call', done => {
      const prom = binanceApi.sell({
        apiKey: API_KEY,
        secretKey: SECRET_KEY
      }, 'BTC', 'XRP', 3, 0.00016);
      expect(prom).to.be.a('promise');
      prom.then(result => {
        expect(result.raw.fills.length).to.equal(2);
        expect(result.trade).to.deep.include({
          base: 'BTC',
          vcType: 'XRP',
          units: 2,
          rate: 0.000155
        });
        expect(result.trade.timestamp).to.be.a('number');
        done();
      });
    });

    it('should throw exception when fills are empty', done => {
      const prom = binanceApi.sell({
        apiKey: API_KEY,
        secretKey: SECRET_KEY
      }, 'BTC', 'ETH', 3, 0.1);
      expect(prom).to.be.a('promise');
      prom.catch((error) => {
        expect(error).to.equal('there is no fills');
        done();
      });
    });
  });

  describe('buy', () => {
    beforeEach(() => {
      nock(BASE_URL)
      .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
      .post('/api/v3/order', body => {
          const paramString = Object.keys(body).filter(key => key !== 'signature').map(key => {
            return encodeURIComponent(key) + '=' + encodeURIComponent(body[key]);
          }).join('&');
          const signature = crypto.createHmac('sha256', SECRET_KEY).update(paramString).digest('hex');
          return body.timestamp && signature === body.signature;
      })
      .reply(200, (uri, reqbody) => {
        const result = {
          "symbol": "XRPBTC",
          "orderId": 28,
          "clientOrderId": "6gCrw2kRUAF9CvJDGP16IP",
          "transactTime": 1507725176595,
          "price": "0.00000000",
          "origQty": "3.00000000",
          "executedQty": "2.00000000",
          "status": "FILLED",
          "timeInForce": "IOC",
          "type": "LIMIT",
          "side": "BUY",
          "fills": []
        };

        if (reqbody.startsWith('symbol=XRP')) {
          result.fills = [
            {
              "price": "0.00015",
              "qty": "1.00000000",
              "commission": "0.00000015",
              "commissionAsset": "BTC"
            },
            {
              "price": "0.00016",
              "qty": "1.00000000",
              "commission": "0.00000015",
              "commissionAsset": "BTC"
            }
          ]
        }

        return result;
      });
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should return merged buy result when buy call', done => {
      const prom = binanceApi.buy({
        apiKey: API_KEY,
        secretKey: SECRET_KEY
      }, 'BTC', 'XRP', 3, 0.00016);
      expect(prom).to.be.a('promise');
      prom.then(result => {
        expect(result.raw.fills.length).to.equal(2);
        expect(result.trade).to.deep.include({
          base: 'BTC',
          vcType: 'XRP',
          units: 2,
          rate: 0.000155
        });
        expect(result.trade.timestamp).to.be.a('number');
        done();
      });
    });

    it('should throw exception when fills are empty', done => {
      const prom = binanceApi.buy({
        apiKey: API_KEY,
        secretKey: SECRET_KEY
      }, 'BTC', 'ETH', 3, 0.1);
      expect(prom).to.be.a('promise');
      prom.catch((error) => {
        expect(error).to.equal('there is no fills');
        done();
      });
    });
  });
});
