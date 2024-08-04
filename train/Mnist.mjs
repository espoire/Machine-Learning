import { IdxFileLoader } from "./data/Loader.mjs";
import fs from 'node:fs';
import { Network } from "./ann/feedforward/Network.mjs";
import { maxAt } from "./util/Array.mjs";
import Neuron from "./ann/feedforward/Neuron.mjs";

export default function mnistTrain() {
  const trainLabels = IdxFileLoader.load('./data/mnist/train-labels.idx1-ubyte');
  const trainImages = IdxFileLoader.load('./data/mnist/train-images.idx3-ubyte');
  const testLabels = IdxFileLoader.load('./data/mnist/t10k-labels.idx1-ubyte');
  const testImages = IdxFileLoader.load('./data/mnist/t10k-images.idx3-ubyte');
  
  
  function flatten2dImageCollection(images) {
    for (let i = 0; i < images.length; i++) {
      images[i] = images[i].flat();
    }
  }
  
  function normalizeFlattenedImageCollection(flatImages) {
    for (const image of flatImages) {
      for (let i = 0; i < image.length; i++) {
        image[i] = image[i] / 255;
      }
    }
  }
  
  flatten2dImageCollection(trainImages);
  flatten2dImageCollection(testImages);
  normalizeFlattenedImageCollection(trainImages);
  normalizeFlattenedImageCollection(testImages);
  
  const trainingConfig = [];
  for (let i = 0; i < trainImages.length; i++) {
    const outputs = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    outputs[trainLabels[i]] = 1;
  
    trainingConfig.push({
      inputs: trainImages[i],
      outputs,
    });
  }
  
  const runConfigurations = [{
    // Quick initialization test
    neurons: 15, type: Neuron.types.sigmoid, batch: 80, cycles: 750,
  
  }, {
    neurons: 20, type: Neuron.types.relu, batch: 20, cycles: 6000, lossFunction: Network.lossFunctions.squareDifference,
  }, {
    neurons: 20, type: Neuron.types.relu, batch: 20, cycles: 6000, lossFunction: Network.lossFunctions.categoricalCrossEntropy,
  // }, {
  //   neurons: 20, type: Neuron.types.relu, batch: 20,  cycles: 48000,
  }, {
    neurons: 30, type: Neuron.types.relu, batch: 20,  cycles: 48000, lossFunction: Network.lossFunctions.categoricalCrossEntropy,
  }];
  
  runConfigurations.forEach(testTrainingConfiguration);
  
  function testTrainingConfiguration(runConfig) {
    const config = {
      inputs: 28 * 28,
      layers: [
        { neurons: runConfig.neurons, type: runConfig.type, },
        { neurons: 10, type: 'sigmoid' },
      ],
      lossFunction: Network.lossFunctions.categoricalCrossEntropy,
    };
  
    const network = new Network(config);
  
    console.log();
    console.log();
    console.log();
    console.log('Testing training configuration:');
    console.log(` Hidden neuron type: ${config.layers[0].type}`);
    console.log(` Hidden neurons: ${config.layers[0].neurons}`);
    console.log(` Output neurons: ${config.layers[1].neurons}`);
    console.log(` Loss function: ${config.lossFunction}`);
    console.log(` Batch size: ${runConfig.batch}`);
    console.log(` Train cycles: ${runConfig.cycles}`);
    console.log(` Exposures per image: ${runConfig.batch * runConfig.cycles / trainImages.length}`);
    
    const { elapsed, pre, post } = network.fixedCycleTrain(
      trainingConfig,
      runConfig.cycles,
      runConfig.batch,
      { suppressLogging: true },
    )
    
    const { correct, incorrect, accuracyPercent } = testNetworkAgainst(
      network,
      testImages,
      testLabels,
      { suppressLogging: true },
    );
  
    console.log();
    console.log(` Training duration: ${elapsed} seconds`);
    console.log(` Initial loss:    ${(100 * pre).toFixed(1)}%`);
    console.log(` Post-train loss: ${(100 * post).toFixed(1)}%`);
    console.log(` Test: ${correct}/${testImages.length} (${accuracyPercent}%)`);
    console.log();
  }
  
  // // Dimensions for the image
  // const width = 28;
  // const height = 28;
  
  // // Instantiate the canvas object
  // const canvas = createCanvas(width, height);
  // const context = canvas.getContext("2d");
  
  // for (let y = 0; y < 28; y++) {
  //   for (let x = 0; x < 28; x++) {
  //     const color = trainImages[0][y][x];
  //     context.fillStyle = `rgb(${color},${color},${color})`;
  //     context.fillRect(x, y, 1, 1);
  //     console.log(color);
  //   }
  // }
  
  // // Write the image to file
  // const buffer = canvas.toBuffer("image/png");
  // fs.writeFileSync("./image.png", buffer);
  
  // console.log('\n');
  // console.log('Test: Should be random nonsense. Eventual desired outputs: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0] -- 5');
  // let result = network.run(trainImages[0]);
  // console.log(result, maxAt(result));
  
  // console.log('\n');
  // console.log('Test. Expected outputs: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0] -- 5');
  // result = network.run(trainImages[0]);
  // console.log(result, maxAt(result));
  
  // saveNetworkToFile(network, './numeric_ocr_network.json');
  
  function saveNetworkToFile(network, filename) {
    const networkConfig = network.toJson();
    fs.writeFile(filename, networkConfig, err => {
      if (err) {
        console.error();
        console.error(err);
      } else {
        console.log();
        console.log(`Saved network weights to ${filename}`);
      }
    });
  }
  
  /**
   * @param {Network} network
   * @param {number[][]} testImages
   * @param {number[]} testLabels
   */
  function testNetworkAgainst(network, testImages, testLabels, options = {}) {
    if (!options.suppressLogging) {
      console.log();
      console.log(`Testing pre-trained network against ${testImages.length} test images.`);
    }
  
    let correct = 0, incorrect = 0;
  
    for (let i = 0; i < testImages.length; i++) {
      const response = network.run(testImages[i]);
      const actual = maxAt(response);
      const expected = testLabels[i];
  
      if (actual === expected) {
        correct++;
      } else {
        incorrect++;
      }
    }
  
    const accuracyPercent = (100 * correct / testImages.length).toFixed(1);
  
    if (!options.suppressLogging) {
      console.log(`Answered correctly: ${correct}`);
      console.log(`Answered incorrectly: ${incorrect}`);
      console.log(`Accuracy: ${accuracyPercent}%`);
    }
  
    return { correct, incorrect, accuracyPercent };
  }
}