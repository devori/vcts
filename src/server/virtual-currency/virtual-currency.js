import vcDB from './database';
import uuid from 'uuid';

function add(vc, value) {
  if (!value) {
    throw 'value is empty';
  }
  return vcDB.add(vc, value);
}

function remove(vc, condition) {
  return vcDB.remove(vc, condition);
}

function search(vc, condition) {
  return vcDB.search(vc, condition) || {};
}

export default {
  add, remove, search
};
