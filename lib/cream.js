const async = require('async'),
  escapeRe = require('escape-string-regexp'),
  getFnArg = require('fn-args'),

  MochaCommon = require('mocha/lib/interfaces/common'),
  Suite = require('mocha/lib/suite'),
  Test = require('mocha/lib/test'),

  Chain = require('./internals/chain'),
  event = require('./internals/events'),
  { FeatureContext, ScearioContext } = require('./internals/extenders'),

  Choco = require('./chocoFactory');

function isAsyncFunction(fn) {
  if (!fn) { return false; }

  return fn[Symbol.toStringTag] === 'AsyncFunction';
}

function getParamNames(fn) {
  if (fn.isSinonProxy) { return []; }

  return getFnArg(fn);
}

const getInjectedArguments = (fn, ctx) => {
    const args = [],
      paramNames = getParamNames(fn) || [],
      { helpers } = Choco;


    paramNames.forEach((name) => {
      if (!helpers[name]) {
        throw new Error(`Object of type ${name} is not defined in container`);
      }

      const boundedParam = helpers[name](ctx);

      args.push(boundedParam);
    });

    return args;
  },

  injectTest = (test) => {
    const testFn = test.fn;

    if (!testFn) {
      return test;
    }

    test.timeout(0);
    test.async = true;

    function exec(done) {
      // Intercept any previous rejection and call done with error
      Chain.interceptReject((err) => done(err));

      // Intercept previous resolve
      Chain.interceptResolve(() => {
        // mark the test start time to the current time
        test.startTime = Date.now();

        event.emit(event.test.started, test);

        if (isAsyncFunction(testFn)) {
          // For an async function the test can only be considered complete when all the
          // handers within the function are also comlete. On resolve on the test wait
          // for the promise chain to also resolve
          testFn(...getInjectedArguments(testFn, test))
            .then(() => Chain.promise())
            .then(() => {
              test.endTime = Date.now();

              event.emit(event.test.passed, test);
              event.emit(event.test.finished, test);

              done();
            })
            .catch((err) => {
              test.endTime = Date.now();

              event.emit(event.test.passed, test);
              event.emit(event.test.finished, test);

              done(err);
            });

          return;
        }

        // For a synchronous function we execute the function, to enqueue all
        // the handlers inside the scenario
        const res = testFn(...getInjectedArguments(testFn, test));

        Chain.append('test', () => Promise.resolve(res))
          .interceptResolve(() => {
            test.endTime = Date.now();

            event.emit(event.test.passed, test);
            event.emit(event.test.finished, test);

            done();
          })
          .interceptReject((err) => {
            test.endTime = Date.now();

            event.emit(event.test.passed, test);
            event.emit(event.test.finished, test);

            done(err);
          });
      });
    }

    // Replace the mocha test function with a Chained function
    test.fn = function (done) {
      let count = 0;

      async.until((next) => {
        // If count goes beyond repeat times then stop
        if ((count++) >= test.repeat.times) { // eslint-disable-line no-plusplus
          return next(null, true);
        }

        // Else set a timeout of the duration to wait for next iteration
        setTimeout(next, test.repeat.delay);
      },
      (next) => exec(next), done);
    };

    return test;
  },
  injectHook = (suite, fn) => function (done) {
    // Intercept any previous rejection and call done with error
    Chain.interceptReject((err) => done(err));

    // Intercept previous resolve
    Chain.interceptResolve(() => {
      if (isAsyncFunction(fn)) {
        // For an async function the test can only be considered complete when all the
        // handers within the function are also comlete. On resolve on the test wait
        // for the promise chain to also resolve
        fn(...getInjectedArguments(fn, suite))
          .then(() => Chain.promise())
          .then(() => done())
          .catch((err) => done(err));

        return;
      }

      // For a synchronous function we execute the function, to enqueue all
      // the handlers inside the scenario
      const res = fn(...getInjectedArguments(fn, suite));

      Chain.append('test', () => Promise.resolve(res))
        .interceptResolve(() => done())
        .interceptReject((err) => done(err));
    });
  };


module.exports = function Cream(rootSuite) {
  const suites = [rootSuite],
    afterHooks = [],
    afterEachHooks = [];

  let afterHooksAreLoaded = false,
    afterEachHooksAreLoaded = false;

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

    test.file = suite.file; // Tests borrow their file from their suite
    test.tag = `@${test.title.toLowerCase().replace(/\W/g, '')}`;
    test.repeat = { times: 1, delay: 0 };
    test.pauseBeforeStep = false;

    test.getFullTag = () => suite.tag + test.tag;
    test.fullTitle = () => `${suite.title}: ${test.title}`;
    test.getDuration = () => (
      (test.startTime && test.endTime) ? (test.endTime - test.startTime) : 0);


    suite.addTest(injectTest(test));

    if (opts.retries) test.retries(opts.retries);
    if (opts.timeout) test.timeout(opts.timeout);

    test.opts = opts;

    return new ScearioContext(test);
  }

  // Set timeout for the suite
  rootSuite.timeout(0);

  rootSuite.on('pre-require', (context, file, mocha) => {
    const common = MochaCommon([rootSuite], context, mocha);

    context.beforeAll = common.before;
    context.afterAll = common.after;
    context.scenario = addScenario;
    context.run = common.runWithSuite(rootSuite);

    // Feature tag that creates a scenario
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
      suite.tag = `@${suite.title.toLowerCase().replace(/\W/g, '')}`;

      suites.unshift(suite);

      suite.beforeAll('caramel.before', () => {
        Chain.begin();
        event.emit(event.suite.before, suite);
      });
      suite.beforeEach('caramel.beforeEach', () => {
        Chain.begin();
        event.emit(event.test.before, suite && suite.ctx && suite.ctx.currentTest);
      });

      afterHooks.unshift(['caramel.after', () => {
        event.emit(event.suite.after, suite);
        Chain.end();
      }]);
      afterEachHooks.unshift(['caramel.afterEach', () => {
        event.emit(event.test.after, suite && suite.ctx && suite.ctx.currentTest);
        Chain.end();
      }]);

      return new FeatureContext(suite);
    };

    // Setup hook;
    context.setup = function (fn) {
      const suite = suites[0];

      suite.beforeAll(injectHook(suite, fn));
    };

    // Teardown hook;
    context.teardown = function (fn) {
      const suite = suites[0];

      afterHooks.unshift([injectHook(suite, fn)]);
    };

    // Additional modifiers
    context.scenario.only = function only(title, opts, fn) {
      const reString = `^${escapeRe(`${suites[0].title}: ${title}`.replace(/( \| {.+})?$/g, ''))}`;

      mocha.grep(new RegExp(reString));

      return addScenario(title, opts, fn);
    };

    context.scenario.skip = function skip(title) {
      return context.scenario(title, {});
    };


    /* Event Hooks */
    context.beforeAll('caramel:beforeAll', () => {
      Chain.begin();
      event.emit(event.all.before);
    });

    context.afterAll('caramel:afterAll', () => {
      event.emit(event.all.after);
      Chain.end();
    });
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
