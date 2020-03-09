const { reporters: { Base } } = require('mocha'),
  ms = require('ms'),
  event = require('./events'),
  output = require('./printer');

const { cursor } = Base;

class Cli extends Base {
  constructor(runner, opts) {
    super(runner);

    let level = 0;

    opts = opts.reporterOptions || opts;

    if (opts.steps) level = 1;
    if (opts.debug) level = 2;
    if (opts.verbose) level = 3;

    output.level(level);

    const showSteps = (level >= 1);

    runner.on('start', () => {
      console.log();
    });

    runner.on('suite', (suite) => {
      output.suite.started(suite);
    });

    runner.on('fail', (test) => {
      if (showSteps && test.steps) {
        return output.scenario.failed(test);
      }
      cursor.CR();
      output.test.failed(test);
    });

    runner.on('pending', (test) => {
      cursor.CR();
      output.test.skipped(test);
    });

    runner.on('pass', (test) => {
      if (showSteps && test.steps) {
        return output.scenario.passed(test);
      }
      cursor.CR();
      output.test.passed(test);
    });

    runner.on('end', this.result.bind(this));

    if (!showSteps) {
      return;
    }

    runner.on('test', (test) => {
      if (test.steps) {
        output.test.started(test);
      }
    });

    event.dispatcher.on(event.step.started, (step) => {
      output.stepShift = 3;
      output.step(step);
    });

    event.dispatcher.on(event.step.finished, () => {
      output.stepShift = 0;
    });
  }

  result() {
    const { stats } = this;
    console.log();

    // passes
    if (stats.failures) {
      output.print('-- FAILURES:');
    }

    // failures
    if (stats.failures) {
      Base.list(this.failures);
      console.log();
    }

    output.result(stats.passes, stats.failures, stats.pending, ms(stats.duration));
  }
}
module.exports = function reporter(runner, opts) {
  return new Cli(runner, opts);
};
