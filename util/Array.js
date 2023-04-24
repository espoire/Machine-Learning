/** Resets all members of a multidimensional array based on a generator function.
 * 
 * @param {any[]} arr
 * @param {Function} generatorFn
 * @param {number} [offset]
 */
 export function fillFromFunction(arr, generatorFn, offset = 0) {
  for(let i = 0; i < arr.length; i++) {
    if(Array.isArray(arr[i])) {
      offset = fillFromFunction(arr[i], value, offset);
    } else {
      arr[i] = generatorFn(offset++);
    }
  }

  return offset;
}

/**
 * @param {number[]} arr 
 * @returns {number} The sum of all elements in the array, or zero if the array is empty.
 */
export function arraySum(arr) {
  if (!Array.isArray(arr)) {
    throw new Error(`Argument to Array.arraySum must be an array. Provided: ${arr}`);
  }
  
  let sum = 0;
  for (const element of arr) {
    sum += element;
  }
  return sum;
}

export function arrayMean(arr) {
  return arraySum(arr) / arr.length;
}

/** Performs memberwise multiplication of two arrays.
 * 
 * @param {number[]} arr1 
 * @param {number[]} arr2 
 * @returns {number[]} An array containing the memberwise products.
 */
export function arrayMultiply(arr1, arr2) {
  if (!Array.isArray(arr1)) throw new Error(`First argument to Array.arrayMultiply must be an array. Provided: ${arr1}`);
  if (!Array.isArray(arr2)) throw new Error(`Second argument to Array.arrayMultiply must be an array. Provided: ${arr2}`);
  if (arr1.length !== arr2.length) throw new Error(`Both array arguments to Array.arrayMultiply must have the same length. Lengths: ${arr1.length}, ${arr2.length}.`);

  const ret = [];
  for (let i = 0; i < arr1.length; i++) {
    ret.push(arr1[i] * arr2[i]);
  }
  return ret;
}

/** Performs memberwise multiplication of two arrays.
 * 
 * @param {number[]} arr1
 * @param {number} scalar 
 * @returns {number[]} An array containing the memberwise products.
 */
export function arrayScale(arr, scalar) {
  if (!Array.isArray(arr)) throw new Error(`First argument to Array.arrayScale must be an array. Provided: ${arr}`);
  if (typeof scalar !== 'number') throw new Error(`Second argument to Array.arrayMultiply must be a number. Provided: ${scalar}`);

  return arr.map(el => el * scalar);
}

/**
 * @param {any[]} arr 
 * @returns {boolean} True if every element of the input array is equal to every other element, and false otherwise.
 */
export function allSame(arr) {
  if (!Array.isArray(arr)) {
    throw new Error(`Argument to Array.allSame must be an array. Provided: ${arr}`);
  }
  return arr.every((el) => el === arr[0]);
}

/**
 * @param {any[]} arr1 
 * @param {any[]} arr2 
 * @returns {boolean} True if the given arrays are pairwise equal, and false otherwise.
 */
export function arrayEquals(arr1, arr2) {
  if (!Array.isArray(arr1)) throw new Error(`First argument to Array.arrayEquals must be an array. Provided: ${arr1}`);
  if (!Array.isArray(arr2)) throw new Error(`Second argument to Array.arrayEquals must be an array. Provided: ${arr2}`);
  if (arr1.length !== arr2.length) return false;

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }

  return true;
}

export function ensureArray(maybeArray) {
  if (!Array.isArray(maybeArray)) return [maybeArray];
  return maybeArray;
}