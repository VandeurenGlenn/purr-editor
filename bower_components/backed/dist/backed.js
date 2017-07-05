var Backed = (function () {
'use strict';

var fireEvent = ((type = String, detail = null, target = document) => {
  target.dispatchEvent(new CustomEvent(type, { detail: detail }));
});

var toJsProp = (string => {
  let parts = string.split('-');
  if (parts.length > 1) {
    var upper = parts[1].charAt(0).toUpperCase();
    string = parts[0] + upper + parts[1].slice(1).toLowerCase();
  }
  return string;
});

const loadScript = src => {
  return new Promise((resolve, reject) => {
    let script = document.createElement('script');
    script.src = src;
    script.onload = result => {
      resolve(result);
    };
    script.onerror = error => {
      reject(error);
    };
    document.body.appendChild(script);
  });
};

var Pubsub = class {
  constructor() {
    this.handlers = [];
  }
  subscribe(event, handler, context) {
    if (typeof context === 'undefined') {
      context = handler;
    }
    this.handlers.push({ event: event, handler: handler.bind(context) });
  }
  publish(event, change) {
    for (let i = 0; i < this.handlers.length; i++) {
      if (this.handlers[i].event === event) {
        let oldValue = this.handlers[i].oldValue;
        if (oldValue !== change.value) {
          this.handlers[i].handler(change, this.handlers[i].oldValue);
          this.handlers[i].oldValue = change.value;
        }
      }
    }
  }
};

var PubSubLoader = (isWindow => {
  if (isWindow) {
    window.PubSub = window.PubSub || new Pubsub();
  } else {
    global.PubSub = global.PubSub || new Pubsub();
  }
});

const registeredElements = [];
const shouldShim = () => {
  return (/Edge/.test(navigator.userAgent) || /Firefox/.test(navigator.userAgent)
  );
};
const setupTemplate = ({ name: name, shady: shady }) => {
  try {
    const ownerDocument = document.currentScript.ownerDocument;
    const template = ownerDocument.querySelector(`template[id="${name}"]`);
    if (template) {
      if (shady) {
        ShadyCSS.prepareTemplate(template, name);
      }
      return template;
    }
  } catch (e) {
    return console.warn(e);
  }
};
const handleShadowRoot = ({ target: target, template: template }) => {
  if (!target.shadowRoot) {
    target.attachShadow({ mode: 'open' });
    if (template) {
      target.shadowRoot.appendChild(document.importNode(template.content, true));
      if (shouldShim()) {
        const styles = target.shadowRoot.querySelectorAll('style');
        let _shimmed;
        if (styles[0]) {
          _shimmed = document.createElement('style');
          target.shadowRoot.insertBefore(_shimmed, target.shadowRoot.firstChild);
        }
        for (let style of styles) {
          _shimmed.innerHTML += style.innerHTML.replace(/:host\b/gm, target.localName).replace(/::content\b/gm, '');
          target.shadowRoot.removeChild(style);
        }
      }
    }
  }
};
const handleProperties = (target, properties) => {
  if (properties) {
    for (let property of Object.keys(properties)) {
      const observer = properties[property].observer;
      const strict = properties[property].strict;
      const isGlobal = properties[property].global;
      handlePropertyObserver(target, property, observer, {
        strict: strict || false,
        global: isGlobal || false
      });
      target[property] = properties[property].value;
    }
  }
};
const handlePropertyObserver = (obj, property, observer, opts = {
  strict: false, global: false
}) => {
  if (observer && _needsObserverSetup(obj, property)) {
    obj.observedProperties.push(property);
    if (opts.global && obj[observer]) {
      PubSub.subscribe(`global.${property}`, obj[observer].bind(obj));
    }
    setupObserver(obj, property, observer, opts);
  }
};
const _needsObserverSetup = (obj, property) => {
  if (!obj.observedProperties) {
    obj.observedProperties = [];
  }
  if (obj.observedProperties[property]) {
    console.warn('observer::ignoring duplicate property observer ' + property);
    return false;
  } else {
    return true;
  }
};
const forObservers = (target, observers, isGlobal = false) => {
  for (let observe of observers) {
    let parts = observe.split(/\(|\)/g);
    let fn = parts[0];
    parts = parts.slice(1);
    for (let property of parts) {
      if (property.length) {
        handlePropertyObserver(target, property, fn, {
          strict: false,
          global: isGlobal
        });
      }
    }
  }
};
const setupObserver = (obj, property, fn, opts = {
  strict: false, global: false
}) => {
  const isConfigurable = opts.strict ? false : true;
  Object.defineProperty(obj, property, {
    set(value) {
      if (this[`_${property}`] === value) {
        return;
      }
      this[`_${property}`] = value;
      let data = {
        property: property,
        value: value
      };
      if (opts.global) {
        data.instance = this;
        PubSub.publish(`global.${property}`, data);
      } else {
        if (this[fn]) {
          this[fn](data);
        } else {
          console.warn(`observer undefined::${fn} is not a function`);
        }
      }
    },
    get() {
      return this[`_${property}`];
    },
    configurable: isConfigurable
  });
};
const handleObservers = (target, observers = [], globalObservers = []) => {
  if (!observers && !globalObservers) {
    return;
  }
  forObservers(target, observers);
};
const handleListeners = target => {
  const attributes = target.attributes;
  for (const attribute of attributes) {
    if (String(attribute.name).includes('on-')) {
      const fn = attribute.value;
      const name = attribute.name.replace('on-', '');
      target.addEventListener(String(name), event => {
        target = event.path[0];
        while (!target.host) {
          target = target.parentNode;
        }
        if (target.host[fn]) {
          target.host[fn](event);
        }
      });
    }
  }
};
const ready = target => {
  requestAnimationFrame(() => {
    if (target.ready) target.ready();
  });
};
const constructorCallback = (target = HTMLElement, klass = Function, template, hasWindow = false, shady) => {
  PubSubLoader(hasWindow);
  if (shady) {
    ShadyCSS.styleElement(target);
  }
  target.fireEvent = target.fireEvent || fireEvent.bind(target);
  target.toJsProp = target.toJsProp || toJsProp.bind(target);
  target.loadScript = target.loadScript || loadScript.bind(target);
  handleShadowRoot({ target: target, template: template });
  handleProperties(target, klass.properties);
  if (!target.registered && target.created) target.created();
  target.registered = true;
};
const connectedCallback = (target = HTMLElement, klass = Function, template = null) => {
  if (target.connected) target.connected();
  handleObservers(target, klass.observers, klass.globalObservers);
  handleListeners(target);
  ready(target);
};
const shouldRegister = (name, klass) => {
  if (registeredElements.indexOf(name) === -1) {
    registeredElements.push(name);
    return true;
  }
  return false;
};
var base = {
  setupTemplate: setupTemplate.bind(undefined),
  handleShadowRoot: handleShadowRoot.bind(undefined),
  handleProperties: handleProperties.bind(undefined),
  handlePropertyObserver: handlePropertyObserver.bind(undefined),
  handleObservers: handleObservers.bind(undefined),
  setupObserver: setupObserver.bind(undefined),
  ready: ready.bind(undefined),
  connectedCallback: connectedCallback.bind(undefined),
  constructorCallback: constructorCallback.bind(undefined),
  shouldRegister: shouldRegister.bind(undefined)
};

const supportsCustomElementsV1 = 'customElements' in window;
const supportsCustomElementsV0 = 'registerElement' in document;
const supportsShadowDOMV1 = !!HTMLElement.prototype.attachShadow;
const isWindow = () => {
  try {
    return window;
  } catch (e) {
    return false;
  }
};
const hasWindow = isWindow();
var backed = (_class => {
  const upperToHyphen = string => {
    return string.replace(/([A-Z])/g, "-$1").toLowerCase().replace('-', '');
  };
  let klass;
  let name = _class.is || upperToHyphen(_class.name);
  if (hasWindow) {
    const template = base.setupTemplate({
      name: name,
      shady: !supportsShadowDOMV1
    });
    if (supportsCustomElementsV1) {
      klass = class extends _class {
        constructor() {
          super();
          base.constructorCallback(this, _class, template, hasWindow, !supportsShadowDOMV1);
        }
        connectedCallback() {
          base.connectedCallback(this, _class, template);
        }
        disconnectedCallback() {
          if (this.disconnected) this.disconnected();
        }
      };
      if (base.shouldRegister(name, klass)) {
        customElements.define(name, klass);
      }
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
          return this.createShadowRoot();
        }
      };
      if (base.shouldRegister(name, klass)) {
        document.registerElement(name, klass);
      }
    } else {
      console.warn('classes::unsupported');
    }
  } else {
    klass = _class;
  }
  return window[_class.name] = klass;
});

return backed;

}());
//# sourceMappingURL=backed.js.map
