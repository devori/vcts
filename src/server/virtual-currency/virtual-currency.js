import vcDB from './database';
import uuid from 'uuid';

function add(vc = vcDB.VC.BTC, value) {
  if (!value) {
    throw 'value is empty';
  }
  value.uuid = uuid.v1();
  return vcDB.add(vc, value);
}

function remove(vc = vcDB.VC.BTC, condition) {
  if (condition.uuid === undefined) {
    throw 'uuid is required';
  }
  return vcDB.remove(vc, condition);
}

function search(vc = vcDB.VC.BTC, condition) {
  let filter = {};
  let sortCondition = {
    sortBy: 'date',
    direction: 'desc'
  }
  for (let k in condition) {
    switch (k) {
      case 'sortBy':
      case 'direction':
        sortCondition[k] = condition[k];
        break;
      default:
        filter[k] = condition[k];
        break;
    }
  }

  return vcDB.search(vc, filter, sortCondition) || {};
}

export default {
  add, remove, search
};
