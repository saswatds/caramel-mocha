/* eslint-disable*/

class Helper {
  /**
   * Hook executed before all tests
   * @protected
   */
  init() {

  }

  /**
   * Hook executed before each test.
   * @protected
   */
  before() {

  }

  /**
   * Hook executed after each test
   * @protected
   */
  after() {

  }

  /**
   * Hook provides a test details
   * Executed in the very beginning of a test
   * @param {Mocha.Test} test
   * @protected
   */
  test(test) {

  }

  /**
   * Hook executed after each passed test
   * @param {Mocha.Test} test
   * @protected
   */
  passed(test) {

  }

  /**
   * Hook executed after each failed test
   * @param {Mocha.Test} test
   * @protected
   */
  failed(test) {

  }

  /**
   * Hook executed before each step
   * @param {CodeceptJS.Step} step
   * @protected
   */
  beforeStep(step) {

  }

  /**
   * Hook executed after each step
   * @param {CodeceptJS.Step} step
   * @protected
   */
  afterStep(step) {

  }

  /**
   * Hook executed before each suite
   * @param {Mocha.Suite} suite
   * @protected
   */
  beforeSuite(suite) {

  }

  /**
   * Hook executed after each suite
   * @param {Mocha.Suite} suite
   * @protected
   */
  afterSuite(suite) {

  }

  /**
   * An internal helper that exposes the defined actions in the helper.
   * To define an action prepend the action with `$`
   */
  actions() {
    return new Proxy(this, {
      has (target, key) {
        return `$${key}` in target;
      },

      ownKeys (target) {
        return Object
            .getOwnPropertyNames(Object.getPrototypeOf(target))
            .filter((name) => name.startsWith('$'))
            .map((name) => name.slice(1));
      },

      get (target, key) {
        return target[`$${key}`].bind(target);
      }
    });
  }
}

module.exports = Helper;
/* eslint-enable */
