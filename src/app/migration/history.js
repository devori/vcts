import fs from 'fs';
import path from 'path';
import fsExtra from 'fs-extra';
import * as accountDao from '../database/account-dao';

const ACCOUNTS_PATH = path.resolve(__dirname, '../../../data/accounts');

export function shouldBeMigrated() {
    return getShouldBeMigratedList().length > 0;
}

export function migrate() {
    const markets = getShouldBeMigratedList();
    markets.forEach(({account, market}) => {
        fsExtra.copySync(
            path.resolve(ACCOUNTS_PATH, account, market, 'history.json'),
            path.resolve(ACCOUNTS_PATH, account, market, `history-${new Date().getTime()}.json`)
        );

        const marketHistory = accountDao.getHistory(account, market, null, {});

        fsExtra.removeSync(path.resolve(ACCOUNTS_PATH, account, market, 'history.json'));
        fsExtra.writeJsonSync(path.resolve(ACCOUNTS_PATH, account, market, 'history.json'), {});

        Object.keys(marketHistory).forEach((base) => {
            const histories = Object.keys(marketHistory[base]).reduce((flatHistory, vcType) => {
                return flatHistory.concat(marketHistory[base][vcType]);
            }, []);

            histories.sort((h1, h2) => h1.timestamp - h2.timestamp);
            histories.forEach(h => {
                accountDao.addHistory(account, market, h);
            });
        });
    });
}

function getShouldBeMigratedList() {
    const accountNames = fs.readdirSync(ACCOUNTS_PATH);
    if (accountNames.length === 0) {
        return [];
    }

    return accountNames.map((account) => {
        return fs.readdirSync(path.resolve(ACCOUNTS_PATH, account))
            .map(market => ({account, market}));
    }).reduce((markets, marketsPerAccount) => markets.concat(marketsPerAccount), [])
        .filter(({account, market}) => fs.existsSync(path.resolve(ACCOUNTS_PATH, account, market, 'history.json')))
        .filter(({account, market}) => {
            const history = accountDao.getHistory(account, market, null, {});
            for (const base in history) {
                if (history[base] instanceof Array) {
                    continue;
                }
                return true;
            }
            return false;
        });
}