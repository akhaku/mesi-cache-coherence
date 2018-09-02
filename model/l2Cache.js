const L1Cache = require('./l1Cache');
const MESIState = require('./MESIState');

/**
 * An L2 cache. Each processor has its own L2 cache, and its main job to to coordinate the
 * cores' L1 caches.
 */
class L2Cache {
  constructor(numL1Caches) {
   // an address (not cache line, right?) to an array of L1Cache, MESIState
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

  /**
   * When a L1Cache tries to write to a memory address and it hasn't already written that
   * memory or have cached it exclusively, it calls this method to get ownership of the
   * address.
   */
  requestForOwnership(address, requestor) {
    const cacheAndState = this.addressToCacheAndState[address];
    if (!cacheAndState) {
      // no one has it, load from main memory and note that it is now cached
      this.addressToCacheAndState[address] = [requestor, MESIState.E];
      return loadFromMainMemory(address);
    } else {
      const [l1CacheWithValue, state] = cacheAndState;
      switch (state) {
          case MESIState.S: // other cache has it
            // when writing, why do we care about the previous value?
            this.addressToCacheAndState[address] = [requestor, MESIState.E];
            return l1CacheWithValue.snoopInvalidate(address);
          default:
            throw new Error('What do we do here?');
      }
    }
  }

  /**
   * When an L1Cache tries to read a value and it doesn't have it, it calls this method to
   * ask the L2Cache to share the value from main memory or from another L1Cache.
   */
  requestForShare(address, requestor) {
    const cacheAndState = this.addressToCacheAndState[address];
    if (!cacheAndState) {
      this.addressToCacheAndState[address] = [requestor, MESIState.S];
      return loadFromMainMemory(address);
    } else {
      const [l1CacheWithValue, state] = cacheAndState;
      switch (state) {
        case MESIState.M:
        case MESIState.E:
          const currentValue = l1CacheWithValue.snoopShare(address);
          this.addressToCacheAndState[address] = [l1CacheWithValue, MESIState.S];
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
