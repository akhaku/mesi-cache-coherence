const CACHE_LINE_SIZE = 0x200; // 64 bytes (512 bits)
const DEFAULT_VALUE = 99; // default value in memory

const computeCacheLine = function(address) {
  return Math.floor(address / CACHE_LINE_SIZE);
}

const computeOffset = function(address) {
  return address % CACHE_LINE_SIZE;
}

module.exports = {
  computeCacheLine: computeCacheLine,
  computeOffset: computeOffset,
  CACHE_LINE_SIZE: CACHE_LINE_SIZE,
  DEFAULT_VALUE: DEFAULT_VALUE,
};
