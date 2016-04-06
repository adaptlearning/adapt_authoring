// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Adapt Output plugin
 */
var OutputPlugin = require('../../../lib/outputmanager').OutputPlugin;
var util = require('util');

// exported functions
var Publish = require('./publish');
var Import = require('./import');
var Export = require('./export');

function AdaptOutput() {
}
util.inherits(AdaptOutput, OutputPlugin);

AdaptOutput.prototype.publish = Publish;
AdaptOutput.prototype.export = Export;
AdaptOutput.prototype.import = Import;

/**
 * Module exports
 */
exports = module.exports = AdaptOutput;
