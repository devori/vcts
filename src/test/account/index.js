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

	let mockAccountDao;
	before(() => {
		mockAccountDao = sinon.mock(accountDao);

		sinon.stub(accountDao, 'createAccount').returns({
			apiKey: API_KEY,
			secretKey: SECRET_KEY
		});
		sinon.stub(accountDao, 'addAsset').returnsArg(2);
		sinon.stub(accountDao, 'addHistory').returnsArg(2);
		sinon.stub(accountDao, 'searchAssets').callsFake((accountId, market, base, vcType) => {
			let result = [
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
			];
			if (!base) {
				result = {
					USDT: {
						BTC: result
					}
				}
			}
			return result;
		});
		sinon.stub(accountDao, 'getHistory').returns({
			USDT: {
				BTC: [{ base: 'USDT' }]
			}
		});
	});

	it('should return result of dao when addAsset call', () => {
		let result = account.addAsset(ACCOUNT_ID, MARKET, {
			base: 'USDT',
			vcType: 'BTC',
			units: 1.23,
			rate: 2500
		});
		expect(result.base).to.equal('USDT');
		expect(result.vcType).to.equal('BTC');
		expect(result.units).to.equal(1.23);
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
		account.removeAsset(ACCOUNT_ID, MARKET, 'USDT', 'BTC', 2.5);
		mockAccountDao.verify();
	});

	it('should return api key info when register call', () => {
		let result = account.register({});
		expect(result.apiKey).to.equal(API_KEY);
		expect(result.secretKey).to.equal(SECRET_KEY);
	});

	it('should return histories matched accountId when getHistory call', () => {
		let result = account.getHistory(ACCOUNT_ID, MARKET, 'USDT', 'BTC');
		expect(result.USDT).to.exist;
		expect(result.USDT.BTC).to.exist;
		expect(result.USDT.BTC.length).to.equal(1);
	});

	it('should return assets matched accountId when searchAssets call', () => {
		let result = account.searchAssets(ACCOUNT_ID, MARKET);
		expect(result.USDT).to.exist;
		expect(result.USDT.BTC).to.exist;
		expect(result.USDT.BTC.length).to.equal(2);
	});

	describe('getUser', () => {
		before(() => {
			sinon.stub(accountDao, 'existUser')
				.withArgs(ACCOUNT_ID).returns(true)
				.withArgs(NON_EXIST_ACCOUNT_ID).returns(false);
		})
		it('should return username when the user exists', () => {
			let user = account.getUser(ACCOUNT_ID);
			expect(user.id).to.equal(ACCOUNT_ID);
		});
		it('should return null when the user does not exist', () => {
			let user = account.getUser(NON_EXIST_ACCOUNT_ID);
			expect(user).to.be.null;
		});
	})

	after(() => {
		accountDao.createAccount.restore();
		accountDao.addAsset.restore();
		accountDao.addHistory.restore();
		accountDao.searchAssets.restore();
		accountDao.getHistory.restore();
		mockAccountDao.restore();
	});
});
