import { LinearSpline } from "./ann/kan/BSpline.mjs";
import sample from "./ann/kan/devTestTool/sampleFunction.mjs";

LinearSpline.visualizeToFile(
  sample(
    (x) => (
      x*x*x - x
    ),
    [-0.5774, 1.33],
    [-0.385, 1],
    1500
  )
);