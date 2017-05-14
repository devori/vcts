import webdriver from '../webdriver/webdriver';
import accounts from './accounts';

let schedules = {};

function start(accountName) {
  let acc = accounts.get(accountName);
  if (!acc) {
    console.log(`There is no account : ${accountName}`);
    return;
  }

  if (schedules[accountName]) {
    return;
  }

  let browser = webdriver.open();
  browser.url(acc.url);
  browser.waitUntil(() => true, 5000);
  stop();

  schedules[accountName] = setTimeout(() => {
    schedules[accountName] = null;
    start(accountName);
  }, 10000);
}

function stop() {
  console.log('schedule stop');
  for (let key in schedules) {
    clearTimeout(schedules[key]);
    schedules[key] = null;
  }
  webdriver.close();
}

export default {
  start, stop
}
