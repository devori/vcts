import { expect, should } from 'chai';
import priceFileDB from '../../app/database/priceFileDB';


describe('database/priceFileDB', () => {
  const TARGET_CURRENCY = 'ETH';
  let priceDBForTest = priceFileDB('testMarket');
  let priceInfo = {
    'price': 100,
    'uuid': 'test-0'
  };

  before(() => {
    priceDBForTest.remove(TARGET_CURRENCY, () => true);
  })

  it('should return same instance when markent name is same', () => {
    expect(priceFileDB('testMarket')).to.be.equal(priceDBForTest);
  });

  it('should return added info when add call', () => {
    let result = priceDBForTest.add(TARGET_CURRENCY, priceInfo);
    expect(result.price).to.be.equal(100);
    expect(result.uuid).to.be.equal('test-0');
  });

  it('should return price info matching condition when search call', () => {
    let result = priceDBForTest.search(TARGET_CURRENCY, priceInfo);
    expect(result).to.have.lengthOf(1);
    expect(result[0].price).to.be.equal(100);
    expect(result[0].uuid).to.be.equal('test-0');
  });

  it('should return removed info when remove call', () => {
    let result = priceDBForTest.remove(TARGET_CURRENCY, priceInfo);
    expect(result).to.have.lengthOf(1);
    expect(result[0].price).to.be.equal(100);
    expect(result[0].uuid).to.be.equal('test-0');
  });
});
