export default class ProgrammaticInputNode {
  constructor(value = 0) {
    this.value = value;
  }

  setValue(value) {
    this.value = value;
  }

  getActivation() {
    return this.value;
  }
}