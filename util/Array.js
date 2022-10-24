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

/**
 * @param {any[]} arr 
 * @returns 
 */
export function allSame(arr) {
  if (!Array.isArray(arr)) {
    throw new Error(`Argument to Array.allSame must be an array. Provided: ${arr}`);
  }
  return arr.every((el) => el === arr[0]);
}

export function arrayEquals(arr1, arr2) {
  if (!Array.isArray(arr1)) throw new Error(`First argument to Array.arrayEquals must be an array. Provided: ${arr1}`);
  if (!Array.isArray(arr2)) throw new Error(`Second argument to Array.arrayEquals must be an array. Provided: ${arr2}`);
  if (arr1.length !== arr2.length) return false;

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }

  return true;
}