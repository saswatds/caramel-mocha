const Espresso = require('./espresso');

// TODO: Handle resolve loading modules
function resolveLoad() {
  return {};
}


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

      // It tries to load the config modules by resolving them
      const object = resolveLoad(key);

      // check that object is a real object and not an array
      if (Object.prototype.toString.call(object) === '[object Object]') {
        target[key] = Object.assign(objects[key], object);
      } else {
        target[key] = object;
      }

      return target[key];
    },
  });

module.exports = {
  helpers,
  updateHelpers: (_helpers) => {
    objects.I = Espresso(_helpers);
  },
};
