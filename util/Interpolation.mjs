export default class Interpolation {
  /**
   * @param {number} parameter 
   * @param {number} minIn 
   * @param {number} maxIn 
   * @param {number} minOut 
   * @param {number} maxOut 
   * @returns {number}
   */
  static linear(parameter, minIn, maxIn, minOut = 0, maxOut = 1) {
    return project(
      normalize(parameter, minIn, maxIn),
      minOut, maxOut
    );
  }
}

/**
 * Clamps the x to be between a and b.
 *
 * @param {number} value Value to be clamped.
 * @param {number} min Minimum value.
 * @param {number} max Maximum value.
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(min, value), max);
}

/**
 * Normalizes the value to the range [0 .. 1] as a proportion of the range [min .. max].
 * Values outside this range will return 0 or 1, respectively.
 * 
 * @param {number} value Value to be changed.
 * @param {number} min Minimum value.
 * @param {number} max Maximum value.
 * @returns {number}
 */
export function normalize(value, min, max) {
  const normalized = (value - min) / (max - min);
  return clamp(normalized, 0, 1);
}

/**
 * Projects a ratio in the domain [0 .. 1] to the range [min .. max].
 * Ratios outside the domain will land proportionately outside the range.
 * 
 * @param {number} ratio Proportion of the range.
 * @param {number} min Minimum value.
 * @param {number} max Maximum value.
 * @returns {number}
 */
export function project(ratio, min, max) {
  return ratio * (max - min) + min;
}