import { visualizeSplineToFile } from "./devTestTool/splineVisualizer.mjs";

/*
 * This file is a graveyard of aborted attempts to implement fancier B-Splines.
 * I attempted to do all the math to solve the general case of the spline parameters
 * by hand, and failed badly.
 * 
 * This broken incomplete work left here in case it should be useful to me on
 * a re-attempt. In practice, I suspect, I need to simply admit my limitations
 * and find a source to look up the relevant formulas, or import a library.
 */

export default class NaturalCubicBSpline {
  /**
   * @type {number[]} 
   * 
   * A one-dimensional array of length 4 or greater, containing the y-values of the control points.
   * The x-values are implicit; the first control point is always at x = 0, and the last control point is always at x = 1.
   * The remaining control points are evenly-spaced in the range (0 .. 1).
   * For example, if there are 4 total control points, then the x-values of the control points are at x = 0/3 = 0, x = 1/3, x = 2/3, and x = 3/3 = 1. 
   */
  controlPoints;

  /**
   * @type {number[][]}
   * 
   * A 2-d array containing multiple sets of [a,b,c,d] coefficients used to evaluate the natural cubic b-spline.
   */
  coefficients;

  constructor(controlPoints) {
    this.controlPoints = controlPoints;
    this.regenerateCoefficients();
  }

  /**
   * @param {number} [n=4] The number of control points to generate.
   * @param {() => number} [randomFn=Math.random] The random function to use. Typically omissible, but may be useful in case seeded-randomness is desired.
   * @returns {NaturalCubicBSpline} A new NaturalCubicBSpline, with the specified number of control points, with the y-value of each control point independently randomized.
   */
  static random(n = 4, randomFn = Math.random) {
    const controlPoints = new Array(n);
    for (let i = 0; i < n; i++) controlPoints[i] = randomFn();

    return new NaturalCubicBSpline(controlPoints);
  }

  /**
   * @param {number[]} deltas A collection of deltas describing the increase (or decrease, if negative) to each control point's y-value.
   */
  updateControlPoints(deltas) {
    const n = this.controlPoints.length;
    for (let i = 0; i < n; i++) this.controlPoints[i] += deltas[i];

    this.regenerateCoefficients();
  }

  regenerateCoefficients() {
    this.coefficients = getNaturalCubicBSplineCoefficients(this.controlPoints);
  }

  /**
   * @param {number} x A number in the range 0 to 1, inclusive. The x-coordinate at which to evaluate the spline.
   * @returns {number} The value returned at x from the relevant spline piecewise part function containing x.
   */
  evaluateAt(x) {
    // return evaluateNaturalCubicBSpline(this.coefficients, x);
    return evaluateSpline(this.controlPoints, x);
  }

  static visualizeToFile(controlPoints = [0, 1, 0, 1]) {
    const spline = new NaturalCubicBSpline(controlPoints);
    visualizeSplineToFile(spline);
  }
}

/**
 * @param {number[]} controlPoints
 *   A one-dimensional array of length 4 or greater, containing the y-values of the control points.
 *   The x-values are implicit; the first control point is always at x = 0, and the last control point is always at x = 1.
 *   The remaining control points are evenly-spaced in the range (0 .. 1).
 *   For example, if there are 4 total control points, then the x-values of the control points are at x = 0/3 = 0, x = 1/3, x = 2/3, and x = 3/3 = 1.
 * 
 * @returns {number[][]} A 2-d array containing multiple sets of [a,b,c,d] coefficients used to evaluate the natural cubic b-spline.
 */
function getNaturalCubicBSplineCoefficients(controlPoints) {
  const intervals = controlPoints.length - 1;
  const h = 1 / intervals;

  // Natural cubic spline coefficients calculation
  const a = [], b = [], c = [], d = [];

  const alpha = [0];
  for (let j = 1; j < intervals; j++) {
      alpha.push((3/h) * (controlPoints[j+1] - controlPoints[j]) - (3/h) * (controlPoints[j] - controlPoints[j-1]));
  }

  const l = [1], mu = [0], z = [0];
  for (let i = 1; i < intervals; i++) {
      l.push(2 * (h + h) - h * mu[i-1]);
      mu.push(h / l[i]);
      z.push((alpha[i] - h * z[i-1]) / l[i]);
  }

  l.push(1);
  z.push(0);
  c.push(0);

  for (let i = intervals - 1; i >= 0; i--) {
    c[i] = z[i];
    b[i] = (controlPoints[i+1] - controlPoints[i]) / h - 2/3 * h * c[i];
    d[i] = - c[i] / (3 * h);
    a[i] = controlPoints[i];
  }

  const ret = [];
  for (let i = 0; i < intervals; i++) {
    ret.push([a[i], b[i], c[i], d[i]]);
  }

  return ret;
}

/**
 * @param {number[]} coefficients A 2-d array containing multiple sets of [a,b,c,d] coefficients used to evaluate the natural cubic spline.
 * @param {number} x A number in the range 0 to 1, inclusive. The x-coordinate at which to evaluate the spline.
 * @returns {number} The value returned at x from the relevant spline piecewise part function containing x.
 */
function evaluateNaturalCubicBSpline(coefficients, x) {
  const intervals = coefficients.length;
  const intervalWidth = 1 / intervals;

  // Calculate the index of the control point interval where x is located
  let i = Math.floor(x * intervals);
  if (i >= intervals) i = intervals - 1;  // Ensure the last interval is handled properly

  // Local parameter t in the interval [i*interval, (i+1)*interval]
  const t = (x - i * intervalWidth) / intervalWidth;

  const a = coefficients[i][0];
  const b = coefficients[i][1];
  const c = coefficients[i][2];
  const d = coefficients[i][3];

  // Evaluate the cubic polynomial at t
  return a + b*t + c*t*t + d*t*t*t;
}

/**
 * @param {number[]} y A one-dimensional array of length 3 or greater, containing the y-values of the control points. The x-values are implicit; the first control point is always at x=0, and the last control point is always at x=1. The remaining control points are evenly-spaced in the range 0 < x < 1. For example, if there are 4 total control points, then the x-values of the control points are at x=0/3=0, x=1/3, x=2/3, and x=3/3=1.
 * @param {number} x A number in the range 0 to 1, inclusive. The x-coordinate at which to evaluate the spline.
 * @returns {number} The value returned at x from the relevant spline piecewise part function containing x.
 */
function evaluateSpline(y, x) {
  // const n = y.length - 1;
  // const h = 1 / n;

  // // Calculate the index of the control point interval where x is located
  // let i = Math.floor(x / h);
  // if (i >= n) i = n - 1;  // Ensure the last interval is handled properly

  // // Local parameter t in the interval [i*interval, (i+1)*interval]
  // const t = (x - i * h);

  // // Natural cubic spline coefficients calculation
  // // const a = [], b = [], c = [], d = [];

  // // const alpha = [0];
  // // for (let j = 1; j < n; j++) {
  // //     alpha.push((3/h) * (y[j+1] - y[j]) - (3/h) * (y[j] - y[j-1]));
  // // }

  // // const l = [1], mu = [0], z = [0];
  // // for (let j = 1; j < n; j++) {
  // //     l.push((4 - mu[j-1]) * h);
  // //     mu.push(h / l[j]);
  // //     z.push((alpha[j] - h * z[j-1]) / l[j]);
  // // }

  // // l.push(1);
  // // z.push(0);
  // // c.push(0);

  // // for (let j = n - 1; j >= 0; j--) {
  // //     c[j] = z[j];
  // //     b[j] = (y[j+1] - y[j]) / h - 2/3 * h * c[j];
  // //     d[j] = - c[j] / (3 * h);
  // //     a[j] = y[j];
  // // }

  // // const d = [
  // //   0,
  // //   // (- 1/3 * y[2] - 2/3 * y[1] + y[0])/h*h*h  -  (y[2] - 3 * y[3] - 3 * y[0] + 5 * y[1])/(18 * h*h*h - 15 * h*h),
  // //   // (y[2] - 3 * y[3] - 3 * y[0] + 5 * y[1])/(6 * h*h*h*h - 5 * h*h*h),
  // //   0,
  // // ];
  
  // const d = [
  //   -27,
  //   -54
  // ];
  // d[2] = d[1] - d[0];
  // const a = y;
  // const b = [
  //   (y[1] - y[0]) / h -     d[0] * h*h,
  //   (y[1] - y[0]) / h + 2 * d[0] * h*h,
  //   ( (y[3] - y[2]) / h + 2 * d[2] * h ) / 4,
  //   // -4
  // ];
  // const c = [
  //   0,
  //   3 * h * d[0],
  //   -3 * h * d[2],
  // ];

  // // console.log(a, b, c, d);
  // console.log(
  //   a[0], b[0], c[0], d[0],
  //   a[1], b[1], c[1], d[1],
  //   a[2], b[2], c[2], d[2],
  // );

  // // Evaluate the cubic polynomial at t
  // return a[i] + b[i]*t + c[i]*t*t + d[i]*t*t*t;

  return 1 * (
    (-  y[0] + 3*y[1] - 3*y[2] + y[3]) * x*x*x +
    ( 3*y[0] - 6*y[1] + 3*y[2]       ) * x*x   +
    (-3*y[0]          + 3*y[2]       ) * x     +
    (   y[0] + 4*y[1] +   y[2]       )
  ) - 3;
}

export class QuadraticBSpline {
  /**
   * @type {number[]} 
   * 
   * A one-dimensional array of length 3 or greater, containing the y-values of the control points.
   * The x-values are implicit; the first control point is always at x = 0, and the last control point is always at x = 1.
   * The remaining control points are evenly-spaced in the range (0 .. 1).
   * For example, if there are 4 total control points, then the x-values of the control points are at x = 0/3 = 0, x = 1/3, x = 2/3, and x = 3/3 = 1. 
   */
  controlPoints;

  /** @type {{ a: number[], b: number[], c: number[] }} */
  coefficients;

  constructor(controlPoints) {
    this.controlPoints = controlPoints;
    this.regenerateCoefficients();
  }

  /**
   * @param {number} [n=3] The number of control points to generate.
   * @param {() => number} [randomFn=Math.random] The random function to use. Typically omissible, but may be useful in case seeded-randomness is desired.
   * @returns {QuadraticBSpline} A new QuadraticBSpline, with the specified number of control points, with the y-value of each control point independently randomized.
   */
  static random(n = 3, randomFn = Math.random) {
    const controlPoints = new Array(n);
    for (let i = 0; i < n; i++) controlPoints[i] = randomFn();

    return new QuadraticBSpline(controlPoints);
  }

  /**
   * @param {number[]} deltas A collection of deltas describing the increase (or decrease, if negative) to each control point's y-value.
   */
  updateControlPoints(deltas) {
    const n = this.controlPoints.length;
    for (let i = 0; i < n; i++) this.controlPoints[i] += deltas[i];

    this.regenerateCoefficients();
  }

  regenerateCoefficients() {
    const y = this.controlPoints;
    const a = [
      y[0],
      y[1],
      y[2],
    ];
    const b = [
      -y[0] + 4*y[1] - 4*y[2] + y[3],
      -y[0] - 2*y[1] + 4*y[2] - y[3],
       y[0]          - 2*y[2] + y[3],
    ];
    const c = [
            - 3*y[1] + 4*y[2] - y[3],
       y[0] +   y[1] - 3*y[2] + y[3],
      -y[0]          +   y[2]       ,
    ];

    this.coefficients = {
      a, b, c
    };
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

    const a = this.coefficients.a[i]
    const b = this.coefficients.b[i]
    const c = this.coefficients.c[i]

    // console.log(a, b, c, u);

    return a + b * u + c * u * u;
  }

  static visualizeToFile(controlPoints = [0, 0.1, 0.5, 1]) {
    const spline = new QuadraticBSpline(controlPoints);
    visualizeSplineToFile(spline);
  }
}