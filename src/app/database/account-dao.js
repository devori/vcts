import lowdb from 'lowdb';
import uuid from 'uuid/v4';

function findDao(accountId, market, target) {
  try {
    return lowdb(`./data/accounts/${accountId}/${market}/${target}.json`);
  } catch (err) {
    return null;
  };
}

export function searchAssets(accountId, market, base, vcType) {
  let dao = findDao(accountId, market, 'assets');
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
  let dao = findDao(accountId, market, 'assets');
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

export function addHistory(accountId, market, history) {
  let dao = findDao(accountId, market, 'history');
  if (!dao) {
    return null;
  }
  if (!dao.has(history.base).value()) {
    dao.set(history.base, {}).write();
  }
  dao = dao.get(history.base);
  if (!dao.has(history.vcType).value()) {
    dao.set(history.vcType, []);
  }
  dao = dao.get(history.vcType);
  dao.push(history).write();
  return dao.last().cloneDeep().value();
}
