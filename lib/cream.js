const escapeRe = require('escape-string-regexp'),
  getFnArg = require('fn-args'),

  MochaCommon = require('mocha/lib/interfaces/common'),
  Suite = require('mocha/lib/suite'),
  Test = require('mocha/lib/test'),

  Chain = require('./internals/chain'),
  event = require('./internals/events'),

  Choco = require('./chocoFactory');

function isAsyncFunction(fn) {
  if (!fn) { return false; }

  return fn[Symbol.toStringTag] === 'AsyncFunction';
}

function getParamNames(fn) {
  if (fn.isSinonProxy) { return []; }

  return getFnArg(fn);
}

const getInjectedArguments = (fn) => {
    const args = [],
      paramNames = getParamNames(fn) || [],
      objects = Choco.helpers;


    paramNames.forEach((name) => {
      if (!objects[name]) {
        throw new Error(`Object of type ${name} is not defined in container`);
      }

      args.push(objects[name]);
    });

    return args;
  },

  injectTest = (test) => {
    const testFn = test.fn;

    if (!testFn) {
      return test;
    }

    test.steps = [];
    test.timeout(0);
    test.async = true;

    // Replace the mocha test function with a Chained function
    test.fn = function fn(done) {
      let testPromise;

      if (isAsyncFunction(testFn)) {
        testPromise = testFn.apply(test, getInjectedArguments(testFn, test));
      } else {
        testPromise = new Promise((resolve, reject) => {
          try {
            const res = testFn.apply(test, getInjectedArguments(testFn, test));

            resolve(res);
          } catch (err) {
            reject(err);
          }
        });
      }

      event.emit(event.test.started, test);

      Chain.append(testPromise)
        .interceptResolve(() => {
          event.emit(event.test.passed, test);
          event.emit(event.test.finished, test);

          done();
        })
        .interceptReject((err) => {
          event.emit(event.test.passed, test);
          event.emit(event.test.finished, test);

          done(err);
        });
    };

    return test;
  };


module.exports = function Cream(rootSuite) {
  const suites = [rootSuite],
    afterHooks = [],
    afterEachHooks = [];

  let afterHooksAreLoaded = false,
    afterEachHooksAreLoaded = false;

  // Set timeout for the suite
  rootSuite.timeout(0);

  rootSuite.on('pre-require', (context, file, mocha) => {
    const common = MochaCommon([rootSuite], context, mocha);

    context.beforeAll = common.before;
    context.afterAll = common.after;

    context.run = common.runWithSuite(rootSuite);

    context.feature = function feature(title, opts) {
      // All suites are always created from the root suite. This ensures
      // we have a flat testing hierarchy
      const suite = Suite.create(rootSuite, title);

      if (!opts) (opts = {});
      suite.timeout(0);

      if (opts.timeout) suite.timeout(opts.timeout);
      if (opts.retries) suite.retries(opts.retries);

      suite.file = file;
      suite.fullTitle = () => `${suite.title}:`;

      suites.unshift(suite);

      suite.beforeAll('caramel.before', () => {
        Chain.begin();
        event.emit(event.suite.before, suite);
      });
      suite.beforeEach('caramel.beforeEach', () => {
        Chain.begin();
        event.emit(event.test.before, suite && suite.ctx && suite.ctx.currentTest);
      });

      afterHooks.push(['caramel.after', () => {
        Chain.end();
        event.emit(event.suite.after, suite);
      }]);
      afterEachHooks.push(['caramel.afterEach', () => {
        Chain.end();
        event.emit(event.test.after, suite && suite.ctx && suite.ctx.currentTest);
      }]);
    };

    function addScenario(title, opts = {}, fn) {
      // Get the top of the suites
      const suite = suites[0];

      if (typeof opts === 'function' && !fn) {
        fn = opts;
        opts = {};
      }

      if (suite.pending) {
        fn = null;
      }

      const test = new Test(title, fn);

      test.fullTitle = () => `${suite.title}: ${test.title}`;
      test.file = file;
      if (!test.inject) (test.inject = {});


      suite.addTest(injectTest(test));

      if (opts.retries) test.retries(opts.retries);
      if (opts.timeout) test.timeout(opts.timeout);

      test.opts = opts;
    }

    context.scenario = addScenario;

    context.scenario.only = function only(title, opts, fn) {
      const reString = `^${escapeRe(`${suites[0].title}: ${title}`.replace(/( \| {.+})?$/g, ''))}`;

      mocha.grep(new RegExp(reString));

      return addScenario(title, opts, fn);
    };

    context.scenario.skip = function skip(title) {
      return context.scenario(title, {});
    };
  });

  rootSuite.on('post-require', () => {
    if (!afterEachHooksAreLoaded && Array.isArray(afterEachHooks)) {
      afterEachHooks.forEach((hook) => suites[0].afterEach(hook[0], hook[1]));
      afterEachHooksAreLoaded = true;
    }

    if (!afterHooksAreLoaded && Array.isArray(afterHooks)) {
      afterHooks.forEach((hook) => suites[0].afterAll(hook[0], hook[1]));
      afterHooksAreLoaded = true;
    }
  });
};
