const Caramel = require('../index'),
  caramel = new Caramel(),
  { Helper } = Caramel;


class Tools extends Helper {
  async beforeAll() {
    return new Promise((r) => {
      setTimeout(() => {
        r();
      }, 2000);
    });
  }

  async $pause() {
    return new Promise((r) => {
      setTimeout(() => {
        r();
      }, 2000);
    });
  }

  async $something() {
    return new Promise((r) => {
      setTimeout(() => { r(2); }, 1000);
    });
  }
}

caramel.loadFiles('tests/workflows/**/*.flow.js');
caramel.addHelper(new Tools());
caramel.run();
