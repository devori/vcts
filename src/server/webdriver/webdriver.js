// import webdriverio from 'webdriverio';
let webdriverio = require('webdriverio');
let browsers = {};

export default {
  open(browserName = 'chrome') {
    if (!browsers[browserName]) {

      browsers[browserName] = webdriverio.remote({
        desiredCapabilities: {
          browserName
        }
      }).init();
    }
    return browsers[browserName];
  },

  close(browserName = 'chrome') {
    let bw = browsers[browserName];
    if (!bw) {
      return;
    }
    bw.end();
    browsers[browserName] = null;
  }
}
