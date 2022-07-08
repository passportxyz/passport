const debug = require('debug')('engine:ceramic')
const A = require('async')
const { DID } = require("dids");
const { Ed25519Provider } = require("key-did-provider-ed25519");
const { getResolver } = require("key-did-resolver");
const { CeramicDatabase } = require("../src");
const testnetAliases = require("../integration-tests/integration-test-model-aliases.json");

function CeramicEngine(script, ee, helpers) {
  this.script = script;
  this.ee = ee;
  this.helpers = helpers;
}

CeramicEngine.prototype.createScenario = function createScenario(scenarioSpec, ee) {
  const tasks = scenarioSpec.flow.map(rs => this.step(rs, ee));

  return this.compile(tasks, scenarioSpec.flow, ee);
}

CeramicEngine.prototype.step = function step(rs, ee) {
  const self = this;

  if (rs.aCeramicOperation) {
    return function aCeramicOperation(context, callback) {
      debug(`aCeramicOperation with seed: ${ context.didSeed }`)
      process.nextTick(function () {
        debug(`aCeramicOperation nextTick`)
        callback(null, context);
      })
    }
  }

  return function (context, callback) {
    return callback(null, context)
  }
}

CeramicEngine.prototype.compile = function compile(tasks, scenarioSpec, ee) {
  const self = this;

  return function scenario(initialContext, callback) {
    const init = function init(next) {
      ee.emit('started')
      const TEST_SEED = Uint8Array.from({length: 32}, () => Math.floor(Math.random() * 256));

      // Create and authenticate the DID
      testDID = new DID({
        provider: new Ed25519Provider(TEST_SEED),
        resolver: getResolver(),
      });

      testDID.authenticate().then(() => {
        debug('DID authenticated')
        initialContext.ceramicDatabase = new CeramicDatabase(testDID, process.env.CERAMIC_CLIENT_URL, testnetAliases);
        return next(null, initialContext)
      }).catch((err) => debug(err));
    }

    let steps = [init].concat(tasks)

    A.waterfall(
      steps,
      function done(err, context) {
        if (err) {
          debug(err);
        }

        return callback(err, context);
      });
  }
}

module.exports = CeramicEngine;
