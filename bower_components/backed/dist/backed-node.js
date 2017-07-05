'use strict';

var fireEvent = (function () {
  var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : String;
  var detail = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var target = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : document;
  target.dispatchEvent(new CustomEvent(type, { detail: detail }));
});

var toJsProp = (function (string) {
  var parts = string.split('-');
  if (parts.length > 1) {
    var upper = parts[1].charAt(0).toUpperCase();
    string = parts[0] + upper + parts[1].slice(1).toLowerCase();
  }
  return string;
});

var loadScript = function loadScript(src) {
  return new Promise(function (resolve, reject) {
    var script = document.createElement('script');
    script.src = src;
    script.onload = function (result) {
      resolve(result);
    };
    script.onerror = function (error) {
      reject(error);
    };
    document.body.appendChild(script);
  });
};

var _class = function () {
  function _class() {
    babelHelpers.classCallCheck(this, _class);
    this.handlers = [];
  }
  babelHelpers.createClass(_class, [{
    key: 'subscribe',
    value: function subscribe(event, handler, context) {
      if (typeof context === 'undefined') {
        context = handler;
      }
      this.handlers.push({ event: event, handler: handler.bind(context) });
    }
  }, {
    key: 'publish',
    value: function publish(event, change) {
      for (var i = 0; i < this.handlers.length; i++) {
        if (this.handlers[i].event === event) {
          var oldValue = this.handlers[i].oldValue;
          if (oldValue !== change.value) {
            this.handlers[i].handler(change, this.handlers[i].oldValue);
            this.handlers[i].oldValue = change.value;
          }
        }
      }
    }
  }]);
  return _class;
}();

var PubSubLoader = (function (isWindow) {
  if (isWindow) {
    window.PubSub = window.PubSub || new _class();
  } else {
    global.PubSub = global.PubSub || new _class();
  }
});

var registeredElements = [];
var shouldShim = function shouldShim() {
  return (/Edge/.test(navigator.userAgent) || /Firefox/.test(navigator.userAgent)
  );
};
var setupTemplate = function setupTemplate(_ref) {
  var name = _ref.name,
      shady = _ref.shady;
  try {
    var ownerDocument = document.currentScript.ownerDocument;
    var template = ownerDocument.querySelector('template[id="' + name + '"]');
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
var handleShadowRoot = function handleShadowRoot(_ref2) {
  var target = _ref2.target,
      template = _ref2.template;
  if (!target.shadowRoot) {
    target.attachShadow({ mode: 'open' });
    if (template) {
      target.shadowRoot.appendChild(document.importNode(template.content, true));
      if (shouldShim()) {
        var styles = target.shadowRoot.querySelectorAll('style');
        var _shimmed = void 0;
        if (styles[0]) {
          _shimmed = document.createElement('style');
          target.shadowRoot.insertBefore(_shimmed, target.shadowRoot.firstChild);
        }
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;
        try {
          for (var _iterator = styles[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var style = _step.value;
            _shimmed.innerHTML += style.innerHTML.replace(/:host\b/gm, target.localName).replace(/::content\b/gm, '');
            target.shadowRoot.removeChild(style);
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }
    }
  }
};
var handleProperties = function handleProperties(target, properties) {
  if (properties) {
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;
    try {
      for (var _iterator2 = Object.keys(properties)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var property = _step2.value;
        var observer = properties[property].observer;
        var strict = properties[property].strict;
        var isGlobal = properties[property].global;
        handlePropertyObserver(target, property, observer, {
          strict: strict || false,
          global: isGlobal || false
        });
        target[property] = properties[property].value;
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }
  }
};
var handlePropertyObserver = function handlePropertyObserver(obj, property, observer) {
  var opts = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {
    strict: false, global: false
  };
  if (observer && _needsObserverSetup(obj, property)) {
    obj.observedProperties.push(property);
    if (opts.global && obj[observer]) {
      PubSub.subscribe('global.' + property, obj[observer].bind(obj));
    }
    setupObserver(obj, property, observer, opts);
  }
};
var _needsObserverSetup = function _needsObserverSetup(obj, property) {
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
var forObservers = function forObservers(target, observers) {
  var isGlobal = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;
  try {
    for (var _iterator3 = observers[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var observe = _step3.value;
      var parts = observe.split(/\(|\)/g);
      var fn = parts[0];
      parts = parts.slice(1);
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;
      try {
        for (var _iterator4 = parts[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var property = _step4.value;
          if (property.length) {
            handlePropertyObserver(target, property, fn, {
              strict: false,
              global: isGlobal
            });
          }
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }
};
var setupObserver = function setupObserver(obj, property, fn) {
  var opts = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {
    strict: false, global: false
  };
  var isConfigurable = opts.strict ? false : true;
  Object.defineProperty(obj, property, {
    set: function set(value) {
      if (this['_' + property] === value) {
        return;
      }
      this['_' + property] = value;
      var data = {
        property: property,
        value: value
      };
      if (opts.global) {
        data.instance = this;
        PubSub.publish('global.' + property, data);
      } else {
        if (this[fn]) {
          this[fn](data);
        } else {
          console.warn('observer undefined::' + fn + ' is not a function');
        }
      }
    },
    get: function get() {
      return this['_' + property];
    },
    configurable: isConfigurable
  });
};
var handleObservers = function handleObservers(target) {
  var observers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var globalObservers = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  if (!observers && !globalObservers) {
    return;
  }
  forObservers(target, observers);
};
var handleListeners = function handleListeners(target) {
  var attributes = target.attributes;
  var _iteratorNormalCompletion5 = true;
  var _didIteratorError5 = false;
  var _iteratorError5 = undefined;
  try {
    for (var _iterator5 = attributes[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
      var attribute = _step5.value;
      if (String(attribute.name).includes('on-')) {
        (function () {
          var fn = attribute.value;
          var name = attribute.name.replace('on-', '');
          target.addEventListener(String(name), function (event) {
            target = event.path[0];
            while (!target.host) {
              target = target.parentNode;
            }
            if (target.host[fn]) {
              target.host[fn]();
            }
          });
        })();
      }
    }
  } catch (err) {
    _didIteratorError5 = true;
    _iteratorError5 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion5 && _iterator5.return) {
        _iterator5.return();
      }
    } finally {
      if (_didIteratorError5) {
        throw _iteratorError5;
      }
    }
  }
};
var ready = function ready(target) {
  requestAnimationFrame(function () {
    if (target.ready) target.ready();
  });
};
var constructorCallback = function constructorCallback() {
  var target = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : HTMLElement;
  var hasWindow = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  var shady = arguments[2];
  PubSubLoader(hasWindow);
  if (shady) {
    ShadyCSS.styleElement(target);
  }
  target.fireEvent = target.fireEvent || fireEvent.bind(target);
  target.toJsProp = target.toJsProp || toJsProp.bind(target);
  target.loadScript = target.loadScript || loadScript.bind(target);
  if (!target.registered && target.created) target.created();
  target.registered = true;
};
var connectedCallback = function connectedCallback() {
  var target = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : HTMLElement;
  var klass = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Function;
  var template = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  handleShadowRoot({ target: target, template: template });
  if (target.connected) target.connected();
  handleProperties(target, klass.properties);
  handleObservers(target, klass.observers, klass.globalObservers);
  handleListeners(target);
  ready(target);
};
var shouldRegister = function shouldRegister(name, klass) {
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

var supportsCustomElementsV1 = 'customElements' in window;
var supportsCustomElementsV0 = 'registerElement' in document;
var supportsShadowDOMV1 = !!HTMLElement.prototype.attachShadow;
var isWindow = function isWindow() {
  try {
    return window;
  } catch (e) {
    return false;
  }
};
var hasWindow = isWindow();
var backed = (function (_class) {
  var upperToHyphen = function upperToHyphen(string) {
    return string.replace(/([A-Z])/g, "-$1").toLowerCase().replace('-', '');
  };
  var klass = void 0;
  var name = _class.is || upperToHyphen(_class.name);
  if (hasWindow) {
    var template = base.setupTemplate({
      name: name,
      shady: !supportsShadowDOMV1
    });
    if (supportsCustomElementsV1) {
      klass = function (_class2) {
        babelHelpers.inherits(klass, _class2);
        function klass() {
          babelHelpers.classCallCheck(this, klass);
          var _this = babelHelpers.possibleConstructorReturn(this, (klass.__proto__ || Object.getPrototypeOf(klass)).call(this));
          base.constructorCallback(_this, hasWindow, !supportsShadowDOMV1);
          return _this;
        }
        babelHelpers.createClass(klass, [{
          key: 'connectedCallback',
          value: function connectedCallback() {
            base.connectedCallback(this, _class, template);
          }
        }, {
          key: 'disconnectedCallback',
          value: function disconnectedCallback() {
            if (this.disconnected) this.disconnected();
          }
        }]);
        return klass;
      }(_class);
      if (base.shouldRegister(name, klass)) {
        customElements.define(name, klass);
      }
    } else if (supportsCustomElementsV0) {
      klass = function (_class3) {
        babelHelpers.inherits(klass, _class3);
        function klass() {
          babelHelpers.classCallCheck(this, klass);
          return babelHelpers.possibleConstructorReturn(this, (klass.__proto__ || Object.getPrototypeOf(klass)).apply(this, arguments));
        }
        babelHelpers.createClass(klass, [{
          key: 'createdCallback',
          value: function createdCallback() {
            base.constructorCallback(this, hasWindow, !supportsShadowDOMV1);
          }
        }, {
          key: 'attachedCallback',
          value: function attachedCallback() {
            base.connectedCallback(this, _class, template);
          }
        }, {
          key: 'detachedCallback',
          value: function detachedCallback() {
            if (this.disconnected) this.disconnected();
          }
        }, {
          key: 'attachShadow',
          value: function attachShadow() {
            return this.createShadowRoot();
          }
        }]);
        return klass;
      }(_class);
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

module.exports = backed;
//# sourceMappingURL=backed-node.js.map
