import fs from 'fs';
import fsExtra from 'fs-extra';
import path from 'path';
import { expect } from 'chai';
import sinon from 'sinon';
import mockdate from 'mockdate';
import * as history from '../../app/migration/history';
import * as accountDao from '../../app/database/account-dao';

describe('migration/history', () => {
    const ACCOUNTS_PATH = path.resolve(__dirname, '../../../data/accounts');
    const ACCOUNT = 'test-account';
    const MARKET = 'test-market';
    const BASE = 'test-base';

    let stubReaddirSync;
    let stubExistsSync;
    let stubCopySync;
    let stubRemoveSync;
    let stubWriteJsonSync;
    let stubGetHistory;
    let stubAddHistory;

    beforeEach(() => {
        stubReaddirSync = sinon.stub(fs, 'readdirSync');
        stubExistsSync = sinon.stub(fs, 'existsSync');
        stubCopySync = sinon.stub(fsExtra, 'copySync');
        stubRemoveSync = sinon.stub(fsExtra, 'removeSync');
        stubWriteJsonSync = sinon.stub(fsExtra, 'writeJsonSync');
        stubGetHistory = sinon.stub(accountDao, 'getHistory');
        stubAddHistory = sinon.stub(accountDao, 'addHistory');
    });

    afterEach(() => {
        fs.readdirSync.restore();
        fs.existsSync.restore();
        fsExtra.copySync.restore();
        fsExtra.removeSync.restore();
        fsExtra.writeJsonSync.restore();
        accountDao.getHistory.restore();
        accountDao.addHistory.restore();
    });

    describe('shouldBeMigrated', () => {
        it('return false when accounts do not exist', () => {
            stubReaddirSync.withArgs(ACCOUNTS_PATH).returns([]);

            expect(history.shouldBeMigrated()).to.be.false;
        });

        it('returns false when markets of account do not exist', () => {
            stubReaddirSync.withArgs(ACCOUNTS_PATH).returns([ACCOUNT]);
            stubReaddirSync.withArgs(path.resolve(ACCOUNTS_PATH, ACCOUNT)).returns([]);

            expect(history.shouldBeMigrated()).to.be.false;
        });

        it('returns false when history.json does not exist', () => {
            stubReaddirSync.withArgs(ACCOUNTS_PATH).returns([ACCOUNT]);
            stubReaddirSync.withArgs(path.resolve(ACCOUNTS_PATH, ACCOUNT)).returns([MARKET]);
            stubExistsSync.withArgs(path.resolve(ACCOUNTS_PATH, ACCOUNT, MARKET, 'history.json')).returns(false);

            expect(history.shouldBeMigrated()).to.be.false;
        });

        it('return false when base history is array type', () => {
            stubReaddirSync.withArgs(ACCOUNTS_PATH).returns([ACCOUNT]);
            stubReaddirSync.withArgs(path.resolve(ACCOUNTS_PATH, ACCOUNT)).returns([MARKET]);
            stubExistsSync.withArgs(path.resolve(ACCOUNTS_PATH, ACCOUNT, MARKET, 'history.json')).returns(true);
            stubGetHistory.withArgs(ACCOUNT, MARKET).returns({[BASE]: []});

            expect(history.shouldBeMigrated()).to.be.false;
        });

        it('return true when base history is not array type', () => {
            stubReaddirSync.withArgs(ACCOUNTS_PATH).returns([ACCOUNT]);
            stubReaddirSync.withArgs(path.resolve(ACCOUNTS_PATH, ACCOUNT)).returns([MARKET]);
            stubExistsSync.withArgs(path.resolve(ACCOUNTS_PATH, ACCOUNT, MARKET, 'history.json')).returns(true);
            stubGetHistory.withArgs(ACCOUNT, MARKET).returns({[BASE]: {}});

            expect(history.shouldBeMigrated()).to.be.true;
        });
    });

    describe('migrate', () => {
        const mockDateString = '1984/09/11'; // === 463676400000

        let mockDateTimestamp;

        beforeEach(() => {
            stubReaddirSync.withArgs(ACCOUNTS_PATH).returns([ACCOUNT]);
            stubReaddirSync.withArgs(path.resolve(ACCOUNTS_PATH, ACCOUNT)).returns([MARKET]);
            stubExistsSync.withArgs(path.resolve(ACCOUNTS_PATH, ACCOUNT, MARKET, 'history.json')).returns(true);
            stubGetHistory.withArgs(ACCOUNT, MARKET).returns({
                [BASE]: {
                    t1: [
                        {timestamp: 3},
                        {timestamp: 1},
                        {timestamp: 5}
                    ],
                    t2: [
                        {timestamp: 2},
                        {timestamp: 4},
                        {timestamp: 6},
                    ],
                },
            });

            mockdate.set(mockDateString);
            mockDateTimestamp = new Date().getTime();
        });

        afterEach(() => {
            mockdate.reset();
        });

        it('save backup file', () => {
            history.migrate();

            expect(stubCopySync.calledWith(
                path.resolve(ACCOUNTS_PATH, ACCOUNT, MARKET, 'history.json'),
                path.resolve(ACCOUNTS_PATH, ACCOUNT, MARKET, `history-${mockDateTimestamp}.json`)
            )).to.be.true;
        });

        it('remove history.json files', () => {
            history.migrate();

            expect(stubRemoveSync.calledWith(path.resolve(ACCOUNTS_PATH, ACCOUNT, MARKET, 'history.json'))).to.be.true;
        });

        it('create history.json with default value', () => {
            history.migrate();

            expect(stubWriteJsonSync.calledWith(path.resolve(ACCOUNTS_PATH, ACCOUNT, MARKET, 'history.json'), {})).to.be.true;
        });

        it('call addHistory in sorted timestamp asc', () => {
            history.migrate();

            expect(stubAddHistory.callCount).to.equal(6);
            expect(stubAddHistory.getCall(0).calledWith(ACCOUNT, MARKET, {timestamp: 1})).to.be.true;
            expect(stubAddHistory.getCall(1).calledWith(ACCOUNT, MARKET, {timestamp: 2})).to.be.true;
            expect(stubAddHistory.getCall(2).calledWith(ACCOUNT, MARKET, {timestamp: 3})).to.be.true;
            expect(stubAddHistory.getCall(3).calledWith(ACCOUNT, MARKET, {timestamp: 4})).to.be.true;
            expect(stubAddHistory.getCall(4).calledWith(ACCOUNT, MARKET, {timestamp: 5})).to.be.true;
            expect(stubAddHistory.getCall(5).calledWith(ACCOUNT, MARKET, {timestamp: 6})).to.be.true;
        });
    });
});