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
    return (Math.min(Math.max(minIn, parameter), maxIn) - minIn) /
      (maxIn - minIn) *
      (maxOut - minOut) +
      minOut;
  }
}