/**
 * @template T
 * @param {T[]} array
 * @param {number} sampleSize
 * @param {() => number} randomFunc
 * @returns {T[]}
 */
export function randomArraySample(
  array, sampleSize, randomFunc
) {
  const ret = Array(sampleSize);

  for (let i = 0; i < sampleSize; i++) {
    const index = randInt(0, array.length -1, randomFunc);
    ret[i] = array[index];
  }

  return ret;
}

/** 
 * @param {number} min
 * @param {number} max
 * @param {() => number} randomFunc An alternate random function to use in place of Math.random.
 * @returns {number} A random integer from min to max (inclusive).
 */
export function randInt(min, max, randomFunc = Math.random) {
  const roll = (randomFunc || Math.random)();
  return Math.floor(roll * (max - min + 1)) + min;
}