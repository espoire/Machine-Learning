import { arrayMultiply, arraySum } from "../util/Array.js";

export default class Neuron {
  static types = {
    binary: 'binary',
    sigmoid: 'sigmoid',
    identity: 'identity',
  };

  /**
   * @param {'binary' | 'sigmoid' | 'identity'} type 
   * @param {number} bias 
   * @param {number[]} weights 
   */
  constructor(type, bias, weights) {
    this.type = type;
    this.bias = bias;
    this.weights = weights;
  }

  getActivation(inputs) {
    const total = arraySum(arrayMultiply(
      inputs,
      this.weights
    )) - this.bias;

    switch (this.type) {
      case Neuron.types.binary:
        return total >= 0 ? 1 : 0;

      case Neuron.types.sigmoid:
        return 1 / (1 + Math.exp(-total));
      
      case Neuron.types.identity:
        return total;
    }

    throw new Error(`Unrecognized Neuron type: ${this.type}`);
  }

  toConfig(defaults = {}) {
    if (defaults.type && defaults.bias != null) {
      return [...this.weights];
    }

    const ret = {
      weights: [...this.weights],
    };

    if (defaults.type != null) {
      ret.type = this.type;
    }
    if (!defaults.bias != null) {
      ret.bias = this.bias;
    }

    return ret;
  }

  /** Checks if the provided config object is a valid neuron config.
   * 
   * Expected format is either:
   * 
   * {
   *  type: string (optional),
   *  bias: number (optional),
   *  weights: number[],
   * }
   * 
   * OR:
   * 
   * number[]
   * 
   * @param {{
   *    type: string?,
   *    bias: number?,
   *    weights: number[],
   * } | number[]} neuronConfig 
   * @param {number?} [expectedWeightsLength]
   * @returns {{
   *    isValid: boolean,
   *    reasons?: string[],
   * }}
   */
  static validateConfig(neuronConfig, expectedWeightsLength = null) {
    const invalidReasons = [];

    if (neuronConfig == null) {
      invalidReasons.push('Neuron config is nullish.');
      
    } else if (typeof neuronConfig !== 'object') {
      invalidReasons.push('Neuron config is not an object.');

    } else {

      // If a naked array is provided for a neuron config, treat it as a weights array.
      if (Array.isArray(neuronConfig)) {
        neuronConfig = {
          weights: neuronConfig,
        }
      }

      // Neuron config may not contain any unsupported keys.
      const allowedConfigs = [
        'type',
        'bias',
        'weights',
      ];
      for(const key of Object.keys(neuronConfig)) {
        if (!allowedConfigs.includes(key)) {
          invalidReasons.push(`Neuron config key '${key}' is forbidden.`);
        }
      }

      const type = neuronConfig.type;
      // Neuron type is optional.
      if (type) {

        // Neuron type must be a string, if provided.
        if (typeof type !== 'string') {
          invalidReasons.push(`Neuron type '${key}' is not a string.`);
        }

        // Neuron type must be one of the supported type string.
        if (!Neuron.types.includes(neuronConfig.type)) {
          invalidReasons.push(`Neuron type '${key}' is not a supported neuron type.`);
        }
      }

      const bias = neuronConfig.bias;
      // Neuron bias is optional.
      if (bias) {

        // Neuron bias must be a number, if provided.
        if (typeof bias !== 'number' || isNaN(bias)) {
          invalidReasons.push(`Neuron type '${key}' is not a number.`);
        }
      }

      const weights = neuronConfig.weights;
      // Neuron weights is required.
      if (!weights) {
        invalidReasons.push(`Neuron weights are required.`);

      } else {
        // Neuron weights must be an array of numbers.
        if (!Array.isArray(weights)) {
          invalidReasons.push(`Neuron weights is not an array.`);
          
        } else {
          // Neuron weights array.length must match the size of the previous layer.
          if (expectedWeightsLength != null) {
            if (weights.length !== expectedWeightsLength) {
              invalidReasons.push(`Neuron weights must match previous layer size. Given: ${weights.length}, expected: ${expectedWeightsLength}.`);
            }
          }
    
          // Neuron weights must be numbers.
          if (weights.some((weight) => (typeof weight !== 'number' || isNaN(weight)))) {
            invalidReasons.push(`One or more Neuron weights are not a number.`);
          }
        }
      }
    }

    if (invalidReasons.any()) return {
      isValid: false,
      reasons: invalidReasons,
    };
    
    return {
      isValid: true,
    };
  }
}