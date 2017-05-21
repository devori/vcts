import lowdb from 'lowdb';

const VC = {
  BTC: 'BTC',
  ETH: 'ETH',
  DASH: 'DASH',
  LTC: 'LTC',
  XRP: 'XRP'
};

const currencies = lowdb('./data/currencies.json');
let defaultValue = {};
for (let k in VC) {
  defaultValue[VC[k]] = [];
}
currencies.defaults(defaultValue);

function add(vc = VC.BTC, value) {
  currencies.get(vc).push(value).write();
  return currencies.get(vc).filter(value).value();
}

function remove(vc = VC.BTC, condition) {
  let target = currencies.get(vc).filter(condition).value();
  currencies.get(vc).remove(condition).write();
  return target;
}

function search(vc = VC.BTC, filter, sortCond) {
  let searching = currencies.get(vc).filter(filter).sortBy(sortCond.sortBy);
  if (sortCond.direction === 'desc') {
    return searching.takeRight(10).value();
  } else {
    return searching.take(10).value();
  }
}

export default {
  add, remove, search,
  VC
};
