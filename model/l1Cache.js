const MESIState = require('./MESIState');
/**
 * An L1 cache. Each core has its own L1 cache.
 * Note that for simplicy's sake, we assume that every memory address is on its own cache
 * line.
 */
class L1Cache {
  constructor(name, l2cache) {
    this.name = name;
    this.l2cache = l2cache;
    this.cacheLineToState = {}; // address as a string to state
    this.addressToValue = {};
  }

  getName() {
    return this.name;
  }

  write(address, value) {
    // compute cache line and figure out what state it is in
    const cacheLine = computeCacheLine(address);
    const cacheLineState = this.cacheLineToState[cacheLine] || MESIState.EMPTY;
    switch (cacheLineState) {
        case MESIState.M:
        case MESIState.E:
          this.addressToValue[address] = value;
          this.cacheLineToState[cacheLine] = MESIState.M;
          break;
        case MESIState.S:
        case MESIState.EMPTY:
          // request for ownership - ack returns the current value, lets us change state
          const currentValue = l2Cache.requestForOwnership(address, this);
          this.cacheLineToState[cacheLine] = MESIState.M;
          this.addressToValue[address] = value;
          break;
        case MESIState.I:
          throw new Error('Invalid state, what do we do?');
    }
  }

  read(address) {
    const cacheLine = computeCacheLine(address);
    const cacheLineState = this.cacheLineToState[cacheLine] || MESIState.EMPTY;
    switch (cacheLineState) {
      case MESIState.M:
      case MESIState.E:
      case MESIState.S:
        return this.addressToValue[address];
      case MESIState.I:
      case MESIState.EMPTY:
        const currentValue = l2cache.requestForShare(address, this);
        this.cacheLineToState[cacheLine] = MESIState.S;
        this.addressToValue[address] = currentValue;
        return currentValue;
    }
  }

  snoopInvalidate(address) {
    // sanity checks
    if (!this.cacheLineToState[computeCacheLine(address)]
        || !this.addressToValue[address]) {
      throw new Error(`Missing data at address ${address}`);
    }

    this.cacheLineToState[computeCacheLine(address)] = MESIState.I;
    // return the existing data, this is also like an ack
    return this.addressToValue[address];
  }

  snoopShare(address) {
    const cacheLineState = this.cacheLineToState[cacheLine] || MESIState.EMPTY;
    switch (cacheAndState) {
      case MESIState.M:
      case MESIState.E:
        this.cacheLineToState[cacheLine] = MESIState.S;
        return this.addressToValue[address];
      default:
        throw new Error('Should not be calling snoopShare unless M or E');
    }
}

function computeCacheLine(address) {
  // for simplicity's sake we are assuming two cache lines, based on the string length
  return address.length % 2;
}

module.exports = L1Cache;
