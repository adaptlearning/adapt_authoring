var should = require('should');

var logger = require('../lib/logger');

before(function() {
  var winston = require('winston');
  logger.add(winston.transports.Memory);
});

it('should be able to log messages of valid type', function(done) {
  logger.once('logging', function (transport, level, msg, meta) {
    var isValid = 'error' === level && -1 !== msg.indexOf('test') && 'bar' === meta.foo;
    isValid.should.equal(true, 'Log failed to raise event correctly');
    done();
  });
  logger.log('error', 'test', { foo: 'bar' });
});

it('should gracefully handle log messages of invalid type', function(done) {
  logger.once('logging', function (transport, level, msg, meta) {
    var isValid = 'info' === level && -1 !== msg.indexOf('test') && 'bar' === meta.foo;
    isValid.should.equal(true, 'Log failed to raise event correctly');
    done();
  });
  logger.log('skippitydoodaa', 'test', { foo: 'bar' });
});
