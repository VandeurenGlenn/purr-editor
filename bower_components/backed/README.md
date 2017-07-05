# backed [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]
> A collection of methods for easy &amp; fast es6 elements

## Features
- customElementsV1 support
- Commonjs (node) support
- Internal & global property observers

## Installation

```sh
$ bower install --save backed
```

```sh
$ npm install --save backed
```

## Usage

### Basic usage
```js
Backed(class extends HTMLElement {
  constructor() { // note that constructors are ignored when running as a customElement V0
    super();
  }
  ready() {
    // ready to go ...
  }
});
```

### Using observers

```js
Backed(class extends HTMLElement {
  static get properties() {
    return {
      name: {
        observer: 'change'
      }
    }
  }
  constructor() {
    super();
  }
  ready() {
    // ready to go ...
  }
  change(change) {
    console.log(change);
  }
});
```

## More info
- [wiki](https://github.com/VandeurenGlenn/backed/wiki)

## Roadmap
- [x] Support customElementsV1
- [x] Support commonjs (node)
- [x] Add observer support
- [x] Add global observer support
- [ ] Fallback to customElementsV0 when V1 is unsupported
- [ ] Support running multiple Backed version

## TODO

- [ ] Add private property support
- [ ] Handle Commonjs (properties, observers, etc ...)
- [ ] Bind properties & attributes (use pubsub to notify changes)
- [ ] Update README
- [ ] Add demo's
- [ ] Add documentation

## License

CC-BY-NC-ND-4.0 © [Glenn Vandeuren]()

[npm-image]: https://badge.fury.io/js/backed.svg
[npm-url]: https://npmjs.org/package/backed
[travis-image]: https://travis-ci.org/basicelements/backed.svg?branch=master
[travis-url]: https://travis-ci.org/basicelements/backed
[daviddm-image]: https://david-dm.org/basicelements/backed.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/basicelements/backed
[coveralls-image]: https://coveralls.io/repos/basicelements/backed/badge.svg
[coveralls-url]: https://coveralls.io/r/basicelements/backed
