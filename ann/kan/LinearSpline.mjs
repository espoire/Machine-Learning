import { visualizeSplineToFile } from "./devTestTool/splineVisualizer.mjs";

export class LinearSpline {
  /**
   * @type {number[]} 
   * 
   * A one-dimensional array of length 3 or greater, containing the y-values of the control points.
   * The x-values are implicit; the first control point is always at x = 0, and the last control point is always at x = 1.
   * The remaining control points are evenly-spaced in the range (0 .. 1).
   * For example, if there are 4 total control points, then the x-values of the control points are at x = 0/3 = 0, x = 1/3, x = 2/3, and x = 3/3 = 1. 
   */
  controlPoints;

  constructor(controlPoints) {
    this.controlPoints = controlPoints;
  }

  /**
   * @param {number} [n=10] The number of control points to generate.
   * @param {() => number} [randomFn=Math.random] The random function to use. Typically omissible, but may be useful in case seeded-randomness is desired.
   * @returns {LinearSpline} A new LinearSpline, with the specified number of control points, with the y-value of each control point independently randomized.
   */
  static random(n = 10, randomFn = Math.random) {
    const controlPoints = new Array(n);
    for (let i = 0; i < n; i++) controlPoints[i] = randomFn();

    return new LinearSpline(controlPoints);
  }

  /**
   * @param {number[]} deltas A collection of deltas describing the increase (or decrease, if negative) to each control point's y-value.
   */
  updateControlPoints(deltas) {
    const n = this.controlPoints.length;
    for (let i = 0; i < n; i++) this.controlPoints[i] += deltas[i];
  }

  /**
   * @param {number} x A number in the range 0 to 1, inclusive. The x-coordinate at which to evaluate the spline.
   * @returns {number} The value returned at x from the relevant spline piecewise part function containing x.
   */
  evaluateAt(x) {
    const n = this.controlPoints.length - 1;
    const h = 1 / n;
  
    // Calculate the index of the control point interval where x is located
    let i = Math.floor(x / h);
    if (i >= n) i = n - 1;  // Ensure the last interval is handled properly
  
    // Local parameter u in the interval [i*interval, (i+1)*interval]
    // u is in the range [0 .. 1], where 0 is the left terminus of the interval, and 1 is the right terminus.
    const u = (x - i * h) / h;

    return this.controlPoints[i] * (1 - u) + this.controlPoints[i+1] * u;
  }

  static visualizeToFile(controlPoints = [0, 0.1, 0.5, 1]) {
    const spline = new LinearSpline(controlPoints);
    visualizeSplineToFile(spline);
  }
}