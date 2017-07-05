'use strict';
import fireEvent from './internals/fire-event.js';
import toJsProp from './internals/to-js-prop.js';
import loadScript from './internals/load-script.js';
import PubSubLoader from './internals/pub-sub-loader.js';

const registeredElements = [];

const shouldShim = () => {
  return /Edge/.test(navigator.userAgent) || /Firefox/.test(navigator.userAgent);
}

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
}

const handleShadowRoot = ({ target: target, template: template }) => {
  if (!target.shadowRoot) {
    target.attachShadow({mode: 'open'});
    if (template) {
      target.shadowRoot.appendChild(
        document.importNode(template.content, true));

        if (shouldShim()) {
          const styles = target.shadowRoot.querySelectorAll('style');
          let _shimmed;
          if (styles[0]) {
            _shimmed = document.createElement('style');
            target.shadowRoot.insertBefore(_shimmed, target.shadowRoot.firstChild);
          }
          for (let style of styles) {
            _shimmed.innerHTML += style.innerHTML
              .replace(/:host\b/gm, target.localName)
              .replace(/::content\b/gm, '');

            target.shadowRoot.removeChild(style);
          }
        }
    }
  }
}

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
      // Bind(superclass, superclass.properties)
    }
  }
}

const handlePropertyObserver = (obj, property, observer, opts={
  strict: false, global:false
}) => {

  if (observer && _needsObserverSetup(obj, property)) {
    obj.observedProperties.push(property);

    // subscribe only when a callback is defined, all other global options are still available ...
    if (opts.global && obj[observer]) {
      PubSub.subscribe(`global.${property}`, obj[observer].bind(obj));
    }
    setupObserver(obj, property, observer, opts)
  }
}

const _needsObserverSetup = (obj, property) => {
  if (!obj.observedProperties) {
    obj.observedProperties = [];
  }
  if (obj.observedProperties[property]) {
    console.warn(
      'observer::ignoring duplicate property observer ' + property
    );
    return false;
  } else {
    return true;
  }
}

const forObservers = (target, observers, isGlobal=false) => {
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
}

/**
 * Runs a method on target whenever given property changes
 *
 * example:
 * change(change) {
 *  change.property // name of the property
 *  change.value // value of the property
 * }
 *
 * @arg {object} obj target
 * @arg {string} property name
 * @arg {boolean} strict
 * @arg {method} fn The method to run on change
 */
const setupObserver = (obj, property, fn, opts={
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
}


const handleObservers = (target, observers=[], globalObservers=[]) => {
  if (!observers && !globalObservers) {
    return;
  }
  forObservers(target, observers);
}

const handleListeners = target => {
  const attributes = target.attributes
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
          target.host[fn]();
        }
      });
    }
  }
}

const ready = target => {
  requestAnimationFrame(() => {
    if (target.ready) target.ready();
  });
}

const constructorCallback = (target=HTMLElement, hasWindow=false, shady) => {
  PubSubLoader(hasWindow);

  if (shady) {
    ShadyCSS.styleElement(target)
  }

  target.fireEvent = target.fireEvent || fireEvent.bind(target);
  target.toJsProp = target.toJsProp || toJsProp.bind(target);
  target.loadScript = target.loadScript || loadScript.bind(target);

  if (!target.registered && target.created) target.created();

  // let backed know the element is registered
  target.registered = true;
}

const connectedCallback = (target=HTMLElement, klass=Function, template=null) => {
  handleShadowRoot({target: target, template: template});
  if (target.connected) target.connected();
  // setup properties
  handleProperties(target, klass.properties);
  // setup properties
  handleObservers(target, klass.observers, klass.globalObservers);
  // setup listeners
  handleListeners(target)
  // notify everything is ready
  ready(target);
}

const shouldRegister = (name, klass) => {
  if (registeredElements.indexOf(name) === -1) {
    registeredElements.push(name);
    return true;
  }
  return false;
}

export default {
  setupTemplate: setupTemplate.bind(this),
  handleShadowRoot: handleShadowRoot.bind(this),
  handleProperties: handleProperties.bind(this),
  handlePropertyObserver: handlePropertyObserver.bind(this),
  handleObservers: handleObservers.bind(this),
  setupObserver: setupObserver.bind(this),
  ready: ready.bind(this),
  connectedCallback: connectedCallback.bind(this),
  constructorCallback: constructorCallback.bind(this),
  shouldRegister: shouldRegister.bind(this)
}
