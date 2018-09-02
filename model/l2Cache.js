const L1Cache = require('./l1Cache');
const MESIState = require('./MESIState');

/**
 * An L2 cache. Each processor has its own L2 cache, and its main job to to coordinate the
 * cores' L1 caches.
 */
class L2Cache {
  constructor(numL1Caches) {
    this.addressToCacheAndState = {};
    this.l1Caches = [];
    for (let i = 0; i < numL1Caches; i++) {
      this.l1Caches.push(new L1Cache(`L1-${i}`, this));
    }
  }

  /**
   * Return an array of all the L1 caches.
   */
  getL1Caches() {
    return this.l1Caches;
  }

  requestForOwnership(address, requestor) {
    const cacheAndState = addressToCacheAndState[address]; // cache line or address?
    if (!cacheAndState) {
      // no one has it, load from main memory and note that it is now cached
      addressToCacheAndState[address] = [requestor, MESIState.E];
      return loadFromMainMemory(address);
    } else {
      const [l1CacheWithValue, state] = cacheAndState;
      switch (state) {
          case MESIState.S: // other cache has it
            // when writing, why do we care about the previous value?
            addressToCacheAndState[address] = [requestor, MESIState.E];
            return l1CacheWithValue.snoopInvalidate(address);
          default:
            throw new Error('What do we do here?');
      }
    }
  }

  requestForShare(address, requestor) {
    const cacheAndState = addressToCacheAndState[address]; // cache line or address?
    if (!cacheAndState) {
      addressToCacheAndState[address] = [requestor, MESIState.S];
      return loadFromMainMemory(address);
    } else {
      const [l1CacheWithValue, state] = cacheAndState;
      switch (state) {
        case MESIState.M:
        case MESIState.E:
          const currentValue = l1CacheWithValue.snoopShare(address);
          addressToCacheAndState[address] = [l1CacheWithValue, MESIState.S];
          return currentValue;
        case MESIState.S:
          return l1CacheWithValue.addressToValue[address];
        default:
          throw new Error('Should never happen?');
      }
    }
  }
}

function loadFromMainMemory(address) {
  // load some dummy value from main memory
  return 'x';
}

module.exports = L2Cache;
