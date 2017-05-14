import webdriver from '../webdriver/webdriver';
import accounts from './accounts';

export default {
  start(accountName) {
    let acc = accounts.get(accountName);
    if (!acc) {
      throw `There is no account : ${accountName}`;
    }
    
    let browser = webdriver.open();
    browser.url(acc.url);
  },
  stop() {
    webdriver.close();
  }
}
