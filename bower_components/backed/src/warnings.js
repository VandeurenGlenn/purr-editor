const _warnings = [];

const warnings = {
  CESV0: 'Backed uses a ready method as lifeCycleCallback, please see the documentation for more info',
  CESV1: 'Backed uses a ready method as lifeCycleCallback, things should work fine when CESV1 is supported, but CESV0 not, please see the documentation for more info'
};

const warn = (name, warning) => {
  if (!_warnings[warning]) {
    console.warn(`${name}::${warnings[warning]}`);
    _warnings.push(warning);
  }
}

export default {
  warn: warn
}
