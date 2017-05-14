import lowdb from 'lowdb';

const accounts = lowdb('./data/accounts.json');

accounts.defaults({}).write();

export default {
  get(accountName) {
    if (accounts.has(accountName).value()) {
      return accounts.get(accountName).value();
    }
    return null;
  }
}
