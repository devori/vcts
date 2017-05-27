import lowdb from 'lowdb';
import uuid from 'uuid';

const accounts = lowdb('./data/accounts.json');

let defaultValue = {};
accounts.defaults(defaultValue);

function addAsset(accountId, vcType, info) {
  accounts.get(accountId).get(`assets.${vcType}`).push(info).write();
  return accounts.get(accountId).get(`assets.${vcType}`).filter(info).cloneDeep().value();
}

function updateAsset(accountId, vcType, info) {
  let asset = accounts.get(`${accountId}.assets.${vcType}`).find({
    uuid: info.uuid
  }).assign(info).write();
}

function removeAsset(accountId, vcType, uuid) {
  let target = accounts.get(accountId).get(`assets.${vcType}`).find({
    uuid
  }).cloneDeep().value();
  accounts.get(accountId).get(`assets.${vcType}`).remove({uuid}).write();
  return target;
}

function searchAssets(accountId, vcType) {
  let assets = accounts.get(`${accountId}.assets`);
  if (vcType === undefined) {
    return assets.cloneDeep().value();
  } else {
    return assets.get(vcType).cloneDeep().value();
  }
}

export default {
  addAsset, updateAsset, removeAsset, searchAssets
};
