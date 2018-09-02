/* The entry point of the application. */
const NUM_L1_CACHES = 2;
const MEMORY_ADDRESS = '0xabc';

// create our caches
const l2Cache = new (require('./model/l2Cache'))(2);
const l1Cache0 = l2Cache.getL1Caches()[0];
const l1Cache1 = l2Cache.getL1Caches()[1];

console.log(`L1 cache 0: ${l1Cache0.getName()}`);
console.log(`L1 cache 1: ${l1Cache1.getName()}`);

l1Cache0.write(MEMORY_ADDRESS, 'a');
