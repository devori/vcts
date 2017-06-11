import lowdb from 'lowdb';
import uuid from 'uuid';

let instances = {};

class AccountFileDB {
  constructor(accountId) {
    this.accountId = accountId;
    this.accountDB = lowdb(`./data/accounts/${accountId}.json`);
    this.accountDB.defaults({
      assets: {},
      history: {}
    }).write();
    this.accountHistoryDB = lowdb(`./data/accounts/${accountId}-history.json`);
    this.accountHistoryDB.defaults({
      trade: {}
    });
  }

  addHistory(vcType, info) {
    if (!this.accountHistoryDB.has(`trade.${vcType}`).value()) {
      this.accountHistoryDB.set(`trade.${vcType}`, []).write();
    }
    this.accountHistoryDB.get(`trade.${vcType}`).push(info).write();
  }

  addAsset(vcType, info) {
    if (!this.accountDB.has(`assets.${vcType}`).value()) {
      this.accountDB.set(`assets.${vcType}`, []).write();
    }
    this.accountDB.get(`assets.${vcType}`).push(info).write();
    return this.accountDB.get(`assets.${vcType}`).find(info).cloneDeep().value();
  }

  updateAsset(vcType, info) {
    this.accountDB.get(`assets.${vcType}`).find({
      uuid: info.uuid
    }).assign(info).write();
    return this.accountDB.get(`assets.${vcType}`).find(info).cloneDeep().value();
  }

  removeAsset(vcType, uuid) {
    let target = this.accountDB.get(`assets.${vcType}`).find({
      uuid
    }).cloneDeep().value();
    this.accountDB.get(`assets.${vcType}`).remove({uuid}).write();
    return target;
  }

  searchAssets(vcType) {
    let assets = this.accountDB.get('assets');
    if (vcType === undefined) {
      return assets.cloneDeep().value();
    } else {
      return assets.get(vcType).cloneDeep().value();
    }
  }
}

export default {
  load: (accountId) => {
    let result = instances[accountId];
    if (!result) {
      result = instances[accountId] = new AccountFileDB(accountId);
    }
    return result;
  }
};
