const events = require('events'),
  Chain = require('./chain');

const emitter = new events.EventEmitter();


/**
 * @namespace
 * @alias event
 */
module.exports = {
  /**
   * @type {NodeJS.EventEmitter}
   * @constant
   * @inner
   */
  emitter,
  /**
   * @type {object}
   * @constant
   * @inner
   * @property {'test.start'} started
   * @property {'test.before'} before
   * @property {'test.after'} after
   * @property {'test.passed'} passed
   * @property {'test.failed'} failed
   * @property {'test.finish'} finished
   */
  test: {
    started: 'test.start', // sync
    before: 'test.before', // async
    after: 'test.after', // async
    passed: 'test.passed', // sync
    failed: 'test.failed', // sync
    finished: 'test.finish', // sync
  },
  /**
   * @type {object}
   * @constant
   * @inner
   * @property {'suite.before'} before
   * @property {'suite.after'} after
   */
  suite: {
    before: 'suite.before',
    after: 'suite.after',
  },
  /**
   * @type {object}
   * @constant
   * @inner
   * @property {'hook.start'} started
   * @property {'hook.passed'} passed
   */
  /**
   * @type {object}
   * @constant
   * @inner
   * @property {'step.start'} started
   * @property {'step.before'} before
   * @property {'step.after'} after
   * @property {'step.passed'} passed
   * @property {'step.failed'} failed
   * @property {'step.finish'} finished
   */
  step: {
    before: 'step.before', // async
    after: 'step.after', // async
    started: 'step.start', // sync
    passed: 'step.passed', // sync
    failed: 'step.failed', // sync
    finished: 'step.finish', // sync
    comment: 'step.comment',
  },

  all: {
    before: 'all.before',
    after: 'all.after',
  },

  /**
   * @param {string} event
   * @param {*} param
   */
  emit() {
    try {
      this.emitter.emit(...arguments);
    } catch (err) { /* noOp */ }
  },

  registerHelper(instance) {
    function runAsyncHelpersHook(hook, param, force) {
      // If the hook cannot be found then bail out
      if (!instance[hook]) return;

      Chain.append(`${instance.constructor.name}:${hook}`, () => instance[hook](param), force);
    }

    this.emitter.on(this.all.before, () => {
      runAsyncHelpersHook('beforeAll', {}, false);
    });

    this.emitter.on(this.all.after, () => {
      runAsyncHelpersHook('afterAll', {}, true);
    });

    this.emitter.on(this.suite.before, (suite) => {
      runAsyncHelpersHook('beforeSuite', suite, false);
    });

    this.emitter.on(this.suite.after, (suite) => {
      runAsyncHelpersHook('afterSuite', suite, true);
    });

    this.emitter.on(this.test.before, (test) => {
      runAsyncHelpersHook('before', test, false);
    });

    this.emitter.on(this.test.passed, (test) => {
      runAsyncHelpersHook('passed', test, true);
    });

    this.emitter.on(this.test.failed, (test) => {
      runAsyncHelpersHook('failed', test, true);
    });

    this.emitter.on(this.test.after, (test) => {
      runAsyncHelpersHook('after', test, true);
    });

    this.emitter.on(this.step.before, (step) => {
      runAsyncHelpersHook('beforeStep', step, false);
    });

    this.emitter.on(this.step.after, (step) => {
      runAsyncHelpersHook('afterStep', step, false);
    });
  },
};
