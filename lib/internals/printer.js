const colors = require('chalk'),
  figures = require('figures');

const styles = {
    error: colors.bgRed.white.bold,
    success: colors.bgGreen.white.bold,
    scenario: colors.magenta.bold,
    basic: colors.white,
    debug: colors.cyan,
    log: colors.grey,
    bold: colors.bold,
  },

  outputProcess = '';

let outputLevel = 0,
  newline = true;

function print(...msg) {
  if (outputProcess) {
    msg.unshift(outputProcess);
  }
  if (!newline) {
    console.log();
    newline = true;
  }

  console.log.apply(this, msg);
}

function truncate(msg, gap = 0) {
  if (msg.indexOf('\n') > 0) {
    return msg; // don't cut multi line steps
  }
  const width = (process.stdout.columns || 200) - gap - 4;
  if (msg.length > width) {
    msg = msg.substr(0, width - 1) + figures.ellipsis;
  }
  return msg;
}


/**
 * @alias output
 * @namespace
 */
module.exports = {
  colors,
  styles,
  print,
  /** @type {number} */
  stepShift: 0,

  /**
   * Set or return current verbosity level
   * @param {number} level
   * @return {number}
   */
  level(level) {
    if (level !== undefined) outputLevel = level;
    return outputLevel;
  },

  /**
   * Print information in --debug mode
   * @param {string} msg
   */
  debug(msg) {
    if (outputLevel >= 2) {
      print(' '.repeat(this.stepShift), styles.debug(`${figures.pointerSmall} ${msg}`));
    }
  },

  /**
   * Print information in --verbose mode
   * @param {string} msg
   */
  log(msg) {
    if (outputLevel >= 3) print(' '.repeat(this.stepShift), styles.log(truncate(`   ${msg}`, this.spaceShift)));
  },

  /**
   * Print error
   * @param {string} msg
   */
  error(msg) {
    print(styles.error(msg));
  },

  /**
   * Print a successful message
   * @param {string} msg
   */
  success(msg) {
    print(styles.success(msg));
  },

  /**
   * Print a step
   * @param {CodeceptJS.Step} step
   */
  step(step) {
    if (outputLevel === 0) return;
    if (!step) return;

    let stepLine = step.toString();

    if (step.metaStep && outputLevel >= 1) {
      this.stepShift += 2;
      stepLine = colors.green(truncate(stepLine, this.spaceShift));
    }

    if (step.comment) {
      stepLine += colors.grey(step.comment.split('\n').join('\n' + ' '.repeat(4))); // eslint-disable-line
    }

    print(' '.repeat(this.stepShift), truncate(stepLine, this.spaceShift));
  },

  /** @namespace */
  suite: {
    /**
     * @param {Mocha.Suite} suite
     */
    started: (suite) => {
      if (!suite.title) return;
      print(`${colors.bold(suite.title)} --`);
      if (suite.comment) print(suite.comment);
    },
  },

  /** @namespace */
  test: {
    /**
     * @param {Mocha.Test} test
     */
    started(test) {
      print(`  ${colors.magenta.bold(test.title)}`);
    },
    /**
     * @param {Mocha.Test} test
     */
    passed(test) {
      print(`  ${colors.green.bold(figures.tick)} ${test.title} ${colors.grey(`in ${test.duration}ms`)}`);
    },
    /**
     * @param {Mocha.Test} test
     */
    failed(test) {
      print(`  ${colors.red.bold(figures.cross)} ${test.title} ${colors.grey(`in ${test.duration}ms`)}`);
    },
    /**
     * @param {Mocha.Test} test
     */
    skipped(test) {
      print(`  ${colors.yellow.bold('S')} ${test.title}`);
    },
  },

  /** @namespace */
  scenario: {
    /**
     * @param {Mocha.Test} test
     */
    started() {},
    /**
     * @param {Mocha.Test} test
     */
    passed(test) {
      print(`  ${colors.green.bold(`${figures.tick} OK`)} ${colors.grey(`in ${test.duration}ms`)}`);
      print();
    },
    /**
     * @param {Mocha.Test} test
     */
    failed(test) {
      print(`  ${colors.red.bold(`${figures.cross} FAILED`)} ${colors.grey(`in ${test.duration}ms`)}`);
      print();
    },
  },

  /**
   *
   * Print a text in console log
   * @param {string} message
   * @param {string} [color]
   */
  say(message, color = 'cyan') {
    if (outputLevel >= 1) print(`   ${colors[color].bold(message)}`);
  },

  /**
   * @param {number} passed
   * @param {number} failed
   * @param {number} skipped
   * @param {number} duration
   */
  result(passed, failed, skipped, duration) {
    let style = colors.bgGreen,
      msg = ` ${passed || 0} passed`,
      status = style.bold('  OK ');
    if (failed) {
      style = style.bgRed;
      status = style.bold('  FAIL ');
      msg += `, ${failed} failed`;
    }
    status += style.grey(' |');

    if (skipped) {
      if (!failed) style = style.bgYellow;
      msg += `, ${skipped} skipped`;
    }
    msg += '  ';
    print(status + style(msg) + colors.grey(` // ${duration}`));
  },
};
