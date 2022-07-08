'use strict';

const test = require('tape')
const EventEmitter = require('events')
const CeramicEngine = require('..')

const script = {
  config: {
    target: 'my_awesome_stream',
  },
  scenarios: [{
    name: 'Ceramic Hello World',
    engine: 'ceramic',
    flow: [
      {
        aCeramicOperation: 45
      }
    ]
  }]
};


test('Engine interface', function(t) {
  const events = new EventEmitter();
  const engine = new CeramicEngine(script, events, {});
  const scenario = engine.createScenario(script.scenarios[0], events);

  t.assert(engine, 'Can construct an engine');
  t.assert(typeof scenario === 'function', 'Can create a scenario');
  t.end();
})
