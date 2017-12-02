import lowdb from 'lowdb';
import uuid from 'uuid/v4';
import fs from 'fs'
import logger from '../util/logger'

function findDao(...filePaths) {
  try {
    return lowdb(`./data/accounts/${filePaths.join('/')}.json`);
  } catch (err) {
    return null;
  }
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

export function getMarketKeys(accountId, market) {
  let dao = findDao(accountId, market, 'key');
  if (!dao) {
    return null;
  }
  return dao.cloneDeep().value();
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
  return dao.cloneDeep().value() || [];
}

export function searchAssetById(accountId, market, base, vcType, id) {
  let dao = findDao(accountId, market, 'assets');
  if (!dao) {
    return null;
  };
  dao = findByPath(dao, [
    { name: base },
    { name: vcType }
  ]);
  if (!dao) {
    return null;
  }
  return dao.find({uuid: id}).cloneDeep().value() || {};
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

export function getHistory(accountId, market, base, vcType) {
  let dao = findDao(accountId, market, 'history');
  if (!dao) {
    return null;
  }
  if (base) {
    dao = dao.get(base);
    if (vcType) {
      dao = dao.get(vcType);
    }
  }
  return dao.cloneDeep().value();
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

export function createAccount(info) {
  try {
    fs.mkdirSync(`./data/accounts/${info.username}`);
    fs.mkdirSync(`./data/accounts/${info.username}/poloniex`);
    return {
      username: info.username
    };
  } catch (err) {
    logger.error(err);
    return null;
  }
}

export function existUser(accountId) {
  return fs.existsSync(`./data/accounts/${accountId}`);
}
