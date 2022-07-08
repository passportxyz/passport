const debug = require('debug')('engine:ceramic')
const A = require('async')

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
      debug(`aCeramicOperation with context: ${ context }`)
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
      return next(null, initialContext)
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
