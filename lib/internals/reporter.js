const signal = require('signale'),
  chalk = require('chalk'),
  ms = require('ms'),
  { reporters: { Base } } = require('mocha'),
  event = require('./events');

signal.config({ displayLabel: false });

const { cursor } = Base;

class Cli extends Base {
  constructor(runner) {
    super(runner);

    runner.on('start', () => {
      signal.log();
    });

    runner.on('suite', (suite) => {
      if (!suite.title) return;

      signal.start(chalk.bold(suite.title));
    });

    runner.on('fail', (test) => {
      cursor.CR();
      signal.error({ message: ` ${test.title}`, suffix: chalk.grey(`in ${ms(test.duration)}`) });
    });

    runner.on('pending', (test) => {
      cursor.CR();
      signal.pending({ message: ` ${test.title}` });
    });

    runner.on('pass', (test) => {
      cursor.CR();
      signal.success({ message: ` ${test.title}`, suffix: chalk.grey(`in ${ms(test.duration)}`) });
    });

    runner.on('end', this.result.bind(this));


    // runner.on('test', (test) => {
    //   signal.wait({ message: chalk.grey(test.title) });
    // });

    event.emitter.on(event.step.started, (step) => {
      signal.info({ message: chalk.grey(`  ${step.toString()}`) });
    });
  }

  result() {
    const { stats } = this;
    signal.log();

    // failures
    if (stats.failures) {
      Base.list(this.failures);
      signal.log();
    }

    signal.log(
      (stats.failures ? chalk.bgRed.white.bold(' FAIL ') : chalk.bgGreen.white.bold(' PASS '))
      + chalk.green(` ${stats.passes} passed`) + chalk.grey(' | ')
      + chalk.red(`${stats.failures} failed`)
      + (stats.pending ? chalk.yellow(` | ${stats.pending} skipped`) : '')
      + chalk.grey(` // ${ms(stats.duration)}`),
    );
  }
}
module.exports = function reporter(runner, opts) {
  return new Cli(runner, opts);
};
