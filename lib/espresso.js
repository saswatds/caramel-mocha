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
      if (!(helper.actions)) {
        throw new Error(`${helper.constructor.name} does not extent Caramel<Helper>`);
      }

      const actions = helper.actions();

      // Iterate through all the actions create a step-able action
      Object.getOwnPropertyNames(actions)
        .forEach((action) => {
          // Create a chained function to handle the steps promises
          obj[action] = function WrappedAction() {
            const step = new Step(actions, action);

            event.emit(event.step.before, step);

            const output = Chain
              .append('step', () => step.run(arguments))
              .interceptResolve((val) => {
                event.emit(event.step.passed, step, val);
                event.emit(event.step.finished, step);
              })
              .interceptReject(() => {
                event.emit(event.step.failed, step);
                event.emit(event.step.finished, step);
              }, false) // Do not terminate and propagate the error
              .promise();

            event.emit(event.step.after, step);

            return output;
          };
        });
    });

  // Return the created object
  return obj;
};
