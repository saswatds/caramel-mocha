const Chain = require('./internals/chain'),
  event = require('./internals/events');

class Step {
  constructor(actions, action) {
    this.actions = actions;
    this.name = action;
    this.actionMethod = actions[action];

    this.stack = '';
    Error.captureStackTrace(this);
  }

  run(args) {
    return this.actionMethod(...args);
  }
}

module.exports = function espresso(helpers) {
  const obj = {};

  // Iterate though each of the helpers. There can be multiple of them
  // Like, Webdriver, App, etc
  Object.keys(helpers)
    .map((key) => helpers[key])
    .forEach((helper) => {
      const actions = helper.actions();

      // Iterate through all the actions create a step-able action
      Object.getOwnPropertyNames(actions)
        .forEach((action) => {
          // Create a chained function to handle the steps promises
          obj[action] = function WrappedAction() {
            const step = new Step(actions, action);

            event.emit(event.step.before, step);

            Chain
              .append(step.run(arguments))
              .interceptResolve((val) => {
                event.emit(event.step.passed, step, val);
                event.emit(event.step.finished, step);
              })
              .interceptReject(() => {
                event.emit(event.step.failed, step);
                event.emit(event.step.finished, step);
              }, false); // Do not terminate and propagate the error

            event.emit(event.step.after, step);

            return Chain.promise();
          };
        });
    });

  // Return the created object
  return obj;
};
