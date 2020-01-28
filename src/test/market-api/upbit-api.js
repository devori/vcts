import {expect, should} from 'chai';
import nock from 'nock';
import crypto from 'crypto';
import uuid from 'uuid';
import { sign } from 'jsonwebtoken';
import { encode } from 'querystring';
import * as upbitApi from '../../app/market-api/upbit-api';

describe('market-api/upbit-api.js', function () {
    const BASE_URL = 'https://api.upbit.com';
    const API_KEY = 'api-key';
    const SECRET_KEY = 'secret-key';
    uuid.v4 = () => 'uuid-v4';

    describe('getExchangeInfo', () => {
        before(() => {
            nock(BASE_URL)
                .get('/v1/market/all')
                .reply(200, [
                    {
                        "market": "KRW-BTC",
                        "korean_name": "비트코인",
                        "english_name": "Bitcoin"
                    },
                    {
                        "market": "KRW-ETH",
                        "korean_name": "이더리움",
                        "english_name": "Ethereum"
                    },
                ]);
        });

        after(() => {
            nock.cleanAll();
        });

        it('should return refined exchange info when it calls', done => {
            const prom = upbitApi.getExchangeInfo();
            expect(prom).to.be.a('promise');
            prom.then((result) => {
                expect(result.KRW.BTC).to.deep.equal({});
                expect(result.KRW.ETH).to.deep.equal({});
                done();
            });
        });
    });

    describe('getTickers', () => {
        before(() => {
            nock(BASE_URL)
                .get('/v1/market/all')
                .reply(200, [
                    {
                        "market": "KRW-BTC",
                        "korean_name": "비트코인",
                        "english_name": "Bitcoin"
                    },
                    {
                        "market": "BTC-ETH",
                        "korean_name": "이더리움",
                        "english_name": "Ethereum"
                    },
                ]);

            nock(BASE_URL)
                .get('/v1/orderbook')
                .query(true)
                .reply(200, [
                    {
                        "market": "KRW-BTC",
                        "timestamp": 1580125619923,
                        "orderbook_units": [
                            {
                                "ask_price": 1.2,
                                "bid_price": 1.1,
                                "ask_size": 1,
                                "bid_size": 2,
                            },
                            {
                                "ask_price": 1.3,
                                "bid_price": 1.0,
                                "ask_size": 1,
                                "bid_size": 2,
                            },
                        ],
                    },
                    {
                        "market": "BTC-ETH",
                        "timestamp": 1580125619923,
                        "orderbook_units": [
                            {
                                "ask_price": 1.2,
                                "bid_price": 1.1,
                                "ask_size": 1,
                                "bid_size": 2,
                            },
                            {
                                "ask_price": 1.3,
                                "bid_price": 1.0,
                                "ask_size": 1,
                                "bid_size": 2,
                            },
                        ],
                    },
                ]);
        });

        after(() => {
            nock.cleanAll();
        });

        it('should return refined tickers only BASE is KRW when getTickers call', done => {
            let prom = upbitApi.getTickers();
            expect(prom).to.be.a('promise');
            prom.then(result => {
                expect(result.KRW).to.exist;
                expect(result.KRW.BTC).to.exist;
                expect(result.KRW.BTC.base).to.equal('KRW');
                expect(result.KRW.BTC.vcType).to.equal('BTC');
                expect(result.KRW.BTC.bid).to.equal(1.1);
                expect(result.KRW.BTC.ask).to.equal(1.2);
                done();
            });
        });
    });

    describe('getBalances', () => {
        before(() => {
            const token = sign({
                access_key: API_KEY,
                nonce: 'uuid-v4',
            }, SECRET_KEY);

            nock(BASE_URL)
                .matchHeader('Authorization', `Bearer ${token}`)
                .get('/v1/accounts')
                .reply(200, [
                    {
                      "currency":"KRW",
                      "balance":"1000000.0",
                      "locked":"100000.0",
                      "avg_buy_price":"0",
                      "avg_buy_price_modified":false,
                      "unit_currency": "KRW",
                    },
                    {
                      "currency":"BTC",
                      "balance":"2.0",
                      "locked":"1.0",
                      "avg_buy_price":"101000",
                      "avg_buy_price_modified":false,
                      "unit_currency": "KRW",
                    }
                ]);
        });

        after(() => {
            nock.cleanAll();
        });

        it('should return refined balances when getBalances call', done => {
            let prom = upbitApi.getBalances({
                apiKey: API_KEY,
                secretKey: SECRET_KEY
            });
            expect(prom).to.be.a('promise');
            prom.then(result => {
                expect(result.KRW).to.equal(1100000.0);
                expect(result.BTC).to.equal(3.0);
                done();
            });
        });
    });

    describe('sell', () => {
        beforeEach(() => {
            const query = encode({
                market: 'KRW-BTC',
                side: 'ask',
                volume: '0.01',
                price: '100',
                ord_type: 'limit',
            })
            const hash = crypto.createHash('sha512')
            const queryHash = hash.update(query, 'utf-8').digest('hex')
            const token = sign({
                access_key: API_KEY,
                nonce: 'uuid-v4',
                query_hash: queryHash,
                query_hash_alg: 'SHA512',
            }, SECRET_KEY);

            nock(BASE_URL)
                .matchHeader('Authorization', `Bearer ${token}`)
                .post('/v1/orders', {
                    market: 'KRW-BTC',
                    side: 'ask',
                    volume: '0.01',
                    price: '100',
                    ord_type: 'limit',
                })
                .reply(200, {
                    "uuid":"cdd92199-2897-4e14-9448-f923320408ad",
                    "side":"ask",
                    "ord_type":"limit",
                    "price":"100.0",
                    "avg_price":"110",
                    "state":"wait",
                    "market":"KRW-BTC",
                    "created_at":"2018-04-10T15:42:23+09:00",
                    "volume":"0.01",
                    "remaining_volume":"0.005",
                    "reserved_fee":"0.0015",
                    "remaining_fee":"0.007",
                    "paid_fee":"0.8",
                    "locked":"1.0015",
                    "executed_volume":"0.005",
                    "trades_count":1
                  });
        });

        afterEach(() => {
            nock.cleanAll();
        });

        it('should return merged sell result when buy call', done => {
            const prom = upbitApi.sell({
                apiKey: API_KEY,
                secretKey: SECRET_KEY
            }, 'KRW', 'BTC', 0.01, 100);

            expect(prom).to.be.a('promise');
            prom.then(result => {
                expect(result.raw.uuid).to.equal('cdd92199-2897-4e14-9448-f923320408ad');
                expect(result.trade).to.deep.include({
                    base: 'KRW',
                    vcType: 'BTC',
                    units: 0.005,
                    rate: 110
                });
                expect(result.trade.timestamp).to.be.a('number');
                done();
            });
        });
    });

    xdescribe('buy', () => {
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
            const prom = upbitApi.buy({
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
            const prom = upbitApi.buy({
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
