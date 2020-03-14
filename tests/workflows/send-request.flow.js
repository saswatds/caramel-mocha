feature('Feature 1').tag('abc');

setup((I) => {
  I.pause(1);
});

scenario('Scenario 1', (I) => {
  I.pause(2);
  I.pause(3, 4);
}).debug();

scenario('Scenario 2', (I) => {
  I.pause();
});
