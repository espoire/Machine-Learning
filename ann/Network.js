import { allSame, arrayEquals, fillFromFunction } from "../util/Array.js";
import { hasAnyKeys } from "../util/Map.js";
import Neuron from "./Neuron.js";
import ProgrammaticInputNode from "./ProgrammaticInputNode.js";

export const xorTestConfig = {
  inputs: 2,
  layers: [
    [
      [1, -1],
      [-1, 1],
    ],
    [
      [1, 1]
    ],
  ],
};

export class Network {
  static defaults = {
    type: Neuron.types.binary,
    bias: 1,
  };

  /** 
   * @param {number[]} layerWidths 
   */
  constructor(config) {
    Network.validateConfig(config);
    this.inputLayer = Network.generateInputLayer(config.inputs);
    this.computeLayers = Network.generateComputeLayers(config);
    this.outputLayer = this.computeLayers[this.computeLayers.length - 1];

    this.layers = [
      this.inputLayer,
      ...this.computeLayers,
    ];
  }

  static validateConfig(config) {
    if (!config) throw new Error();
    if (typeof config.inputs !== 'number') throw new Error();
    // TODO

    // TODO, use existing Neuron.validateConfig() fn
  }

  /**
   * @param {number} numInputs 
   */
  static generateInputLayer(numInputs) {
    const ret = Array(numInputs);
    fillFromFunction(ret, () => new ProgrammaticInputNode());
    return ret;
  }

  static generateComputeLayers(networkConfig) {
    const ret = [];
    const defaults = {
      type: networkConfig.type || Network.defaults.type,
      bias: networkConfig.bias || Network.defaults.bias,
    };

    for (let layerConfig of networkConfig.layers) {
      const layer = layerFrom(layerConfig, defaults);
      ret.push(layer);
    }

    return ret;
  }

  run(...inputs) {
    if (inputs.length === 1 && Array.isArray(inputs[0])) inputs = inputs[0];
    if (inputs.length !== this.inputLayer.length) {
      throw new Error(
        'Must provide a number of inputs equal to the number of input nodes.\n' +
        `Provided ${inputs.length} inputs: ${inputs}\n` +
        `Expected ${this.inputLayer.length} inputs.`
      );
    }

    for (let i = 0; i < inputs.length; i++) {
      this.inputLayer[i].setValue(inputs[i]);
    }

    let layerInputs = null;
    let layerOutputs;

    for (const layer of this.layers) {
      layerOutputs = [];

      for (const neuron of layer) {
        const neuronOutput = neuron.getActivation(layerInputs);
        layerOutputs.push(neuronOutput);
      }

      layerInputs = layerOutputs;
    }

    if (layerOutputs.length === 1) return layerOutputs[0];
    return layerOutputs;
  }

  toConfig() {
    const ret = {
      inputs: this.inputLayer.length,
      layers: [],
    };

    for (const layer of this.computeLayers) {
      const layerConfig = layerToConfig(layer);
      ret.layers.push(layerConfig);
    }

    if (allSame(ret.layers.map((layer) => layer.type))) {
      const type = ret.layers[0].type;

      if (type !== Network.defaults.type) {
        ret.type = type;
      }

      for (const layerConfig of ret.layers) {
        delete layerConfig.type;
      }
    }
    if (allSame(ret.layers.map((layer) => layer.bias))) {
      const bias = ret.layers[0].bias;

      if (bias !== Network.defaults.bias) {
        ret.bias = bias;
      }

      for (const layerConfig of ret.layers) {
        delete layerConfig.bias;
      }
    }

    ret.layers = ret.layers.map(layerConfig => {
      if (arrayEquals(Object.keys(layerConfig), ['neurons'])) {
        return layerConfig.neurons;
      }

      return layerConfig;
    });

    return ret;
  }

  toJson() {
    return JSON.stringify(this.toConfig());
  }
}

function layerToConfig(layer) {
  const neuronConfigs = [];

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