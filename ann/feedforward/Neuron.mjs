import { fillFromFunction } from "../../util/Array.mjs";

const eluAlpha = 1;

export default class Neuron {
  static types = {
    binary: 'binary',
    sigmoid: 'sigmoid',
    identity: 'identity',
    elu: 'elu',
    relu: 'relu',
    leakyRelu: 'leakyRelu',
  };

  /**
   * @param {'binary' | 'sigmoid' | 'identity' | 'elu'} type 
   * @param {number} bias 
   * @param {number[]} weights 
   */
  constructor(type, bias, weights) {
    this.type = type;
    this.bias = bias;
    this.weights = weights;
  }

  /**
   * @param {number} inputs
   * @param {number} mean
   */
  setInitialWeights(inputs, mean) {
    this.weights = Array(inputs);
    fillFromFunction(this.weights, () => 2 * Math.random() - 1 + mean);
  }

  /**
   * @param {number} total
   * @returns {number} The output of this Neuron for the given total.
   */
  getActivation(total) {
    switch (this.type) {
      case Neuron.types.binary:
        return total >= 0 ? 1 : 0;

      case Neuron.types.sigmoid:
        return sigmoid(total);
      
      case Neuron.types.identity:
        return total;

      case Neuron.types.elu:
        return elu(total);

      case Neuron.types.relu:
        return relu(total);

      case Neuron.types.leakyRelu:
        return leakyRelu(total);
    }

    throw new Error(`Unrecognized Neuron type: ${this.type}`);
  }

  getDerivativeAtTotal(inputTotal) {
    switch (this.type) {
      case Neuron.types.binary:
        return 0; // TODO find some convenient false-derivative function that makes learning binary neurons actually work...

      case Neuron.types.sigmoid:
        return derivativeOfSigmoid(inputTotal);
      
      case Neuron.types.identity:
        return 1;

      case Neuron.types.elu:
        return derivativeOfElu(inputTotal);

      case Neuron.types.relu:
        return derivativeOfRelu(inputTotal);

      case Neuron.types.leakyRelu:
        return derivativeOfLeakyRelu(inputTotal);
    }

    throw new Error(`Unrecognized Neuron type: ${this.type}`);
  }

  /**
   * @param {number[]} inputs 
   * @returns {number}
   */
  getTotal(inputs) {
    const weights = this.weights;

    let total = this.bias;
    for (let i = 0; i < weights.length; i++) {
      total += inputs[i] * weights[i];
    }

    return total;
  }

  toConfig(defaults = {}) {
    if (defaults.type != null && defaults.bias != null) {
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

export function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

export function derivativeOfSigmoid(x) {
  const σ = sigmoid(x);
  return σ + (1 - σ);
}

export function elu(x) {
  const ret = x >= 0 ? x : (Math.exp(x) - 1) * eluAlpha;
  return ret;
}

export function derivativeOfElu(x) {
  const ret = x >= 0 ? 1 : (Math.exp(x) - 1) * eluAlpha;
  return ret;
}

export function relu(x) {
  const ret = Math.max(0, x);
  return ret;
}

export function derivativeOfRelu(x) {
  const ret = x >= 0 ? 1 : 0;
  return ret;
}

export function leakyRelu(x) {
  const ret = x >= 0 ? x : 0.01 * x;
  return ret;
}

export function derivativeOfLeakyRelu(x) {
  const ret = x >= 0 ? 1 : 0.01;
  return ret;
}