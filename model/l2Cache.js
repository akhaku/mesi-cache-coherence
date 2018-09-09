const CacheLine = require('./cacheLine');
const L1Cache = require('./l1Cache');
const MESIState = require('./MESIState');

/**
 * An L2 cache. Each processor has its own L2 cache, and its main job to to coordinate the
 * cores' L1 caches.
 */
class L2Cache {
  constructor(numL1Caches) {
    /* An cache line (represented by a integer ID) to an array of
     * {cache: L1Cache, state: MESIState}. Multiple l1 caches can have that cache line,
     * which results in multiple entries of this object for the cache line. The assumption
     * here is that cache lines are aligned the same across all L1 caches.
     */
    this.cacheLineToCacheAndState = {};
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
   * When an L1Cache tries to write to a cache line and it hasn't already written to that
   * line or cached it exclusively, it calls this method to get ownership of the cache
   * line.
   * If other caches have the line, we fetch the line from them, invalidates the other
   * caches, and return the full cache line to the caller. Otherwise, we load it from main
   * memory and return it to the caller.
   */
  requestForOwnership(cacheLine, requestor) {
    const cachesAndStates = this.cacheLineToCacheAndState[cacheLine];
    let currentCacheLine = null;
    if (cachesAndStates && cachesAndStates.length > 0) {
      for (let i = 0; i < cachesAndStates.length; i++) {
        if (!cachesAndStates[i] || cachesAndStates[i].state === MESIState.I) {
          continue;
        }
        currentCacheLine = currentCacheLine
          || cachesAndStates[i].cache.snoopInvalidate(cacheLine);
        // no need to invalidate our own cache as we will be resetting it
      }
    }
    if (!currentCacheLine) {
      // no one had cached it, or they all no longer have it
      currentCacheLine = loadFromMainMemory(cacheLine);
    }
    // after invalidating all the caches that had that line, we can update our cache
    this.cacheLineToCacheAndState[cacheLine] = [{cache: requestor, state: MESIState.E}];
    /* Even though we are writing, we care about the previous value because we are not
     * writing the entire line, just one part of it. This allows the new owner of this
     * cache line to store the entire cache line without having to reload it from main
     * memory. */
    return currentCacheLine;
  }

  /**
   * When an L1Cache tries to read a value and it doesn't have it, it calls this method to
   * ask the L2Cache to share the cache line from main memory or from another L1Cache.
   */
  requestForShare(cacheLine, requestor) {
    const cachesAndStates = this.cacheLineToCacheAndState[cacheLine];
    if (!cachesAndStates || cachesAndStates.length === 0) {
      this.cacheLineToCacheAndState[cacheLine] = [{cache: requestor, state: MESIState.S}];
      return loadFromMainMemory(cacheLine);
    } else {
      for (let i = 0; i < cachesAndStates.length; i++) {
        if (!cachesAndStates[i] || cachesAndStates[i].state === MESIState.I) {
          continue;
        }
        const currentValue = cachesAndStates[i].cache.snoopShare(cacheLine);
        if (currentValue) { // doublecheck that it wasn't evicted from that cache
          cachesAndStates[i].state = MESIState.S;
          cachesAndStates.push({cache: requestor, state: MESIState.S});
          /* once we have found the first L1 that has it, we can assume that any other L1
           * caches that have it are already MESIState.S (or have evicted the cache line,
           * but let's not worry about that here). */
          return currentValue;
        } else {
          // update our cache if the cache line was evicted from the L1 cache
          cachesAndStates[i].state = MESIState.I;
        }
      }
      // if we haven't yet returned a value:
      cachesAndStates.push({cache: requestor, state: MESIState.S});
      return loadFromMainMemory(address);
    }
  }
}

function loadFromMainMemory(cacheLine) {
  // load a full cache line from main memory
  return new CacheLine();
}

module.exports = L2Cache;
