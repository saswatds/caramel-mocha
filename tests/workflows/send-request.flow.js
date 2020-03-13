feature('Feature 1').tag('abc');

scenario('Scenario 1', (I) => {
  I.pause();
  I.pause();
}).repeat(3).paused();


scenario('Scenario 2', (I) => {
  I.pause();
  I.pause();
}).repeat(3).paused();
