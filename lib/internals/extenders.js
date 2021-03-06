class FeatureContext {
  constructor(suite) {
    this.suite = suite;
  }

  tag(val) {
    if (val[0] !== '@') (val = `@${val}`);

    this.suite.tag = val;

    return this;
  }
}

class ScearioContext {
  constructor(test) {
    this.test = test;
  }

  tag(val) {
    if (val[0] !== '@') (val = `@${val}`);

    this.test.tag = val;

    return this;
  }

  repeat(times = Infinity, delay = 0) {
    this.test.repeat.times = times;
    this.test.repeat.delay = delay;

    return this;
  }

  debug() {
    this.test.pauseBeforeStep = true;

    return this;
  }
}


module.exports = { FeatureContext, ScearioContext };
