import lowdb from 'lowdb';
import { VCTYPES } from '../properties';

const currencies = lowdb('./data/currencies.json');
let defaultValue = {};
VCTYPES.forEach(vcType => {
  defaultValue[vcType] = [];
});
currencies.defaults(defaultValue).write();

function add(vc, value) {
  currencies.get(vc).push(value).write();
  return currencies.get(vc).filter(value).cloneDeep().value();
}

function remove(vc, condition) {
  let target = currencies.get(vc).filter(condition).cloneDeep().value();
  currencies.get(vc).remove(condition).write();
  return target;
}

function search(vc, filter) {
  return currencies.get(vc).filter(filter).cloneDeep().value();
}

export default {
  add, remove, search
};
