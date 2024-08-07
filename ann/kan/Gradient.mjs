import { arrayScale, fillFromFunction } from "../../util/Array.mjs";
import { KolmogorovArnoldNetwork } from "./KolmogorovArnoldNetwork.mjs";

/** 
 * @param {KolmogorovArnoldNetwork} network
 * 
 * @param {{
 *   inputs: number | number[],
 *   outputs: number | number[],
 * }} training
 * 
 * @returns {{
 *   ΔErrorPerΔControlPoints: number[];
 * }[][][]}
 * 1st dimension: layer.
 * 2nd dimension: input.
 * 3rd dimension: output.
 */
export default function getGradient(network, training) {
  const inputs = training.inputs
  const outputs = network.run(inputs);
  
  let ΔErrorPerΔOutputs = network.getOutputΔ(outputs, training.outputs);

  const gradient = Array(network.layers.length);
  for (let i = network.layers.length - 1; i >= 0; i--) {
    const layer = network.layers[i];
    const prevLayer = network.layers[i-1] || training.inputs;

    /** @type {number[][]} */
    const { gradientLayer, ΔErrorPerΔInputsCollection } =
      innerLoop(layer, inputs, i, ΔErrorPerΔOutputs, prevLayer, outputs, training);

    gradient[i] = gradientLayer;

    // Replace this info with the current layer's mean input deltas,
    // so the previous layer can use those as its output delta.
    ΔErrorPerΔOutputs = ΔErrorPerΔInputsCollection;
  }

  return gradient;
}

function innerLoop(layer, inputs, i, ΔErrorPerΔOutputs, prevLayer, outputs, training) {
  const layerSize = layer.length;

  const ΔErrorPerΔPrevLayerOutputRunningTotal = Array(prevLayer.length);
  fillFromFunction(ΔErrorPerΔPrevLayerOutputRunningTotal, () => 0);

  const gradientLayer = Array(layerSize);

  for (let j = 0; j < layerSize; j++) {
    const neuron = layer[j];
    const inputTotal = inputs[i][j];
  
    const ΔErrorPerΔActivation = ΔErrorPerΔOutputs[j];
    const ΔActivationPerΔInputTotal = neuron.getDerivativeAtTotal(inputTotal);
  
    const { ΔInputTotalPerΔWeights, ΔInputTotalPerΔInputs } =
      innerInnerLoop(prevLayer, outputs, i, training, neuron);

    gradientLayer[j] = {
      ΔErrorPerΔBias: ΔErrorPerΔActivation * ΔActivationPerΔInputTotal,
      ΔErrorPerΔWeights: arrayScale(ΔInputTotalPerΔWeights, ΔErrorPerΔActivation * ΔActivationPerΔInputTotal),
    };

    const ΔErrorPerΔInputs = arrayScale(ΔInputTotalPerΔInputs, ΔErrorPerΔActivation * ΔActivationPerΔInputTotal);
    for (let i = 0; i < prevLayer.length; i++) {
      ΔErrorPerΔPrevLayerOutputRunningTotal[i] += ΔErrorPerΔInputs[i];
    }
  }

  arrayScale(ΔErrorPerΔPrevLayerOutputRunningTotal, 1/prevLayer.length);

  return { gradientLayer, ΔErrorPerΔInputsCollection: ΔErrorPerΔPrevLayerOutputRunningTotal };
}

function innerInnerLoop(prevLayer, outputs, i, training, neuron) {
  const ΔInputTotalPerΔWeights = Array(prevLayer.length);
  const ΔInputTotalPerΔInputs = Array(prevLayer.length);
  for (let k = 0; k < prevLayer.length; k++) {
    ΔInputTotalPerΔWeights[k] = (outputs[i - 1] || training.inputs)[k];
    ΔInputTotalPerΔInputs[k] = neuron.weights[k];
  }
  return { ΔInputTotalPerΔWeights, ΔInputTotalPerΔInputs };
}