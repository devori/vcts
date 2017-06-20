import lowdb from 'lowdb';
import uuid from 'uuid/v4';

function findDao(accountId, market) {
  try {
    return lowdb(`./data/accounts/${accountId}/${market}/assets.json`);
  } catch (err) {
    return null;
  };
}

export function searchAssets(accountId, market, base, vcType) {
  let dao = findDao(accountId, market);
  if (!dao) {
    return null;
  };
  if (base) {
    dao = dao.get(base);
  }
  if (vcType) {
    dao = dao.get(vcType);
  }
  return dao.cloneDeep().value();
}

export function addAsset(accountId, market, asset) {
  let dao = findDao(accountId, market);
  if (!dao) {
    return null;
  }
  if (!dao.has(asset.base).value()) {
    dao.set(asset.base, {}).write();
  }
  dao = dao.get(asset.base);
  if (!dao.has(asset.vcType).value()) {
    dao.set(asset.vcType, []);
  }
  dao = dao.get(asset.vcType);
  asset.uuid = uuid();
  dao.push(asset).write();
  return dao.last().cloneDeep().value();
}
