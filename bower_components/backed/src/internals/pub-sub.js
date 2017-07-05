'use strict';
export default class {

  /**
   * Creates handlers
   */
  constructor() {
    this.handlers = [];
  }

  /**
   * @param {String} event
   * @param {Method} handler
   * @param {HTMLElement} context
   */
  subscribe(event, handler, context) {
    if (typeof context === 'undefined') {
      context = handler;
    }
    this.handlers.push({event: event, handler: handler.bind(context)});
  }

  /**
   * @param {String} event
   * @param {String|Number|Boolean|Object|Array} change
   */
  publish(event, change) {
    for (let i = 0; i < this.handlers.length; i++) {
      if (this.handlers[i].event === event) {
        let oldValue = this.handlers[i].oldValue;
        // dirty checking value, ensures that we don't create a loop
        if (oldValue !== change.value) {
          this.handlers[i].handler(change, this.handlers[i].oldValue);
          this.handlers[i].oldValue = change.value;
        }
      }
    }
  }
}
