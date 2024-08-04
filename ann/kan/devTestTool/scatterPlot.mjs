import { createCanvas } from "canvas";
import fs from 'node:fs';

const black = 'rgb(0,0,0)';
const gray = 'rgb(64,64,64)';
const white = 'rgb(255,255,255)';

/**
 * @param {number[][]} coords A collection of [x,y] coordinate pairs.
 */
export default function scatterPlotToFile(coords, width = 600, height = 600, domain = [-0.1, 1.1], range = [-0.1, 1.1], fileName = './image.png') {
  // console.log(`Plotting coordinates to file:`);
  // for (const coordinate of coords) {
  //   console.log(coordinate[0].toFixed(2), coordinate[1].toFixed(1));
  // }

  // Instantiate the canvas object
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  // Fill with black background.
  context.fillStyle = black;
  context.fillRect(0, 0, width, height);
  
  context.fillStyle = gray;

  // Plot the x-axis in gray.
  const yCoordinateOfTheXAxis = height - getPixelLocation(0, range, height);
  context.fillRect(0, yCoordinateOfTheXAxis, width, 1);
  
  // Plot the y-axis in gray.
  const xCoordinateOfTheYAxis = getPixelLocation(0, domain, width);
  context.fillRect(xCoordinateOfTheYAxis, 0, 1, height);

  context.fillStyle = white;
  for (const coordinate of coords) {
    // Coordinate-space x,y.
    const [cx, cy] = coordinate;

    // Don't plot if outside the image.
    if (cx < domain[0] || cx > domain[1] || cy < range[0] || cy > range[1]) continue;

    const px = getPixelLocation(cx, domain, width);
    const py = height - getPixelLocation(cy, range, height);
    // console.log(cy, py);
    
    // Plot one white pixel at the given location.
    context.fillRect(px, py, 1, 1);
  }

  // Write the image to file
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(fileName, buffer);

  console.log(`Plotted coordinates to file '${fileName}'.`);
}

function getPixelLocation(coord, corrdinateSpace, imageSize) {
  return (coord - corrdinateSpace[0]) / (corrdinateSpace[1] - corrdinateSpace[0]) * imageSize;
}