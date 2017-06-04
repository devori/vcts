import { expect, should } from 'chai';
import priceFileDB from '../../app/database/priceFileDB';


describe('database/priceFileDB', () => {
  const TARGET_CURRENCY = 'ETH';
  let priceDBForTest = priceFileDB.load('testMarket');
  let priceInfo = {
    'price': 100,
    'timestamp': 123
  };

  before(() => {
    priceDBForTest.remove(TARGET_CURRENCY, () => true);
  })

  it('should return same instance when markent name is same', () => {
    expect(priceFileDB.load('testMarket')).to.be.equal(priceDBForTest);
  });

  it('should throw exception when value is null', () => {
    expect(() => {
      priceDBForTest.add(TARGET_CURRENCY, null);
    }).to.throw('value is empty');
  });

  it('should return added info when add call', () => {
    let result = priceDBForTest.add(TARGET_CURRENCY, priceInfo);
    expect(result.price).to.be.equal(100);
    expect(result.timestamp).to.be.equal(123);
    expect(result.uuid).to.exist;
  });

  it('should return price info matching condition when search call', () => {
    let result = priceDBForTest.search(TARGET_CURRENCY, priceInfo);
    expect(result).to.have.lengthOf(1);
    expect(result[0].price).to.be.equal(100);
    expect(result[0].timestamp).to.be.equal(123);
  });

  it('should return removed info when remove call', () => {
    let result = priceDBForTest.remove(TARGET_CURRENCY, priceInfo);
    expect(result).to.have.lengthOf(1);
    expect(result[0].price).to.be.equal(100);
    expect(result[0].timestamp).to.be.equal(123);
  });
});
