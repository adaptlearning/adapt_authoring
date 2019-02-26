var should = require('should');

var logger = require('../lib/logger');

before(function() {
  var winston = require('winston');
  logger.add(new winston.transports.Console({
    silent: true
  }));
});

it('should be able to log messages of valid type', function(done) {
  logger.once('data', function (transport) {
    var isValid = 'error' === transport.level && -1 !== transport.message.indexOf('test') && 'bar' === transport.foo;
    isValid.should.equal(true, 'Log failed to raise event correctly');
    done();
  });
  logger.log('error', 'test', { foo: 'bar' });
});

it('should gracefully handle log messages of invalid type', function(done) {
  logger.once('data', function (transport) {
    var isValid = 'info' === transport.level && -1 !== transport.message.indexOf('test') && 'bar' === transport.foo;
    isValid.should.equal(true, 'Log failed to raise event correctly');
    done();
  });
  logger.log('skippitydoodaa', 'test', { foo: 'bar' });
});
