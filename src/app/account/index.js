import crypto from 'crypto';
import * as accountDao from '../database/account-dao';

function getHmacSha512(secretKey, data) {
    let dataStr = "";
    for (let k in data) {
        dataStr += encodeURIComponent(k) + '=' + encodeURIComponent(data[k]) + "&";
    }
    if (dataStr.charAt(dataStr.length - 1) === '&') {
        dataStr = dataStr.substr(0, dataStr.length - 1);
    }
    return crypto.createHmac('sha512', secretKey).update(dataStr).digest('hex');
}

export function register(info) {
    return accountDao.createAccount(info);
}

export function existUser(username) {
    return accountDao.existUser(username);
}

export function authenticate(accountId, source, dest) {
    let secretKey = accountDao.getSecretKey(accountId);
    if (!secretKey) {
        return false;
    }
    let hash = getHmacSha512(secretKey, source);

	return hash === dest;
}

export function getMarketKeys(accountId, market) {
    return accountDao.getMarketKeys(accountId, market);
}

export function searchAssets(accountId, market, base, vcType) {
    return accountDao.searchAssets(accountId, market, base, vcType);
}

export function addAsset(accountId, market, asset) {
    asset.type = 'buy';
    addHistory(accountId, market, asset);
    let matchedAsset = accountDao.searchAssets(accountId, market, asset.base, asset.vcType).filter(a => a.rate === asset.rate)[0];
    if (matchedAsset) {
        accountDao.updateAsset(accountId, market, Object.assign(matchedAsset, {
            units: asset.units + matchedAsset.units
        }));
    } else {
        accountDao.addAsset(accountId, market, asset);
    }
}

export function addHistory(accountId, market, history) {
    return accountDao.addHistory(accountId, market, history);
}

export function removeAssetsByIds(accountId, market, asset, ids) {
    asset.type = 'sell';
    let {base, vcType, units} = asset;
    if (units <= 0) {
        return;
    }

    let totalEstimation = 0;
    let totalUnits = 0;
    ids.reduce((restUnits, uuid) => {
        if (restUnits <= 0) {
            return 0;
        }
        const asset = accountDao.searchAssetById(accountId, market, base, vcType, uuid);
        if (asset.units <= restUnits) {
            accountDao.removeAsset(accountId, market, {
                base,
                vcType,
                uuid,
            });
            totalEstimation += asset.units * asset.rate;
            totalUnits += asset.units;
        } else {
            accountDao.updateAsset(accountId, market, {
                base,
                vcType,
                uuid,
                units: asset.units - restUnits,
            });
            totalEstimation += restUnits * asset.rate;
            totalUnits += restUnits;
        }
        return restUnits - asset.units;
    }, units);

    asset.buy = totalEstimation / totalUnits;
    addHistory(accountId, market, asset);
}

export function removeAssetById(accountId, market, asset) {
    return accountDao.removeAsset(accountId, market, asset);
}

export function removeAsset(accountId, market, asset) {
    asset.type = 'sell';
    let {base, vcType, units} = asset;
    if (units <= 0) {
        return;
    }
    let assets = searchAssets(accountId, market, base, vcType);
    assets.sort((a1, a2) => a2.rate - a1.rate);
    let total = 0;
    for (let i = assets.length - 1; i >= 0; i--) {
        if (units <= 0) {
            break;
        }
        if (assets[i].units <= units) {
            accountDao.removeAsset(accountId, market, {
                base,
                vcType,
                uuid: assets[i].uuid
            });
            units -= assets[i].units;
            total += assets[i].units * assets[i].rate;
        } else {
            accountDao.updateAsset(accountId, market, {
                base,
                vcType,
                units: assets[i].units - units,
                uuid: assets[i].uuid
            });
            total += units * assets[i].rate;
            units = 0;
        }
    }
    asset.buy = total / (asset.units - units);
    addHistory(accountId, market, asset);
}

export function getHistory(accountId, market, base, conditions) {
    return accountDao.getHistory(accountId, market, base, conditions);
}

export function getUser(accountId) {
    if (accountDao.existUser(accountId)) {
        return {id: accountId};
    }
    return null;
}

export function refineAssets(accountId, market, base, balances, tickers) {
    let curtime = new Date().getTime();
    let result = {};
    for (let vcType in balances) {
        if (!tickers[vcType]) {
            continue;
        }
        let sumUnits = searchAssets(accountId, market, base, vcType).reduce((acc, a) => acc + a.units, 0);
        if (balances[vcType] < sumUnits) {
            removeAsset(accountId, market, {
                base,
                vcType,
                units: sumUnits - balances[vcType],
                timestamp: curtime
            });
        } else if (balances[vcType] > sumUnits) {
            addAsset(accountId, market, {
                base,
                vcType,
                units: balances[vcType] - sumUnits,
                rate: tickers[vcType].ask,
                timestamp: curtime,
            });
        }
        searchAssets(accountId, market, base, vcType)
            .sort((a1, a2) => a1.rate - a2.rate)
            .reduce((pre, a) => {
                if (pre && pre.rate === a.rate) {
                    pre.units += a.units;
                    accountDao.updateAsset(accountId, market, pre);
                    accountDao.removeAsset(accountId, market, a);
                    return pre;
                } else {
                    return a;
                }
            }, null);
        result[vcType] = searchAssets(accountId, market, base, vcType);
    }
    return result;
}

export function mergeAssets(accountId, market, base, vcType, ids) {
    const mergedAsset = ids.reduce((acc, id) => {
        const asset = accountDao.searchAssetById(accountId, market, base, vcType, id);
        if (!acc) {
            return asset;
        }
        const total = acc.rate * acc.units + asset.rate * asset.units;
        acc.units += asset.units;
        acc.rate = total / acc.units;

        return acc;
    }, null);

    ids.slice(1).forEach(id => {
        const asset = accountDao.searchAssetById(accountId, market, base, vcType, id);
        accountDao.removeAsset(accountId, market, asset);
    });

    return accountDao.updateAsset(accountId, market, mergedAsset);
}
