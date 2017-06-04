import { expect, should } from 'chai';
import sinon from 'sinon';
import collectorForBithumb from '../../app/collector/bithumb';
import priceFileDB from '../../app/database/priceFileDB';
import { VCTYPES } from '../../app/properties';

describe('collector/bithumb', function () {

  let priceInfo = priceFileDB.load('testMarket2');

  before(() => {
    sinon.stub(priceFileDB, 'load').withArgs('bithumb').callsFake((marketName) => {
      priceFileDB.load.restore();
      return priceInfo;
    });
  });

  it('collected data should be added to priceFileDB', function (done) {
    collectorForBithumb.collect().then(data => {
      VCTYPES.forEach(vcType => {
        expect(data[vcType]).to.exist;
      });
      done();
    }).catch(reason => {
      expect.fail('', '', 'request failure');
    });
    this.timeout(3000);
  });

  after(() => {
    priceFileDB.load.restore && priceFileDB.load.restore();
  });
});
