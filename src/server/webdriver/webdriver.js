// import webdriverio from 'webdriverio';
let webdriverio = require('webdriverio');
let browsers = {};

export default {
  open(browserName) {
    if (!browsers[browserName]) {

      browsers[browserName] = webdriverio.remote({
        desiredCapabilities: {
          browserName
        }
      }).init();
    }
  },

  close(browserName) {
    let bw = browsers[browserName];
    if (!bw) {
      return;
    }
    bw.end();
  }
}
