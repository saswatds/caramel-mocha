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
}


module.exports = { FeatureContext, ScearioContext };
