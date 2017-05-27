import lowdb from 'lowdb';

const VC = {
  BTC: 'BTC',
  ETH: 'ETH',
  DASH: 'DASH',
  LTC: 'LTC',
  ETC: 'ETC'
};

const currencies = lowdb('./data/currencies.json');
let defaultValue = {};
for (let k in VC) {
  defaultValue[VC[k]] = [];
};
currencies.defaults(defaultValue).write();

function add(vc = VC.BTC, value) {
  currencies.get(vc).push(value).write();
  return currencies.get(vc).filter(value).cloneDeep().value();
}

function remove(vc = VC.BTC, condition) {
  let target = currencies.get(vc).filter(condition).cloneDeep().value();
  currencies.get(vc).remove(condition).write();
  return target;
}

function search(vc = VC.BTC, filter, sortCond) {
  let searching = currencies.get(vc).filter(filter).sortBy(sortCond.sortBy);
  if (sortCond.direction === 'desc') {
    return searching.takeRight(10).cloneDeep().value();
  } else {
    return searching.take(10).cloneDeep().value();
  }
}

export default {
  add, remove, search,
  VC
};
