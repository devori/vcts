import express from 'express';
import bodyParser from 'body-parser';
import supertest from 'supertest';
import sinon from 'sinon';
import {expect, should} from 'chai';
import * as marketApi from '../../app/market-api';
import privateRouter from '../../app/router/private';
import * as account from '../../app/account';
import logger from '../../app/util/logger';

describe('router/private.js', function () {
    const TEST_USER = 'test-user01';
    const NON_EXIST_USER = 'non-exist-user';
    const MARKET = 'poloniex';

    let app;
    before(() => {
        sinon.stub(logger, 'info').returns(null);
        sinon.stub(account, 'getUser')
            .withArgs(TEST_USER).returns({id: TEST_USER})
            .withArgs(NON_EXIST_USER).returns(null);
        app = express();
        app.use(bodyParser.json());
        app.use('/', privateRouter);
    });

    after(() => {
        logger.info.restore();
        account.getUser.restore();
    });

    describe('GET /users/:user/markets/:market/assets/:base?/:vcType?', () => {
        before(() => {
            sinon.stub(account, 'searchAssets').withArgs(TEST_USER, MARKET, sinon.match.any, sinon.match.any).returns({
                "USDT": {
                    "BTC": [
                        {
                            "base": "USDT",
                            "vcType": "BTC",
                            "units": 0.4,
                            "rate": 2500,
                            "timestamp": 123,
                            "uuid": "265dac7d-1aaa-46b0-9f46-6dac2f45f44f"
                        }
                    ]
                }
            });
        });
        after(() => {
            account.searchAssets.restore();
        });
        it('should return assets when the user exists', done => {
            supertest(app)
                .get(`/users/${TEST_USER}/markets/${MARKET}/assets`)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(200)
                .end((err, res) => {
                    if (err) {
                        expect.fail('', '', err);
                        return;
                    }
                    expect(res.body.USDT).to.exist;
                    expect(res.body.USDT.BTC.length).to.equal(1);
                    expect(res.body.USDT.BTC[0].base).to.equal('USDT');
                    done();
                });
            this.timeout(3000);
        });
    });

    describe('POST /users/:user/markets/:market/assets/:base?/:vcType?', () => {
        let mockAccount;
        before(() => {
            mockAccount = sinon.mock(account);
            sinon.stub(marketApi.load(MARKET), 'buy').returns(
                Promise.resolve({
                    trade: {
                        units: 0.9975,
                        rate: 100,
                        total: 100
                    },
                    timestamp: new Date().getTime(),
                    raw: {}
                }));
        });
        after(() => {
            marketApi.load(MARKET).buy.restore();
            mockAccount.restore();
        });
        it('should return buy result with 201 after buy info save when url called', done => {
            mockAccount.expects('addAsset').withArgs(TEST_USER, MARKET).once();
            mockAccount.expects('addHistory').withArgs(TEST_USER, MARKET).never();
            supertest(app)
                .post(`/users/${TEST_USER}/markets/${MARKET}/assets/USDT/BTC`)
                .send({
                    units: 1,
                    rate: 100
                })
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(201)
                .end((err) => {
                    if (err) {
                        expect.fail('', '', err);
                        return;
                    }
                    mockAccount.verify();
                    done();
                });
            this.timeout(3000);
        });
    });

    describe('DELETE /users/:user/markets/:market/assets/:base/:vcType/:id?', () => {
        let mockAccount;
        before(() => {
            mockAccount = sinon.mock(account);
            sinon.stub(marketApi.load(MARKET), 'sell').returns(
                Promise.resolve({
                    trade: {
                        units: 1,
                        rate: 10000,
                        total: 9975
                    },
                    timestamp: new Date().getTime(),
                    raw: {}
                }));
        });
        after(() => {
            marketApi.load(MARKET).sell.restore();
            mockAccount.restore();
        });
        it('should return sell result after sell info save when sell call', done => {
            mockAccount.expects('removeAsset').withArgs(TEST_USER, MARKET).once();
            mockAccount.expects('addHistory').withArgs(TEST_USER, MARKET).never();
            supertest(app)
                .delete(`/users/${TEST_USER}/markets/${MARKET}/assets/USDT/BTC`)
                .send({
                    units: 1,
                    rate: 10000
                })
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(200)
                .end((err) => {
                    if (err) {
                        expect.fail('', '', err);
                        return;
                    }
                    mockAccount.verify();
                    done();
                });
            this.timeout(3000);
        });
        it('should call removeAssetById when uuid exists', done => {
            mockAccount.expects('removeAssetById').withArgs(TEST_USER, MARKET).once();
            supertest(app)
                .delete(`/users/${TEST_USER}/markets/${MARKET}/assets/USDT/BTC/1`)
                .expect(200)
                .end((err) => {
                    if (err) {
                        expect.fail('', '', err);
                        return;
                    }
                    mockAccount.verify();
                    done();
                })
        })
    });

    describe('GET /users/:user/markets/:market/histories/:base?/:vcType?', () => {
        before(() => {
            sinon.stub(account, 'getHistory').withArgs(TEST_USER, MARKET, 'USDT').returns([
                {
                    "base": "USDT",
                    "vcType": "BTC",
                    "units": 1,
                    "rate": 2500,
                    "total": 2500,
                    "type": "sell",
                    "timestamp": 123
                }
            ]);
        });

        after(() => {
            account.getHistory.restore();
        });

        it('should return history matched condition when histories call using get method', done => {
            supertest(app)
                .get(`/users/${TEST_USER}/markets/${MARKET}/histories/USDT`)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(200, [{
                    "base": "USDT",
                    "vcType": "BTC",
                    "units": 1,
                    "rate": 2500,
                    "total": 2500,
                    "type": "sell",
                    "timestamp": 123
                }])
                .end(done);
        });
    });
    describe('GET /users/:user', () => {
        it('should return user info when the user exists', done => {
            supertest(app)
                .get(`/users/${TEST_USER}`)
                .expect(200)
                .end((err, res) => {
                    if (err) {
                        expect.fail('', '', err);
                        return;
                    }
                    expect(res.body.id).to.equal(TEST_USER);
                    done();
                })
        });
        it('should return 404 info when the user does not exist', done => {
            supertest(app)
                .get(`/users/${NON_EXIST_USER}`)
                .expect(404)
                .end((err) => {
                    if (err) {
                        expect.fail('', '', err);
                        return;
                    }
                    done();
                })
        });
    });
    describe('PUT /users/{user}/markets/{market}/assets/{BASE}/{VCTYPE}?', () => {
        const BASE = 'BTC';
        const VC_TYPE = 'LTC';
        const IDS = ['1', '2'];
        before(() => {
            const BTC_ASSETS = {
                ETH: [
                    {
                        "base": BASE,
                        "vcType": 'ETH',
                        "units": 1.5,
                        "uuid": "33777511-8ffa-4a98-88d2-69625eeadcef"
                    }
                ],
                LTC: [
                    {
                        "base": BASE,
                        "vcType": 'LTC',
                        "units": 2,
                        "uuid": "33777511-8ffa-4a98-88d2-asdfiojef2"
                    }
                ]
            };

            const BALANCES = {ETH: 1.5, LTC: 2};
            sinon.stub(account, 'refineAssets')
                .withArgs(TEST_USER, MARKET, BASE, BALANCES).returns(BTC_ASSETS)
                .withArgs(TEST_USER, MARKET, BASE, {LTC: BALANCES.LTC}).returns({LTC: BTC_ASSETS.LTC});
            sinon.stub(account, 'mergeAssets')
                .withArgs(TEST_USER, MARKET, BASE, VC_TYPE, sinon.match(IDS)).returns({
                base: BASE,
                vcType: VC_TYPE,
                uuid: '1'
            });
            sinon.stub(marketApi.load(MARKET), 'getBalances')
                .withArgs(sinon.match.any).returns(Promise.resolve(BALANCES));
            sinon.stub(marketApi.load(MARKET), 'getTickers')
                .returns(Promise.resolve({[BASE]: {}}));
        });
        after(() => {
            account.refineAssets.restore();
            marketApi.load(MARKET).getBalances.restore();
            marketApi.load(MARKET).getTickers.restore();
        });
        it('should return updated assets when it call with sync mode', done => {
            supertest(app)
                .put(`/users/${TEST_USER}/markets/${MARKET}/assets/${BASE}?mode=sync`)
                .expect(200)
                .end((err, res) => {
                    if (err) {
                        expect.fail('', '', err);
                        return;
                    }
                    expect(res.body.ETH.length).to.equal(1);
                    expect(res.body.ETH[0].uuid).to.equal('33777511-8ffa-4a98-88d2-69625eeadcef');
                    expect(res.body.LTC.length).to.equal(1);
                    expect(res.body.LTC[0].uuid).to.equal('33777511-8ffa-4a98-88d2-asdfiojef2');
                    done();
                });
        });
        it('should return updated asset when it call with vctype and sync mode', done => {
            supertest(app)
                .put(`/users/${TEST_USER}/markets/${MARKET}/assets/${BASE}/LTC?mode=sync`)
                .expect(200)
                .end((err, res) => {
                    if (err) {
                        expect.fail('', '', err);
                        return;
                    }
                    expect(res.body.ETH).not.to.exist;
                    expect(res.body.LTC.length).to.equal(1);
                    expect(res.body.LTC[0].uuid).to.equal('33777511-8ffa-4a98-88d2-asdfiojef2');
                    done();
                });
        });
        it('should return merged asset when it calls with vcType and merge mode', done => {
            supertest(app)
                .put(`/users/${TEST_USER}/markets/${MARKET}/assets/${BASE}/${VC_TYPE}?mode=merge`)
                .send(IDS)
                .expect(200)
                .end((err, res) => {
                    if (err) {
                        expect.fail('', '', err);
                        return;
                    }
                    expect(res.body.base).to.equal(BASE);
                    expect(res.body.vcType).to.equal(VC_TYPE);
                    expect(res.body.uuid).to.equal('1');
                    done();
                });
        });
    });

    describe('POST /users/{user}/markets/{market}/order', () => {
        const BASE = 'BTC';
        const VC_TYPE = 'ETH';

        let side;

        describe('when side is sell', () => {
            beforeEach(done => {
                side = 'sell';
                sinon.stub(account, 'getMarketKeys').returns({});
                sinon.stub(account, 'removeAssetsByIds').returns({});
                sinon.stub(marketApi.load(MARKET), 'sell').resolves({trade: ['1']});

                supertest(app)
                    .post(`/users/${TEST_USER}/markets/${MARKET}/order`)
                    .send({
                        side,
                        base: BASE,
                        vcType: VC_TYPE,
                        rate: 0.1,
                        units: 1,
                        ids: ['1','2','3']
                    })
                    .expect(200)
                    .end((err) => {
                        if (err) {
                            expect.fail('', '', err);
                            return;
                        }

                        done();
                    });
            });

            afterEach(() => {
                account.getMarketKeys.restore();
                account.removeAssetsByIds.restore();
                marketApi.load(MARKET).sell.restore();
            });

            it('should call sell of marketApi with params', () => {
                expect(marketApi.load(MARKET).sell.calledWith(
                    sinon.match.object,
                    BASE,
                    VC_TYPE,
                    1,
                    0.1)).to.be.true;
            });

            it('should call removeAssetsByIds with params', () => {
                expect(account.removeAssetsByIds.calledWith(
                    TEST_USER,
                    MARKET,
                    ['1'],
                    ['1','2','3'])).to.be.true;
            });
        });
    });
});
