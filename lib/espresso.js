const prompt = require('prompt'),
  Chain = require('./internals/chain'),
  event = require('./internals/events');

class Step {
  constructor(ctx, actions, action, args) {
    this.ctx = ctx;
    this.name = action;
    this.actionMethod = actions[action];
    this.args = args;

    this.stack = '';
    Error.captureStackTrace(this);
  }

  toString() {
    return `${this.name} (${[...this.args].join(', ')})`;
  }

  run() {
    event.emit(event.step.started, this);
    return this.actionMethod(this.ctx, ...this.args);
  }
}

module.exports = function espresso(helpers) {
  return function Injector(ctx) {
    const obj = {};

    // Iterate though each of the helpers. There can be multiple of them
    // Like, Webdriver, App, etc
    Object.keys(helpers)
      .map((key) => helpers[key])
      .forEach((helper) => {
        if (!(helper.actions)) {
          throw new Error(`${helper.constructor.name} does not extent Caramel<Helper>`);
        }

        const actions = helper.actions();

        // Iterate through all the actions create a step-able action
        Object.getOwnPropertyNames(actions)
          .forEach((action) => {
          // Create a chained function to handle the steps promises
            obj[action] = function WrappedAction() {
              const step = new Step(ctx, actions, action, arguments);

              if (ctx.pauseBeforeStep) {
                Chain.append('pause', () => {
                  prompt.start({ message: 'next >', memory: 0, delimiter: ' ' });

                  return new Promise((resolve, reject) => {
                    prompt.confirm(`${step.toString()}`, (err) => {
                      if (err) { return reject(err); }

                      prompt.pause();

                      resolve();
                    });
                  });
                });
              }

              const output = Chain
                .append('step', () => step.run())
                .interceptResolve((val) => {
                  event.emit(event.step.passed, step, val);
                  event.emit(event.step.finished, step);
                })
                .interceptReject((err) => {
                  event.emit(event.step.failed, step, err);
                  event.emit(event.step.finished, step);
                }, false) // Do not terminate and propagate the error
                .promise();

              return output;
            };
          });
      });

    // Return the created object
    return obj;
  };
};
