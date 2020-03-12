const Espresso = require('./espresso');


const objects = {},
  helpers = new Proxy({}, {
  // Trap for in operator
    has(target, key) {
      return key in target;
    },

    // Trap for Object.key handling
    ownKeys(target) {
      return Reflect.ownKeys(target);
    },

    get(target, key) {
      // If key present in target then just return that
      if (key in target) {
        return target[key];
      }

      // If key present in objects but not present in config then
      // load from object. This also give a opportunity to override
      // default objects
      if (key in objects && !(key in target)) {
        target[key] = objects[key];

        return target[key];
      }

      // We could not find the module hence just return a empty function
      return (function EmptyFn() {});
    },
  });

module.exports = {
  helpers,
  updateHelpers: (_helpers) => {
    objects.I = Espresso(_helpers);
  },
};
