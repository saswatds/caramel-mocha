const glob = require('glob'),
  path = require('path'),
  MochaFactor = require('./mochaFactory'),
  ChocoFactory = require('./chocoFactory'),

  Helper = require('./internals/helper'),
  Events = require('./internals/events');

/**
 * Caramel Runner
 */
class Caramel {
  constructor(opts) {
    this.opts = opts || {};
    this.testFiles = [];
    this.helpers = {};

    // Add the default Helper, any all to addHelper will replace this
    ChocoFactory.updateHelpers({ Helper: new Helper() });

    // Setup the mocha and choco-factory
    this.mocha = MochaFactor.create(this.opts.mochaOpts);
  }

  addHelper(instance) {
    const { name } = instance.constructor;

    if (name in this.helpers) {
      throw new Error(`Helper '${name}' is already added`);
    }

    this.helpers[name] = instance;

    ChocoFactory.updateHelpers(this.helpers);
    Events.registerHelper(instance);
  }

  loadFiles(pattern) {
    glob.sync(pattern).forEach((file) => {
      if (!path.isAbsolute(file)) (file = path.resolve(file));

      this.testFiles.push(file);
    });

    return this;
  }

  run(test, done) {
    if (typeof test === 'function') {
      done = test;
      test = undefined;
    }

    if (test) {
      if (!path.isAbsolute(test)) (test = path.resolve(test));

      this.mocha.files = this.testFiles.filter((t) => path.basename(t, '.js') === test || t === test);
    } else {
      this.mocha.files = this.testFiles;
    }

    this.mocha.run((err) => done && done(err));

    return this;
  }
}

module.exports = Caramel;
