import {expect, should} from 'chai';
import nock from 'nock';
import crypto from 'crypto';
import * as huobiApi from '../../app/market-api/huobi-api';

describe('market-api/huobi-api.js', function () {
    const BASE_URL = 'https://api-cloud.huobi.co.kr';
    const API_KEY = 'api-key';
    const SECRET_KEY = 'secret-key';

    describe('getExchangeInfo', () => {
        before(() => {
            nock(BASE_URL)
                .get('/v1/common/symbols')
                .reply(200, {
                        data: [
                            {
                                'quote-currency': 'aaa',
                                'base-currency': 'bbb',
                                'price-precision': 2,
                                'amount-precision': 3
                            },
                            {
                                'quote-currency': 'ccc',
                                'base-currency': 'ddd',
                                'price-precision': 4,
                                'amount-precision': 5
                            },
                        ]
                    }
                );
        });

        after(() => {
            nock.cleanAll();
        });

        it('should return refined exchange info when it calls', done => {
            const prom = huobiApi.getExchangeInfo();
            expect(prom).to.be.a('promise');
            prom.then((result) => {
                expect(result.AAA.BBB.rate.step).to.equal(0.01);
                expect(result.AAA.BBB.units.step).to.equal(0.001);
                expect(result.CCC.DDD.rate.step).to.equal(0.0001);
                expect(result.CCC.DDD.units.step).to.equal(0.00001);
                done();
            });
        });
    });

    describe('getTickers', () => {
        before(() => {
            nock(BASE_URL)
                .get('/market/tickers')
                .reply(200, {
                    data: [
                        {
                            "symbol": "ltcbtc",
                            "bid": "1.00000000",
                            "ask": "2.00000000",
                        },
                        {
                            "symbol": "ethbtc",
                            "bid": "3.00000000",
                            "ask": "4.00000000",
                        }
                    ]
                });
        });

        after(() => {
            nock.cleanAll();
        });

        it('should return refined tickers when getTickers call', done => {
            let prom = huobiApi.getTickers();
            expect(prom).to.be.a('promise');
            prom.then(result => {
                expect(result.BTC).to.exist;
                expect(result.BTC.LTC).to.exist;
                expect(result.BTC.LTC.base).to.equal('BTC');
                expect(result.BTC.LTC.vcType).to.equal('LTC');
                expect(result.BTC.LTC.bid).to.equal(1.00000000);
                expect(result.BTC.LTC.ask).to.equal(2.00000000);

                expect(result.BTC).to.exist;
                expect(result.BTC.ETH).to.exist;
                expect(result.BTC.ETH.base).to.equal('BTC');
                expect(result.BTC.ETH.vcType).to.equal('ETH');
                expect(result.BTC.ETH.bid).to.equal(3.00000000);
                expect(result.BTC.ETH.ask).to.equal(4.00000000);
                done();
            });
        });
    });

    describe('getBalances', () => {
        before(() => {
            nock(BASE_URL)
                .get(uri => uri.includes('/v1/account/accounts/123/balance'))
                .reply(200, {
                    data: {
                        list: [
                            { currency: 'abc', balance: '123' },
                            { currency: 'def', balance: '456' },
                        ]
                    },
                });
        });

        after(() => {
            nock.cleanAll();
        });

        it('should return refined balances when getBalances call', done => {
            const prom = huobiApi.getBalances({
                apiKey: API_KEY,
                secretKey: SECRET_KEY,
                accountId: '123',
            });
            expect(prom).to.be.a('promise');
            prom.then(result => {
                expect(result.ABC).to.equal(123.00000000);
                expect(result.DEF).to.equal(456.00000000);
                done();
            });
        });
    });

    describe('sell', () => {
        beforeEach(() => {
            nock(BASE_URL)
                .matchHeader('Content-Type', 'application/json')
                .post(uri => uri.includes('/v1/order/orders/place'))
                .reply(200, () => ({ data: '12345' }));
            nock(BASE_URL)
              .get(uri => uri.includes('/v1/order/orders/12345'))
              .reply(200, () => ({
                  data: {
                      symbol: 'xrpbtc',
                      type: 'sell-ioc',
                      price: '1',
                      'field-amount': '3',
                      'field-fees': '1',
                  },
              }));
        });

        afterEach(() => {
            nock.cleanAll();
        });

        it('should return merged sell result when buy call', done => {
            const prom = huobiApi.sell({
                apiKey: API_KEY,
                secretKey: SECRET_KEY,
                'account-id': 'test-id',
            }, 'BTC', 'XRP', 3, 0.00016);
            expect(prom).to.be.a('promise');
            prom.then(result => {
                expect(result.trade).to.deep.include({
                    base: 'BTC',
                    vcType: 'XRP',
                    units: 3,
                    rate: 1
                });
                expect(result.trade.timestamp).to.be.a('number');
                done();
            });
        });
    });

    describe('buy', () => {
        beforeEach(() => {
            nock(BASE_URL)
              .matchHeader('Content-Type', 'application/json')
              .post(uri => uri.includes('/v1/order/orders/place'))
              .reply(200, (uri, reqbody) => ({ data: '12345' }));
            nock(BASE_URL)
              .get(uri => uri.includes('/v1/order/orders/12345'))
              .reply(200, () => ({
                  data: {
                      symbol: 'xrpbtc',
                      type: 'buy-ioc',
                      price: '1',
                      'field-amount': '3',
                      'field-fees': '1',
                  },
              }));
        });

        afterEach(() => {
            nock.cleanAll();
        });

        it('should return merged buy result when buy call', done => {
            const prom = huobiApi.buy({
                apiKey: API_KEY,
                secretKey: SECRET_KEY,
                'account-id': 'test-id',
            }, 'BTC', 'XRP', 3, 0.00016);
            expect(prom).to.be.a('promise');
            prom.then(result => {
                expect(result.trade).to.deep.include({
                    base: 'BTC',
                    vcType: 'XRP',
                    units: 2,
                    rate: 1
                });
                expect(result.trade.timestamp).to.be.a('number');
                done();
            });
        });
    });
});
