import { allSame, arrayEquals, arrayMean, arraySum, fillFromFunction } from "../../util/Array.mjs";
import Interpolation from "../../util/Interpolation.mjs";
import { hasAnyKeys } from "../../util/Map.mjs";
import { randomArraySample } from "../../util/random.mjs";
import getGradient from "./Gradient.mjs";
import Neuron from "./Neuron.mjs";

// An example config, which configures
// a 3-Neuron Network which mimics the
// function of an XOR gate.
export const xorTestConfig = {
  inputs: 2,
  layers: [
    [
      [1, -1],
      [-1, 1],
    ],
    [1, 1],
  ],
  type: Neuron.types.binary,
  bias: -1,
};

export class Network {
  static lossFunctions = {
    squareDifference: 'squareDifference',
    categoricalCrossEntropy: 'categoricalCrossEntropy',
  };

  /** 
   * @param {object} config
   * @param {number} config.inputs
   * @param {object[] | number} config.layers
   *    A number indicating the number of layers, OR
   *    A collection of one or more Layer configs.
   *    A layer config is (an object containing:
   *      a weights config containing an array of
   *        valid Neuron configs,
   *      optionally a default type config, and
   *      optionally a default bias config
   *    ), OR (
   *      an array of valid Neuron configs
   *    ), OR (
   *      a valid Neuron config
   *    ).
   * @param {string} [config.type]
   *    A default neuron type to be used by all
   *    layers in the network. If provided, this
   *    will override networkDefaults.type.
   * @param {number} [config.bias]
   *    A default neuron bias to be used by all
   *    layers in the network. If provided, this
   *    will override networkDefaults.bias.
   * @param {string} [config.lossFunction]
   *    The loss function to use.
   *    See Network.lossFunctions for available options.
   */
  constructor(config) {
    Network.validateConfig(config);

    this.lossFunction = config.lossFunction || networkDefaults.lossFunction;
    this.inputs = config.inputs;
    this.layers = generateLayers(config);

    this.layerOutputs = Array(this.layers.length);
    for (let i = 0; i < this.layers.length; i++) {
      this.layerOutputs[i] = Array(this.layers[i].length);
    }
  }

  /** 
   * @param {object} config
   * @param {number} config.inputs
   * @param {object[]} config.layers
   *    A collection of one or more Layer configs.
   *    A layer config is (an object containing:
   *      a weights config containing an array of
   *        valid Neuron configs,
   *      optionally a default type config, and
   *      optionally a default bias config
   *    ), OR (
   *      an array of valid Neuron configs
   *    ).
   * @param {string} [config.type]
   *    A default neuron type to be used by all
   *    layers in the network. If provided, this
   *    will override networkDefaults.type.
   * @param {number} [config.bias]
   *    A default neuron bias to be used by all
   *    layers in the network. If provided, this
   *    will override networkDefaults.bias.
   */
  static validateConfig(config) {
    if (!config) throw new Error();
    if (typeof config.inputs !== 'number') throw new Error();
    // TODO

    // TODO, use existing Neuron.validateConfig() fn
  }

  /** Runs a given input set through this Network to produce an output set.
   * 
   * @param  {...number} inputs
   *    Zero or more input numbers.
   *    Count must match the number of inputs declared
   *    in the config when this Network was instantiated.
   * @returns {number | number[]}
   *    One or more numbers from the output layer of this Network.
   *    If only one number is output, it will not be wrapped in an array.
   */
  run(inputs) {
    this.validateInputs(inputs);

    for (let i = 0; i < this.layers.length; i++) {
      const input = i == 0 ?
        inputs :
        this.layerOutputs[i - 1];
      this.runOuterLoop(input, i);
    }
    
    return this.layerOutputs[this.layers.length -1];
  }

  runOuterLoop(inputs, i) {
    for (let j = 0; j < this.layers[i].length; j++) {
      runInnerLoop(this.layers[i], j, inputs, this.layerOutputs[i]);
    }
  }

  validateInputs(inputs) {
    if (inputs.length === this.inputs) return;

    throw new Error(
      'Must provide a number of inputs equal to the number of input nodes.\n' +
      `Provided ${inputs.length} inputs: ${inputs}\n` +
      `Expected ${this.inputs} inputs.`
    );
  }

  /** Runs a given input set through this Network to produce an output set.
   * Additionally records & returns all of the internal Neurons' activations.
   * 
   * @param  {...number} inputs
   *    Zero or more input numbers.
   *    Count must match the number of inputs declared
   *    in the config when this Network was instantiated.
   * @returns {number | number[]}
   *    One or more numbers from the output layer of this Network.
   *    If only one number is output, it will not be wrapped in an array.
   */
  trainingRun(inputs) {
    this.validateInputs(inputs);

    let currentLayerInputs = inputs;
    const allOutputs = [];
    const inputTotals = [];

    for (const layer of this.layers) {
      const currentLayerOutputs = [];
      const currentLayerInputTotals = [];

      for (const neuron of layer) {
        const total = neuron.getTotal(currentLayerInputs);

        if (isNaN(total)) {
          console.error('neuron.getTotal() generated NaN.');
          console.error('Input activations: ', currentLayerInputs);
          console.error('Neuron weights: ', neuron.weights);
          console.error('Neuron bias: ', neuron.bias);
          throw new Error('neuron.getTotal() generated NaN.');
        }

        const neuronOutput = neuron.getActivation(total);

        currentLayerInputTotals.push(total);
        currentLayerOutputs.push(neuronOutput);
      }

      currentLayerInputs = currentLayerOutputs;
      allOutputs.push(currentLayerOutputs);
      inputTotals.push(currentLayerInputTotals);
    }

    return {
      inputs: inputTotals,
      outputs: allOutputs
    };
  }

  /**
   * @param  {{
   *   inputs: number | number[],
   *   outputs: number | number[],
   * }[]} trainingData
   * @returns {{
   *   elapsed: number,
   *   pre: number,
   *   post: number,
   * }}
   */
  fixedCycleTrain(trainingData, cycles, batchSize = 10, options = {}) {
    const startTime = performance.now();

    if (!options.suppressLogging) console.log('Estimating initial performance on random sample...');
    const pre = this.getCompositeError(trainingData, 500);
    if (!options.suppressLogging) console.log(`Initial error: ${pre}`);

    let lastPost = performance.now();

    let offset = 0;
    for (let cycle = 0; cycle < cycles; cycle++) {
      const meanGradient = this.getGradientsMean(trainingData, batchSize, offset);
      offset = (offset + batchSize) % trainingData.length;

      const learnRate =
        Interpolation.linear((cycle + 1 / cycles), 0, 0.02, 0, 1) +
        Interpolation.linear((cycle     / cycles), 0.02, 1, 1, 0);
      this.updateFromMeanGradient(meanGradient, learnRate);

      if (!options.suppressLogging) {
        const sinceLastPost = performance.now() - lastPost;
        if (sinceLastPost > 10000) {
          lastPost = performance.now();
          const elapsed = lastPost - startTime;
          console.log();
          console.log(`  Elapsed time: ${Math.floor(elapsed / 1000)} seconds`);
          console.log(`  Train cycles completed: ${cycle}`);
        }
      }
    }

    const post = this.getCompositeError(trainingData, 500);

    const endTime = performance.now();
    const elapsed = Math.floor((endTime - startTime) / 1000);

    if (!options.suppressLogging) {
      console.log();
      console.log(`Training completed in ${cycles} cycles, after ${elapsed} seconds.`);
      console.log({ elapsed, pre, post });
    }    

    return { elapsed, pre, post };
  }

  /**
   * @param  {...{
   *   inputs: number | number[],
   *   output: number | number[],
   * }} trainingData
   */
  train(trainingData) {
    console.log('Evaluating initial performance...');
    const pre = this.getCompositeError(trainingData);

    const startTime = performance.now();
    let lastPost = performance.now();
    
    let cycle = 0;
    let improvement = 1;
    while(improvement > 1e-10) {
      console.log('Evaluating pre-train performance...');
      const priorCompositeError = this.getCompositeError(trainingData);

      console.log('Computing gradient...');
      const gradients = [];
      for (const training of trainingData) {
        const gradient = this.getGradient(training);
        gradients.push(gradient);
      }

      console.log('Updating...');
      this.update(gradients, priorCompositeError);
      
      console.log('Evaluating post-train performance......');
      const postCompositeError = this.getCompositeError(trainingData);
      if (postCompositeError < 0.001) break;
      improvement = priorCompositeError - postCompositeError;

      cycle++;

      const sinceLastPost = performance.now() - lastPost;
      if (sinceLastPost > 5000) {
        lastPost = performance.now();
        const elapsed = lastPost - startTime;
        console.log(`  ${Math.floor(elapsed / 1000)} seconds. Error: ${postCompositeError}`);
      }
    }

    const endTime = performance.now();
    const elapsed = endTime - startTime;
    console.log(`Training completed in ${cycle} cycles, after ${elapsed} millis.`);

    const post = this.getCompositeError(trainingData);
    console.log({ pre, post });
  }

  /**
   * @param {{
   *   ΔErrorPerΔBias: number,
   *   ΔErrorPerΔWeights: number[],
   * }[][][]} gradients
   * @param {number} error
   */
  update(gradients, error) {
    const step = error / 2;

    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];

      for (let j = 0; j < layer.length; j++) {
        const neuron = layer[j];

        neuron.bias -= arrayMean(gradients.map(g =>
          g[i][j].ΔErrorPerΔBias
        )) * step;

        for (let k = 0; k < neuron.weights.length; k++) {
          neuron.weights[k] -= arrayMean(gradients.map(g => g[i][j].ΔErrorPerΔWeights[k])) * step;
        }
      }
    }
  }

  /**
   * @param {{
   *   ΔErrorPerΔBias: number,
   *   ΔErrorPerΔWeights: number[],
   * }[][]} meanGradient
   * @param {number} learnRate 
   */
  updateFromMeanGradient(meanGradient, learnRate) {
    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];

      for (let j = 0; j < layer.length; j++) {
        const neuron = layer[j];
        const gradient = meanGradient[i][j];

        neuron.bias -= gradient.ΔErrorPerΔBias * learnRate;

        for (let k = 0; k < neuron.weights.length; k++) {
          neuron.weights[k] -= gradient.ΔErrorPerΔWeights[k] * learnRate;
        }
      }
    }
  }

  getCompositeError(trainingData, sampleSize = null) {
    let sample;
    if (sampleSize == null) {
      sample = trainingData;

    } else {
      sample = randomArraySample(trainingData, sampleSize)
    }

    return arrayMean(
      sample.map(training =>
        this.getError(training)
      )
    );
  }

  getError(training) {
    const actual = this.run(training.inputs);
    const expected = training.outputs;

    const costs = [];
    for (let i = 0; i < actual.length; i++) {
      const difference = actual[i] - expected[i];
      const cost = Math.pow(difference, 2);
      costs.push(cost);
    }

    return arrayMean(costs);
  }
  
  getOutputΔ(actualOutputs, expectedOutputs) {
    const outputLayerIndex = this.layers.length - 1;
    const outputLayerSize = this.layers[outputLayerIndex].length;

    const ΔErrorPerΔOutputs = Array(outputLayerSize);

    switch (this.lossFunction) {
      case Network.lossFunctions.squareDifference:
        for (let i = 0; i <= outputLayerSize; i++) {
          const actual = actualOutputs[outputLayerIndex][i];
          const expected = expectedOutputs[i];
    
          ΔErrorPerΔOutputs[i] = 2 * (actual - expected);
        }
        break;

      case Network.lossFunctions.categoricalCrossEntropy:
        const total = arraySum(actualOutputs[outputLayerIndex]);

        for (let i = 0; i <= outputLayerSize; i++) {
          const expected = expectedOutputs[i];
          const actual = actualOutputs[outputLayerIndex][i];
          // const softmax = actual / total;

          ΔErrorPerΔOutputs[i] = 1 / total - expected / actual;
        }
        break;

      default:
        throw new Error(`Unrecognized loss function ID: ${this.lossFunction}`);
    }

    return ΔErrorPerΔOutputs;
  }

  /**
   * @param {{
   *   inputs: number | number[],
   *   output: number | number[],
   * }[]} trainingData
   * @param {number} sampleSize
   * @returns {{
   *   ΔErrorPerΔBias: number;
   *   ΔErrorPerΔWeights: number[];
   * }[][]}
   */
  getGradientsMean(trainingData, sampleSize, offset = 0) {
    // // While randomArraySample() can return duplicates, I'm
    // // hoping this is of little consequence. It should be rare,
    // // if sample size is small relative to the training dataset.
    // const sample = randomArraySample(trainingData, sampleSize);

    const sample = trainingData.slice(offset, offset + sampleSize);

    /** @type {{
     *   ΔErrorPerΔBias: number;
     *   ΔErrorPerΔWeights: number[];
     * }[][]} */
    let gradientSum = null;

    for (const training of sample) {
      const gradient = this.getGradient(training);

      if (gradientSum == null) {
        gradientSum = gradient;
        break;
      }

      // Add new gradient values to running total.
      for (let layer = 0; layer < gradient.length; layer++) {
        for (let neuron = 0; neuron < gradient[layer].length; neuron++) {
          const sum = gradientSum[layer][neuron];
          const upd = gradient[layer][neuron];
          sum.ΔErrorPerΔBias += upd.ΔErrorPerΔBias;

          const sumWeights = sum.ΔErrorPerΔWeights;
          const updWeights = upd.ΔErrorPerΔWeights;
          for (let weight = 0; weight < updWeights.length; weight++) {
            sumWeights[weight] += updWeights[weight];
          }
        }
      }
    }

    // Normalize; divide by sample size
    const divisor = 1/sampleSize;
    for (let layer = 0; layer < gradientSum.length; layer++) {
      for (let neuron = 0; neuron < gradientSum[layer].length; neuron++) {
        const sum = gradientSum[layer][neuron];
        sum.ΔErrorPerΔBias *= divisor;

        const sumWeights = sum.ΔErrorPerΔWeights;
        for (let weight = 0; weight < sumWeights.length; weight++) {
          sumWeights[weight] *= divisor;
        }
      }
    }

    return gradientSum;
  }

  /**
   * @param {{
   *   inputs: number | number[],
   *   outputs: number | number[],
   * }} training
   * @returns {{
   *   ΔErrorPerΔBias: number;
   *   ΔErrorPerΔWeights: number[];
   * }[][]}
   */
  getGradient(training) {
    return getGradient(this, training);
  }

  /**
   * @returns {object} A config object when can be used to re-instantiate this Network.
   */
  toConfig() {
    const ret = {
      inputs: this.inputs,
      layers: [],
    };

    // Get configs for the layers in this network.
    for (const layer of this.layers) {
      const layerConfig = layerToConfig(layer);
      ret.layers.push(layerConfig);
    }

    // If all the layers have a common default type, put the default on the Network's config instead.
    if (allSame(ret.layers.map((layer) => layer.type))) {
      const type = ret.layers[0].type;

      if (type !== networkDefaults.type) {
        ret.type = type;
      }

      for (const layerConfig of ret.layers) {
        delete layerConfig.type;
      }
    }
    // If all the layers have a common default bias, put the default on the Network's config instead.
    if (allSame(ret.layers.map((layer) => layer.bias))) {
      const bias = ret.layers[0].bias;

      if (bias !== networkDefaults.bias) {
        ret.bias = bias;
      }

      for (const layerConfig of ret.layers) {
        delete layerConfig.bias;
      }
    }

    // If any layers contain ONLY neurons configs after moving defaults up to the Network level,
    // then convert them to a naked array instead.
    ret.layers = ret.layers.map(layerConfig => {
      if (arrayEquals(Object.keys(layerConfig), ['neurons'])) {
        return layerConfig.neurons;
      }

      return layerConfig;
    });

    return ret;
  }

  /**
   * @returns A JSON string representation of a config object when can be used to re-instantiate this Network.
   */
  toJson() {
    return JSON.stringify(this.toConfig());
  }
}

export const networkDefaults = {
  type: Neuron.types.sigmoid,
  bias: -1,
  lossFunction: Network.lossFunctions.squareDifference,
};

function runInnerLoop(layer, i, layerInputs, layerOutputs) {
  const neuron = layer[i];
  const total = neuron.getTotal(layerInputs);
  const neuronOutput = neuron.getActivation(total);

  layerOutputs[i] = neuronOutput;
}

// Private helper functions.

function layerToConfig(layer) {
  let neuronConfigs = [];

  const layerDefaults = {};
  if (allSame(layer.map((neuron) => neuron.type))) {
    layerDefaults.type = layer[0].type;
  }
  if (allSame(layer.map((neuron) => neuron.bias))) {
    layerDefaults.bias = layer[0].bias;
  }

  for (const neuron of layer) {
    neuronConfigs.push(neuron.toConfig(layerDefaults));
  }

  if (hasAnyKeys(layerDefaults)) return {
    ...layerDefaults,
    neurons: neuronConfigs,
  };

  return neuronConfigs;
}

function generateLayers(networkConfig) {
  const ret = [];
  const defaults = {
    type: networkConfig.type || networkDefaults.type,
    bias: networkConfig.bias || networkDefaults.bias,
  };

  const layerConfigs = networkConfig.layers;
  if (typeof networkConfig.layers === 'number') {
    layerConfigs = Array(networkConfig.layers);
    fillFromFunction(layerConfigs, () => networkConfig.layers);
  }
  
  let prevLayerSize = networkConfig.inputs;
  for (let layerConfig of networkConfig.layers) {
    const layer = layerFrom(layerConfig, defaults);
    layer.forEach(n =>
      n.setInitialWeights(
        prevLayerSize,
        -Math.min(1, 8 / layer.length),
      )
    );
    prevLayerSize = layer.length;
    ret.push(layer);
  }

  return ret;
}

function layerFrom(layerConfig, networkDefaults = {}) {
  if (Array.isArray(layerConfig) && layerConfig.every((el) => Array.isArray(el))) {
    layerConfig = {
      neurons: layerConfig,
    };
  }
  
  if (typeof layerConfig === 'number') {
    layerConfig = { neurons: layerConfig };
  }
  
  const defaults = {
    type: layerConfig.type || networkDefaults.type,
    bias: layerConfig.bias || networkDefaults.bias,
  };
  
  const layer = [];
  let neuronConfigs = layerConfig.neurons;
  if (typeof neuronConfigs === 'number') {
    for (let i = 0; i < neuronConfigs; i++) {
      const neuron = neuronFrom({}, networkDefaults);
      layer.push(neuron);
    }

  } else {
    for (let neuronConfig of neuronConfigs) {
      const neuron = neuronFrom(neuronConfig, defaults);
      layer.push(neuron);
    }
  }
  
  

  return layer;
}

function neuronFrom(neuronConfig, defaults) {
  if (Array.isArray(neuronConfig)) {
    neuronConfig = {
      weights: neuronConfig,
    };
  }
  
  const type = neuronConfig.type || defaults.type;
  const bias = neuronConfig.bias || defaults.bias;
  const weights = neuronConfig.weights;
  
  const neuron = new Neuron(type, bias, weights);
  return neuron;
}