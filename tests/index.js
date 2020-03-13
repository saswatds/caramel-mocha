const Caramel = require('../index'),
  caramel = new Caramel(),
  { Helper } = Caramel;


class Tools extends Helper {
  after(test) {
    console.log(test.getDuration());
    console.log(test.duration);
  }

  async beforeAll() {
    return new Promise((r, j) => {
      setTimeout(() => {
        console.log('beforeAll');
        r();
      }, 2000);
    });
  }

  async $pause(ctx) {
    console.log(ctx.getFullTag());

    return new Promise((r, j) => {
      setTimeout(() => {
        console.log('pause');

        r();
      }, 2000);
    });
  }

  async $something() {
    return new Promise((r, j) => {
      setTimeout(() => { r(2); }, 1000);
    });
  }
}

caramel.loadFiles('tests/workflows/**/*.flow.js');
caramel.addHelper(new Tools());
caramel.run();
