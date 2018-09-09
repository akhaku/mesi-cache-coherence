const chai = require('chai');
const L2Cache = require('../model/l2Cache');
const utils = require('../utils');
const MEMORY_ADDRESS = 0xa0; // 160

describe('MESI cache-coherence', function() {
  let l1Cache0, l1Cache1;

  beforeEach(function() {
    const l2Cache = new L2Cache(2);
    l1Cache0 = l2Cache.getL1Caches()[0];
    l1Cache1 = l2Cache.getL1Caches()[1];
  })

  it('is able to read a value from cache2 after writing in cache1', function() {
    l1Cache0.write(MEMORY_ADDRESS, 7);
    chai.expect(l1Cache1.read(MEMORY_ADDRESS)).to.equal(7);
  });

  it('is able to detect stale values and read the most current one', function() {
    l1Cache0.write(MEMORY_ADDRESS, 8);
    l1Cache1.write(MEMORY_ADDRESS, 9);
    chai.expect(l1Cache0.read(MEMORY_ADDRESS)).to.equal(9);
    chai.expect(l1Cache1.read(MEMORY_ADDRESS)).to.equal(9);
  });

  it('is able to load from main memory', function() {
    chai.expect(l1Cache0.read(MEMORY_ADDRESS)).to.equal(utils.DEFAULT_VALUE);
  });

  it('is able to share values loaded from main memory', function() {
    const previousMainMemoryItem = utils.DEFAULT_VALUE;
    utils.DEFAULT_VALUE = utils.DEFAULT_VALUE + 1;
    chai.expect(l1Cache0.read(MEMORY_ADDRESS)).to.equal(previousMainMemoryItem + 1);
    utils.DEFAULT_VALUE = previousMainMemoryItem;
    chai.expect(l1Cache1.read(MEMORY_ADDRESS)).to.equal(previousMainMemoryItem + 1);
  });
});
