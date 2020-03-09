const crypto = require('crypto'),
  Mocha = require('mocha'),
  CreamUI = require('./cream'),
  Printer = require('./internals/printer'),
  Reporter = require('./internals/reporter');

Mocha.Runner.prototype.uncaught = function uncaught(err) {
  if (err) {
    Printer.error(err);
    Printer.print(err.stack);
  } else {
    Printer.error('Uncaught <undefined> exception');
  }

  process.exit(1);
};

function genId(test) {
  return crypto.createHash('md5').update(test.fullTitle()).digest('base64')
    .slice(0, -2);
}

// A mocha singleton to persist the reference
let mocha;

class CaramelMocha extends Mocha {
  constructor(opts) {
    super(opts);

    this.ui(CreamUI);
    this.reporter(Reporter, opts);
  }

  // @overrides
  loadFiles(fn) {
    // Load all the files
    super.loadFiles(fn);

    // Add id to each test
    this.suite.eachTest((test) => { test.id = genId(test); });
  }
}

module.exports = {
  create: (opts) => {
    mocha = new CaramelMocha(opts);

    return mocha;
  },
};
