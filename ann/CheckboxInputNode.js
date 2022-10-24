export default class CheckboxInputNode {
  constructor(el) {
    this.el = el;
  }

  getActivation() {
    return this.el.checked * 1.0;
  }
}