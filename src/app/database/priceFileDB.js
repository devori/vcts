import uuid from 'uuid';
import lowdb from 'lowdb';
import { VCTYPES } from '../properties';

let instances = {};

class PriceFileDB {
  constructor(marketName) {
    this.fileDB = lowdb(`./data/prices/${marketName}.json`);
    let defaultValue = {};
    VCTYPES.forEach(vcType => {
      defaultValue[vcType] = [];
    });
    this.fileDB.defaults(defaultValue).write();
  }

  add(vc, value) {
    if (!value) {
      throw 'value is empty';
    }
    value.uuid = uuid.v1();
    this.fileDB.get(vc).push(value).write();
    return this.fileDB.get(vc).find(value).cloneDeep().value();
  }

  remove(vc, condition) {
    let target = this.fileDB.get(vc).filter(condition).cloneDeep().value();
    this.fileDB.get(vc).remove(condition).write();
    return target;
  }

  search(vc, condition) {
    return this.fileDB.get(vc).filter(condition).cloneDeep().value();
  }
}

export default (marketName => {
  let result = instances[marketName];
  if (!result) {
    result = instances[marketName] = new PriceFileDB(marketName);
  }
  return result;
});
