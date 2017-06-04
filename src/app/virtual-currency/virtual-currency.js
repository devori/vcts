import uuid from 'uuid';
import priceDBLoader from '../database/priceFileDB';

let priceDB = priceDBLoader('bithumb');

function add(vc, value) {
  if (!value) {
    throw 'value is empty';
  }
  return priceDB.add(vc, value);
}

function remove(vc, condition) {
  return priceDB.remove(vc, condition);
}

function search(vc, condition) {
  return priceDB.search(vc, condition) || [];
}

export default {
  add, remove, search
};
