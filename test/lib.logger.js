var logger = require('../lib/logger');

describe('logger', function() {
  before(function() {
    var winston = require('winston');
    logger.add(winston.transports.Memory);
  });

  it ('should allow me to log messages of valid type', function(done) {
    logger.once('logging', function (transport, level, msg, meta){
      if ('error' === level && 'test' === msg && 'bar' === meta.foo) {
        done();
      } else {
        throw new Error('Log failed to raise event correctly');
      }
    });

    logger.log('error', 'test', { foo: 'bar' });
  });

  it ('should gracefully handle log messages of invalid type', function(done) {
    logger.once('logging', function (transport, level, msg, meta){
      if ('info' === level && 'test' === msg && 'bar' === meta.foo) {
        done();
      } else {
        throw new Error('Log failed to raise event correctly');
      }
    });

    logger.log('skippitydoodaa', 'test', { foo: 'bar' });
  });

});
