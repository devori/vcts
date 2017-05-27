import lowdb from 'lowdb';
import uuid from 'uuid';

const accounts = lowdb('./data/accounts.json');

let defaultValue = {};
accounts.defaults(defaultValue);

function addAsset(accountId, vcType, info) {
  accounts.get(accountId).get(`assets.${vcType}`).push(info).write();
  return accounts.get(accountId).get(`assets.${vcType}`).filter(info).value();
}

function removeAsset(accountId, vcType, condition) {
  let target = accounts.get(accountId).get(`assets.${vcType}`).filter(condition).value();
  accounts.get(accountId).get(`assets.${vcType}`).remove(condition).write();
  return target;
}

function searchAssets(accountId) {
  return accounts.get(`${accountId}.assets`).value();
}

export default {
  addAsset, removeAsset, searchAssets
};
