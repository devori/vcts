import { expect, should } from 'chai';
import sinon from 'sinon';
import crypto from 'crypto';
import * as account from '../../app/account';
import * as accountDao from '../../app/database/account-dao';

describe('account/index', function () {
	const ACCOUNT_ID = 'test-user';
	const NON_EXIST_ACCOUNT_ID = 'non-exist-test-user';
	const MARKET = 'poloniex';
	const API_KEY = 'api-key';
	const SECRET_KEY = 'secret-key';

	describe('addAsset', () => {
		let mockAccountDao;
		before(() => {
			sinon.stub(accountDao, 'searchAssets').returns([{ rate: 1, units: 1 }]);
		});
		beforeEach(() => {
			mockAccountDao = sinon.mock(accountDao);
		});
		afterEach(() => {
			mockAccountDao.restore();
		});
		after(() => {
			accountDao.searchAssets.restore();
		})
		it('should return result of dao when addAsset call', () => {
			let asset = {
				base: 'USDT',
				vcType: 'BTC',
				units: 1,
				rate: 2
			}
			let expectation = mockAccountDao.expects('addAsset').withArgs(ACCOUNT_ID, MARKET, asset);
			account.addAsset(ACCOUNT_ID, MARKET, asset);
			expectation.verify();
		});
		it('should be called addHistory when it call', () => {
			let asset = {
				base: 'USDT',
				vcType: 'BTC',
				units: 1,
				rate: 2
			};
			let expectation = mockAccountDao.expects('addHistory').withArgs(ACCOUNT_ID, MARKET, asset);
			account.addAsset(ACCOUNT_ID, MARKET, asset);
			expectation.verify();
		});
		it('should be called updateAsset when same rate asset exists', () => {
			let expectation = mockAccountDao.expects('updateAsset')
				.withArgs(ACCOUNT_ID, MARKET, sinon.match.has('units', 2));
			account.addAsset(ACCOUNT_ID, MARKET, {
				units: 1,
				rate: 1
			});
			expectation.verify();
		});
	});

	describe('addHistory', () => {
		before(() => {
			sinon.stub(accountDao, 'addHistory').returnsArg(2);
		});
		after(() => {
			accountDao.addHistory.restore();
		});
		it('should return result of dao when addHistory call', () => {
			let result = account.addHistory(ACCOUNT_ID, MARKET, {
				base: 'USDT',
				vcType: 'BTC',
				units: 1.23,
				rate: 2500,
				total: 2500,
				type: 'sell',
				timestamp: 123
			});
			expect(result.base).to.equal('USDT');
			expect(result.vcType).to.equal('BTC');
			expect(result.units).to.equal(1.23);
			expect(result.type).to.equal('sell');
		});
	});

	describe('removeAsset', () => {
		let mockAccountDao;
		before(() => {
			sinon.stub(accountDao, 'searchAssets').withArgs(ACCOUNT_ID, MARKET, 'USDT', 'BTC').returns([
				{
					base: 'USDT',
					vcType: 'BTC',
					units: 2,
					rate: 2500,
					uuid: 'units-2-2500'
				},
				{
					base: 'USDT',
					vcType: 'BTC',
					units: 1,
					rate: 2400,
					uuid: 'units-1-2400'
				}
			]);
			mockAccountDao = sinon.mock(accountDao);
		});
		after(() => {
			accountDao.searchAssets.restore();
			mockAccountDao.restore();
		});
		it('should remove assets in order of low rate', () => {
			mockAccountDao.expects('removeAsset').withArgs(ACCOUNT_ID, MARKET, {
				base: 'USDT',
				vcType: 'BTC',
				uuid: 'units-1-2400'
			});
			mockAccountDao.expects('updateAsset').withArgs(ACCOUNT_ID, MARKET, {
				base: 'USDT',
				vcType: 'BTC',
				units: 0.5,
				uuid: 'units-2-2500'
			});
			account.removeAsset(ACCOUNT_ID, MARKET, {
				base: 'USDT',
				vcType: 'BTC',
				units: 2.5
			});
			mockAccountDao.verify();
		});
		it('should be called addHistory when it call', () => {
			let expectation = mockAccountDao.expects('addHistory').once();
			account.removeAsset(ACCOUNT_ID, MARKET, {
				base: 'USDT',
				vcType: 'BTC',
				units: 2.5
			});
			mockAccountDao.verify();
		});
	});

	describe('register', () => {
		before(() => {
			sinon.stub(accountDao, 'createAccount').returns({
				apiKey: API_KEY,
				secretKey: SECRET_KEY
			});
		});
		after(() => {
			accountDao.createAccount.restore();
		});
		it('should return api key info when register call', () => {
			let result = account.register({});
			expect(result.apiKey).to.equal(API_KEY);
			expect(result.secretKey).to.equal(SECRET_KEY);
		});
	});

	describe('getHistory', () => {
		before(() => {
			sinon.stub(accountDao, 'getHistory').returns({
				USDT: {
					BTC: [{ base: 'USDT' }]
				}
			});
		});
		after(() => {
			accountDao.getHistory.restore();
		});
		it('should return histories matched accountId when getHistory call', () => {
			let result = account.getHistory(ACCOUNT_ID, MARKET, 'USDT', 'BTC');
			expect(result.USDT).to.exist;
			expect(result.USDT.BTC).to.exist;
			expect(result.USDT.BTC.length).to.equal(1);
		});
	})

	describe('searchAssets', () => {
		before(() => {
			sinon.stub(accountDao, 'searchAssets').withArgs(ACCOUNT_ID, MARKET).returns({
				USDT: {
					BTC: [
						{
							base: 'USDT',
							vcType: 'BTC',
							units: 2,
							rate: 2500,
							uuid: 'units-2-2500'
						},
						{
							base: 'USDT',
							vcType: 'BTC',
							units: 1,
							rate: 2400,
							uuid: 'units-1-2400'
						}
					]
				}
			});
		});
		after(() => {
			accountDao.searchAssets.restore();
		});
		it('should return assets matched accountId when searchAssets call', () => {
			let result = account.searchAssets(ACCOUNT_ID, MARKET);
			expect(result.USDT).to.exist;
			expect(result.USDT.BTC).to.exist;
			expect(result.USDT.BTC.length).to.equal(2);
		});
	});

	describe('getUser', () => {
		before(() => {
			sinon.stub(accountDao, 'existUser')
				.withArgs(ACCOUNT_ID).returns(true)
				.withArgs(NON_EXIST_ACCOUNT_ID).returns(false);
		});
		after(() => {
			accountDao.existUser.restore();
		});
		it('should return username when the user exists', () => {
			let user = account.getUser(ACCOUNT_ID);
			expect(user.id).to.equal(ACCOUNT_ID);
		});
		it('should return null when the user does not exist', () => {
			let user = account.getUser(NON_EXIST_ACCOUNT_ID);
			expect(user).to.be.null;
		});
	});

	describe('refineAssets', () => {
		const BASE = 'BTC';
		let ASSETS;
		before(() => {
			sinon.stub(accountDao, 'searchAssets')
				.callsFake((accountId, market, base, vcType) => {
					return ASSETS[base][vcType].map(obj => Object.assign({}, obj));
				});
			sinon.stub(accountDao, 'removeAsset').callsFake((accountId, market, info) => {
				let arr = ASSETS[info.base][info.vcType];
				for (let i = 0; i < arr.length; i++) {
					if (arr[i].uuid === info.uuid) {
						arr.splice(i, 1);
						break;
					}
				}
			});
			sinon.stub(accountDao, 'updateAsset')
				.callsFake((accountId, market, info) => {
					let arr = ASSETS[info.base][info.vcType];
					for (let i = 0; i < arr.length; i++) {
						if (arr[i].uuid === info.uuid) {
							arr[i].units = info.units;
							break;
						}
					}
				});
			sinon.stub(accountDao, 'addAsset')
				.callsFake((accountId, market, info) => {
					ASSETS[info.base][info.vcType].push({
						units: info.units,
						rate: info.rate,
						uuid: String(ASSETS[info.base][info.vcType].length)
					});
				});
		});
		beforeEach(() => {
			ASSETS = {
				[BASE]: {
					BTC: [{ base: BASE, vcType: 'BTC', units: 1, rate: 1 , uuid: '1' }],
					ETH: [{ base: BASE, vcType: 'ETH', units: 1, rate: 0.1, uuid: '1' },
							  { base: BASE, vcType: 'ETH', units: 1, rate: 0.2, uuid: '2' }],
					LTC: [{ base: BASE, vcType: 'LTC', units: 1, rate: 0.3, uuid: '1' },
								{ base: BASE, vcType: 'LTC', units: 1, rate: 0.1, uuid: '2' },
								{ base: BASE, vcType: 'LTC', units: 1, rate: 0.2, uuid: '3' }]
				}
			};
		});
		after(() => {
			accountDao.searchAssets.restore();
			accountDao.removeAsset.restore();
			accountDao.updateAsset.restore();
			accountDao.addAsset.restore();
		})
		it('should return assets in balances when it call', () => {
			let result = account.refineAssets(ACCOUNT_ID, MARKET, BASE, {
				ETH: 2, LTC: 3
			}, {
				LTC: { ask: 0.1 },
				ETH: { ask: 0.2 }
			});
			expect(result.BTC).not.to.exist;
			expect(result.ETH.length).to.equal(2);
			expect(result.LTC.length).to.equal(3);
		});
		it('should remove assets in order of lower rate when it call', () => {
			let result = account.refineAssets(ACCOUNT_ID, MARKET, BASE, {
				ETH: 1, LTC: 1.5
			}, {
				ETH: { ask: 0.2 },
				LTC: { ask: 0.1 }
			});
			expect(result.ETH.length).to.equal(1);
			expect(result.ETH[0].rate).to.equal(0.2);
			expect(result.ETH[0].units).to.equal(1);
			expect(result.LTC.length).to.equal(2);
			expect(result.LTC[0].rate).to.equal(0.3);
			expect(result.LTC[0].units).to.equal(1);
			expect(result.LTC[1].rate).to.equal(0.2);
			expect(result.LTC[1].units).to.equal(0.5);
		});

		it('should add asset that have ask rate if balance is more than sum of units', () => {
			let result = account.refineAssets(ACCOUNT_ID, MARKET, BASE, {
				ETH: 3
			}, {
				ETH: { ask: 0.2 }
			});
			expect(result.ETH.length).to.equal(2);
			expect(result.ETH[1].units).to.equal(2);
			expect(result.ETH[1].rate).to.equal(0.2);
		});
		it('should merge same rate assets when same rate assets exist', () => {
			ASSETS = {
				[BASE]: {
					BTC: [{ base: BASE, vcType: 'BTC', units: 1, rate: 1 , uuid: '1' },
								{ base: BASE, vcType: 'BTC', units: 1, rate: 1 , uuid: '2' }],
					ETH: [{ base: BASE, vcType: 'ETH', units: 1, rate: 1 , uuid: '1' },
								{ base: BASE, vcType: 'ETH', units: 1, rate: 2 , uuid: '2' },
								{ base: BASE, vcType: 'ETH', units: 1, rate: 1 , uuid: '3' }]
				}
			};
			let result = account.refineAssets(ACCOUNT_ID, MARKET, BASE, {
				BTC: 2, ETH: 3
			}, {
				BTC: { ask: 1 },
				ETH: { ask: 1 }
			});
			expect(result.BTC.length).to.equal(1);
			expect(result.BTC[0].units).to.equal(2);
			expect(result.BTC[0].rate).to.equal(1);
			expect(result.ETH.length).to.equal(2);
			expect(result.ETH[0].units).to.equal(2);
			expect(result.ETH[0].rate).to.equal(1);
			expect(result.ETH[1].units).to.equal(1);
			expect(result.ETH[1].rate).to.equal(2);
		});
	});
});
