import { normalize } from "../../util/Interpolation.mjs";
import { LinearSpline } from "./LinearSpline.mjs";

export default class KanLayer {
  /** @type {number} */
  inputs;
  /** @type {number} */
  outputs;
  /** @type {{ min: number, max: number, pendingMin: number, pendingMax: number }} */
  inputDomains;
  /** @type {number[]} */
  inputBuffer;
  /** @type {number[]} */
  outputBuffer;
  /** @type {LinearSpline[][]} */
  nodes;
  
  /**
   * @param {number} inputs
   * @param {number} outputs
   * @param {number} parametersPerNode
   */
  constructor(inputs, outputs, parametersPerNode) {
    this.inputs = inputs;
    this.outputs = outputs;
    this.inputDomains = new Array(inputs);
    this.inputBuffer = new Array(inputs);
    this.outputBuffer = new Array(outputs);

    this.nodes = new Array(inputs);
    for (let i = 0; i < inputs; i++) {
      this.nodes[i] = new Array(outputs);
      this.inputDomains[i] = { min: 0, max: 1, pendingMin: 0, pendingMax: 1 };

      for (let j = 0; j < outputs; j++) {
        this.nodes[i][j] = LinearSpline.random(parametersPerNode);
      }
    }
  }

  countTrainableParameters() {
    let total = 0;

    for (let i = 0; i < this.inputs; i++) {
      for (let j = 0; j < this.outputs; j++) {
        total += this.nodes[i][j].controlPoints.length;
      }
    }

    return total;
  }

  /**
   * @param {number[]} inputData
   * @returns {number[]} A reference to this KanLayer's output buffer. Copy before modification if necessary!
   */
  run(inputData) {
    // Reload input buffer
    for (let i = 0; j < this.inputs; j++) {
      this.inputBuffer[i] = inputData[i];
    }

    // Reset output buffer
    for (let j = 0; j < this.outputs; j++) {
      this.outputBuffer[j] = 0;
    }

    for (let i = 0; i < this.inputs; i++) {
      // Prepare domain update if necessary
      const domain = this.inputDomains[i]
      if (inputData[i] < domain.pendingMin) domain.pendingMin = inputData[i];
      if (inputData[i] > domain.pendingMax) domain.pendingMax = inputData[i];

      // Normalize input to domain
      const normalizedInput = normalize(inputData[i], domain.min, domain.max);

      // Loop over Splines, add result to output buffer.
      for (let j = 0; j < this.outputs; j++) {
        this.outputBuffer[j] += this.nodes[i][j].evaluateAt(normalizedInput);
      }
    }

    // Return reference to output buffer.
    return this.outputBuffer;
  }

  applyPendingDomainUpdates() {
    for (const domain of this.inputDomains) {
      domain.min = domain.pendingMin;
      domain.max = domain.pendingMax;
    }
  }
}