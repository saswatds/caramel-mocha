const PromiseRetry = require('promise-retry');

const defaultRetryOptions = {
  retries: 0,
  minTimeout: 150,
  maxTimeout: 10000,
};
/**
 * A singleton chaining class to maintain a promise chain
 */
class Chain {
  constructor() {
    // Start by creating a head which has an already resolved promise
    this.head = Promise.resolve();

    this.terminated = false;
  }

  promise() {
    return this.head;
  }

  begin() {
    // Create a new head if chain has been terminated
    if (this.terminated) {
      this.head = Promise.resolve();
      this.terminated = false;
    }

    return this;
  }

  end() {
    this.terminate = true;

    return this;
  }

  /**
   *
   * @param {Function} fn - A function that results a promise to append to the chain
   * @param {*} force - Add the promise forcefully even if chain in not present
   * @param {*} retry - Retry this promise if fails
   */
  append(name, fn, force = false, retry = false) {
    // If there was no active promise chain then return nothing
    if (this.terminated && !force) {
      return this;
    }

    // At this point we do not know if the head is a promise or just a value
    // Promise.resolving to get a promise. This will handle any thenable chains
    // Note: Appending to the chain ignores resolved values of previous promises
    this.head = (this.head).then(() => {
      // If retry is disabled then just return the promise or function using a thenable
      if (!retry) {
        return fn();
      }

      // We now have a retry-able promise in out hand
      return PromiseRetry(defaultRetryOptions, (_retry, number) => {
        if (number > 1) { console.info(`Retrying... Attempt #${number}`); }

        return fn().catch(_retry);
      });
    });

    return this;
  }

  /**
   * An interctor that call the given function when the head promise is resolved
   * @param {Function} fn
   */
  interceptResolve(fn) {
    // If there was no active promise chain then return nothing
    if (this.terminated) {
      return this;
    }

    // Intercept the head promise resolution and inject a custom function call
    this.head = (this.head).then((input) => {
      try {
        fn(input);
      } catch (_) {
        // We will ignore any errors originating from calling the intercep
      }

      return input;
    });

    return this;
  }

  /**
   * An interctor that call the given function when the head promise is rejected
   * @param {Function} fn
   * @param {Boolean} propagate Should the intercepted error be propagated
   */
  interceptReject(fn, terminate = true) {
    if (this.terminated) {
      return this;
    }

    this.head = (this.head).catch((err) => {
      try {
        fn(err);
      } catch (_) {
        // We will ignore any error originating from calling the intercept
      }

      // Terminate the chain according to user demand
      this.terminated = terminate;

      // Propagate the error in the chain if terminate is false and propagate is true
      return (!terminate) ? Promise.reject(err) : Promise.resolve();
    });

    return this;
  }
}

module.exports = new Chain();
