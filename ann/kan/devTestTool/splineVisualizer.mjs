export function visualizeSplineToFile(spline) {
  const coords = [];
  
  const epsilon = 1e-10;
  for (let x = 0; x <= 1 + epsilon; x += 1/10000) {
    const y = spline.evaluateAt(x);
    coords.push([x, y]);
    console.log(x.toFixed(2), y.toFixed(2));
  }

  scatterPlotToFile(coords);
}