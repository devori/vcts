import lowdb from 'lowdb';
import uuid from 'uuid/v4';

function findDao(accountId, market, target) {
  try {
    return lowdb(`./data/accounts/${accountId}/${market}/${target}.json`);
  } catch (err) {
    return null;
  };
}

function findByPath(dao, paths) {
  for (let i = 0; i < paths.length; i++) {
    let p = paths[i];
    if (!dao.has(p.name).value()) {
      if (!p.force) {
        return null;
      }
      dao.set(p.name, p.defaultValue).write();
    }
    dao = dao.get(p.name);
  }
  return dao;
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
  dao = findByPath(dao, [
    { name: asset.base, force: true, defaultValue: {} },
    { name: asset.vcType, force: true, defaultValue: [] }
  ]);
  asset.uuid = uuid();
  dao.push(asset).write();
  return dao.last().cloneDeep().value();
}

export function addHistory(accountId, market, history) {
  let dao = findDao(accountId, market, 'history');
  if (!dao) {
    return null;
  }
  dao = findByPath(dao, [
    { name: history.base, force: true, defaultValue: {} },
    { name: history.vcType, force: true, defaultValue: [] }
  ]);
  dao.push(history).write();
  return dao.last().cloneDeep().value();
}

export function removeAsset(accountId, market, condition) {
  let dao = findDao(accountId, market, 'assets');
  if (!dao) {
    return null;
  }
  dao = findByPath(dao, [
    { name: condition.base, force: false },
    { name: condition.vcType, force: false }
  ]);
  if (!dao.find({ uuid: condition.uuid }).value()) {
    return null;
  }
  let target = dao.find({
    uuid: condition.uuid
  }).cloneDeep().value();
  dao.remove({
    uuid: condition.uuid
  }).write();
  return target;
}

export function updateAsset(accountId, market, asset) {
  let dao = findDao(accountId, market, 'assets');
  if (!dao) {
    return null;
  }
  dao = findByPath(dao, [
    { name: asset.base, force: false },
    { name: asset.vcType, force: false }
  ]);
  if (!dao) {
    return null;
  }
  dao.find({ uuid: asset.uuid }).assign(asset).write();
  return dao.find({ uuid: asset.uuid }).cloneDeep().value();
}
