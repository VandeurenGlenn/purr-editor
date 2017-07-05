'use strict';
import base from './base.js';
const supportsCustomElementsV1 = 'customElements' in window;
const supportsCustomElementsV0 = 'registerElement' in document;
const supportsShadowDOMV1 = !!HTMLElement.prototype.attachShadow;

const isWindow = () => {
  try {
    return window;
  } catch(e) {
    return false;
  }
};

const hasWindow = isWindow();

/**
 *
 * @module backed
 * @param {class} _class
 */
export default _class => {
  const upperToHyphen = string => {
    return string.replace(/([A-Z])/g, "-$1").toLowerCase().replace('-', '');
  };

  let klass;

  // get the tagName or try to make one with class.name
  let name = _class.is || upperToHyphen(_class.name);

  // Setup properties & observers
  if (hasWindow) {
    const template = base.setupTemplate({
      name: name,
      shady: !supportsShadowDOMV1
    });

    if (supportsCustomElementsV1) {
      klass = class extends _class {
        constructor() {
          super();
          base.constructorCallback(this, hasWindow, !supportsShadowDOMV1);
        }
        connectedCallback() {
          base.connectedCallback(this, _class, template);
        }
        disconnectedCallback() {
          if (this.disconnected) this.disconnected();
        }
      }
      if (base.shouldRegister(name, klass)) {
        customElements.define(name, klass);
      };
    } else if (supportsCustomElementsV0) {
      klass = class extends _class {
        createdCallback() {
          base.constructorCallback(this, hasWindow, !supportsShadowDOMV1);
        }
        attachedCallback() {
          base.connectedCallback(this, _class, template);
        }
        detachedCallback() {
          if (this.disconnected) this.disconnected();
        }
        attachShadow() {
          // TODO: feature detect shadowDOM for V1
          return this.createShadowRoot();
        }
      }
      if (base.shouldRegister(name, klass)) {
        document.registerElement(name, klass)
      };
    } else {
      console.warn('classes::unsupported');
    }
  } else {
    // TODO: handle Commonjs (properties, observers, etc ...)
    klass = _class;
  }
  return window[_class.name] = klass;
};
