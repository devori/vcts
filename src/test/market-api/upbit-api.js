import {expect, should} from 'chai';
import nock from 'nock';
import crypto from 'crypto';
import uuid from 'uuid';
import { sign } from 'jsonwebtoken';
import { encode } from 'querystring';
import * as upbitApi from '../../app/market-api/upbit-api';
import * as wait from '../../app/util/wait';

describe('market-api/upbit-api.js', function () {
    const BASE_URL = 'https://api.upbit.com';
    const API_KEY = 'api-key';
    const SECRET_KEY = 'secret-key';
    uuid.v4 = () => 'uuid-v4';
    
    beforeEach(() => {      
        wait.waitPromise = r => Promise.resolve(r);
        
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

        const accountToken = sign({
            access_key: API_KEY,
            nonce: 'uuid-v4',
        }, SECRET_KEY);
        nock(BASE_URL)
            .matchHeader('Authorization', `Bearer ${accountToken}`)
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

        const askQuery = encode({
            market: 'KRW-BTC',
            side: 'ask',
            volume: '0.01',
            price: '100',
            ord_type: 'limit',
        })
        const askQueryHash = crypto.createHash('sha512').update(askQuery, 'utf-8').digest('hex')
        const askToken = sign({
            access_key: API_KEY,
            nonce: 'uuid-v4',
            query_hash: askQueryHash,
            query_hash_alg: 'SHA512',
        }, SECRET_KEY);
        nock(BASE_URL)
            .matchHeader('Authorization', `Bearer ${askToken}`)
            .post('/v1/orders', {
                market: 'KRW-BTC',
                side: 'ask',
                volume: '0.01',
                price: '100',
                ord_type: 'limit',
            })
            .reply(200, {
                "uuid":"test-uuid",
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

        const bidQuery = encode({
            market: 'KRW-BTC',
            side: 'bid',
            volume: '0.01',
            price: '100',
            ord_type: 'limit',
        })
        const bidQueryHash = crypto.createHash('sha512').update(bidQuery, 'utf-8').digest('hex')
        const bidToken = sign({
            access_key: API_KEY,
            nonce: 'uuid-v4',
            query_hash: bidQueryHash,
            query_hash_alg: 'SHA512',
        }, SECRET_KEY);
        nock(BASE_URL)
            .matchHeader('Authorization', `Bearer ${bidToken}`)
            .post('/v1/orders', {
                market: 'KRW-BTC',
                side: 'bid',
                volume: '0.01',
                price: '100',
                ord_type: 'limit',
            })
            .reply(200, {
                "uuid":"test-uuid",
                "side":"bid",
                "ord_type":"limit",
                "price":"100.0",
                "avg_price":"90.0",
                "state":"wait",
                "market":"KRW-BTC",
                "created_at":"2018-04-10T15:42:23+09:00",
                "volume":"0.01",
                "remaining_volume":"0.01",
                "reserved_fee":"0.0015",
                "remaining_fee":"0.0015",
                "paid_fee":"0.0",
                "locked":"1.0015",
                "executed_volume":"0.005",
                "trades_count": 1
                });

        const cancelQuery = encode({
            uuid: 'test-uuid'
        })
        const cancelQueryHash = crypto.createHash('sha512').update(cancelQuery, 'utf-8').digest('hex')
        const cancelToken = sign({
            access_key: API_KEY,
            nonce: 'uuid-v4',
            query_hash: cancelQueryHash,
            query_hash_alg: 'SHA512',
        }, SECRET_KEY);
        nock(BASE_URL)
            .matchHeader('Authorization', `Bearer ${cancelToken}`)
            .delete('/v1/order?uuid=test-uuid', {
                uuid: 'test-uuid'
            })
            .reply(200, {
                "uuid":"test-uuid",
                "side":"bid",
                "ord_type":"limit",
                "price":"100.0",
                "state":"wait",
                "market":"KRW-BTC",
                "created_at":"2018-04-10T15:42:23+09:00",
                "volume":"0.01",
                "remaining_volume":"0.01",
                "reserved_fee":"0.0015",
                "remaining_fee":"0.0015",
                "paid_fee":"0.0",
                "locked":"1.0015",
                "executed_volume":"0.0",
                "trades_count":0
                });
                
        const getOrderQuery = encode({
            uuid: 'test-uuid'
        })
        const getOrderQueryHash = crypto.createHash('sha512').update(getOrderQuery, 'utf-8').digest('hex')
        const getOrderToken = sign({
            access_key: API_KEY,
            nonce: 'uuid-v4',
            query_hash: getOrderQueryHash,
            query_hash_alg: 'SHA512',
        }, SECRET_KEY);
        nock(BASE_URL)
            .matchHeader('Authorization', `Bearer ${getOrderToken}`)
            .get('/v1/order?uuid=test-uuid', {
                uuid: 'test-uuid'
            })
            .reply(200, {
                "uuid": "test-uuid",
                "side": "ask",
                "ord_type": "limit",
                "price": "100",
                "state": "done",
                "market": "KRW-BTC",
                "created_at": "2019-01-04T13:48:09+09:00",
                "volume": "2.0",
                "remaining_volume": "0.0",
                "reserved_fee": "0.0",
                "remaining_fee": "0.0",
                "paid_fee": "2140.0",
                "locked": "0.0",
                "executed_volume": "1.0",
                "trades_count": 1,
                "trades": [
                    {
                    "market": "KRW-BTC",
                    "uuid": "9e8f8eba-7050-4837-8969-cfc272cbe081",
                    "price": "100.0",
                    "volume": "1.0",
                    "funds": "4280000.0",
                    "side": "ask"
                    },
                    {
                    "market": "KRW-BTC",
                    "uuid": "9e8f8eba-7050-4837-8969-cfc272cbe082",
                    "price": "110.0",
                    "volume": "1.0",
                    "funds": "4280000.0",
                    "side": "ask"
                    }
                ]
                });
    });

    afterEach(() => {
        nock.cleanAll();
    })

    describe('getExchangeInfo', () => {
        it('should return refined exchange info when it calls', done => {
            const prom = upbitApi.getExchangeInfo();
            expect(prom).to.be.a('promise');
            prom.then((result) => {
                expect(result.KRW.BTC).to.deep.equal({
                    rate: { step: 0.01 },
                    units: { step: 0.00000001 },
                });
                expect(result.KRW.ETH).to.deep.equal({
                    rate: { step: 0.01 },
                    units: { step: 0.00000001 },
                });
                done();
            });
        });
    });

    describe('getTickers', () => {
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
        it('should return merged sell result when buy call', done => {
            const prom = upbitApi.sell({
                apiKey: API_KEY,
                secretKey: SECRET_KEY
            }, 'KRW', 'BTC', 0.01, 100);

            expect(prom).to.be.a('promise');
            prom.then(result => {
                expect(result.raw.uuid).to.equal('test-uuid')
                expect(result.trade).to.deep.include({
                    base: 'KRW',
                    vcType: 'BTC',
                    units: 2.00000000,
                    rate: 105.00000000
                });
                expect(result.trade.timestamp).to.be.a('number');
                done();
            });
        });
    });

    describe('buy', () => {
        it('should return merged buy result when buy call', done => {
            const prom = upbitApi.buy({
                apiKey: API_KEY,
                secretKey: SECRET_KEY
            }, 'KRW', 'BTC', 0.01, 100);
            expect(prom).to.be.a('promise');
            prom.then(result => {
                expect(result.raw.uuid).to.equal('test-uuid')
                expect(result.trade).to.deep.include({
                    base: 'KRW',
                    vcType: 'BTC',
                    units: 2.00000000,
                    rate: 105.00000000
                });
                expect(result.trade.timestamp).to.be.a('number');
                done();
            });
        });
    });

    describe('cancel', () => {
        it('should return cancel result when cancel call', done => {
            const prom = upbitApi.cancel({
                apiKey: API_KEY,
                secretKey: SECRET_KEY
            }, 'test-uuid');
            expect(prom).to.be.a('promise');
            prom.then(result => {
                expect(result).to.deep.include({
                    uuid: 'test-uuid',
                    state: 'wait',
                })
                done();
            });
        });
    });


    describe('getOrderResult', () => {
        it('should return get result when get call', done => {
            const prom = upbitApi.getOrderResult({
                apiKey: API_KEY,
                secretKey: SECRET_KEY
            }, 'test-uuid');
            expect(prom).to.be.a('promise');
            prom.then(result => {
                expect(result.raw.uuid).to.equal('test-uuid')
                expect(result.trade).to.deep.include({
                    base: 'KRW',
                    vcType: 'BTC',
                    units: 2.00000000,
                    rate: 105.00000000
                });
                expect(result.trade.timestamp).to.be.a('number');
                done();
            });
        });
    });
});
