import { allSame, arrayEquals, arrayMean, arrayMultiply, arrayScale, ensureArray, fillFromFunction } from "../util/Array.mjs";
import { hasAnyKeys } from "../util/Map.mjs";
import Neuron, { derivativeOfSigmoid } from "./Neuron.mjs";

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

export const networkDefaults = {
  type: Neuron.types.sigmoid,
  bias: -1,
};

export class Network {
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
   */
  constructor(config) {
    Network.validateConfig(config);

    this.inputs = config.inputs;
    this.layers = generateLayers(config);
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

    let layerInputs = inputs;
    let layerOutputs;

    for (const layer of this.layers) {
      layerOutputs = [];

      for (const neuron of layer) {
        const neuronOutput = neuron.getActivation(neuron.getTotal(layerInputs));
        layerOutputs.push(neuronOutput);
      }

      layerInputs = layerOutputs;
    }
    
    return layerOutputs;
  }

  validateInputs(inputs) {
    if (inputs.length !== this.inputs) {
      throw new Error(
        'Must provide a number of inputs equal to the number of input nodes.\n' +
        `Provided ${inputs.length} inputs: ${inputs}\n` +
        `Expected ${this.inputs} inputs.`
      );
    }
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
   * 
   * @param  {...{
   *   inputs: number | number[],
   *   output: number | number[],
   * }} trainingData 
   */
  train(trainingData) {
    let improvement = 1;
    const pre = this.getCompositeError(trainingData);

    let cycle = 0;
    while(improvement > 1e-10) {
      const priorCompositeError = this.getCompositeError(trainingData);

      const gradients = [];
      for (const training of trainingData) {
        const gradient = this.getGradient(training);
        gradients.push(gradient);
      }

      this.update(gradients, priorCompositeError);
      
      const postCompositeError = this.getCompositeError(trainingData);
      if (postCompositeError < 0.001) break;
      improvement = priorCompositeError - postCompositeError;

      cycle++;
    }

    console.log(`Training completed in ${cycle} cycles.`);

    const post = this.getCompositeError(trainingData);
    console.log({ pre, post });
  }

  update(gradients, error) {
    const step = error / 2;

    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];

      for (let j = 0; j < layer.length; j++) {
        const neuron = layer[j];

        neuron.bias -= arrayMean(gradients.map(g => g[i][j].ΔErrorPerΔBias)) * step;

        for (let k = 0; k < neuron.weights.length; k++) {
          neuron.weights[k] -= arrayMean(gradients.map(g => g[i][j].ΔErrorPerΔWeights[k])) * step;
        }
      }
    }
  }

  getCompositeError(trainingData) {
    return arrayMean(trainingData.map(training => this.getError(training)));
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

  getGradient(training) {
    const {inputs, outputs} = this.trainingRun(training.inputs);

    const outputLayerIndex = this.layers.length - 1;
    const outputLayer = this.layers[outputLayerIndex];
    let ΔErrorPerΔOutputs = [];
    for (let j = 0; j < outputLayer.length; j++) {
      const actual = outputs[outputLayerIndex][j];
      const expected = training.outputs[j];
      const ΔErrorPerΔOutput = 2 * (actual - expected);
      ΔErrorPerΔOutputs.push(ΔErrorPerΔOutput);
    }

    const gradient = [];
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const layer = this.layers[i];
      const prevLayer = this.layers[i-1] || training.inputs;

      const ΔErrorPerΔInputsCollection = [];
      const gradientLayer = [];
      for (let j = 0; j < layer.length; j++) {
        const neuron = layer[j];
        const inputTotal = inputs[i][j];

        const ΔErrorPerΔActivation = ΔErrorPerΔOutputs[j];
        const ΔActivationPerΔInputTotal = derivativeOfSigmoid(inputTotal);
        const ΔInputTotalPerΔBias = 1;

        const ΔInputTotalPerΔWeights = [];
        const ΔInputTotalPerΔInputs = [];
        for (let k = 0; k < prevLayer.length; k++) {
          const ΔInputTotalPerΔWeight = (outputs[i-1] || training.inputs)[k];
          ΔInputTotalPerΔWeights.push(ΔInputTotalPerΔWeight);

          const ΔInputTotalPerΔInput = neuron.weights[k];
          ΔInputTotalPerΔInputs.push(ΔInputTotalPerΔInput);
        }

        const gradientElement = {
          ΔErrorPerΔBias: ΔErrorPerΔActivation * ΔActivationPerΔInputTotal * ΔInputTotalPerΔBias,
          ΔErrorPerΔWeights: arrayScale(ΔInputTotalPerΔWeights, ΔErrorPerΔActivation * ΔActivationPerΔInputTotal),
        };
        gradientLayer.push(gradientElement);

        const ΔErrorPerΔInputs = arrayScale(ΔInputTotalPerΔInputs, ΔErrorPerΔActivation * ΔActivationPerΔInputTotal);
        ΔErrorPerΔInputsCollection.push(ΔErrorPerΔInputs);
      }

      gradient.push(gradientLayer);

      ΔErrorPerΔOutputs = [];
      for (let k = 0; k < prevLayer.length; k++) {
        let total = 0;
        for (let j = 0; j < layer.length; j++) {
          total += ΔErrorPerΔInputsCollection[j][k];
        }
        const mean = total / layer.length;
        ΔErrorPerΔOutputs.push(mean);
      }
    }

    return gradient.reverse();
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

  if (neuronConfigs.length === 1) {
    neuronConfigs = neuronConfigs[0];
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

  for (let layerConfig of networkConfig.layers) {
    const layer = layerFrom(layerConfig, defaults);
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
  
  let neuronConfigs = layerConfig.neurons;
  if (!neuronConfigs) {
    neuronConfigs = [layerConfig];
    layerConfig = {};
  }

  const layer = [];
  const defaults = {
    type: layerConfig.type || networkDefaults.type,
    bias: layerConfig.bias || networkDefaults.bias,
  };
  
  for (let neuronConfig of neuronConfigs) {
    const neuron = neuronFrom(neuronConfig, defaults);
    layer.push(neuron);
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