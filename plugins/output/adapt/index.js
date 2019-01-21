// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
const OutputPlugin = require('../../../lib/outputmanager').OutputPlugin;
const util = require('util');

/**
 * Adapt Output plugin
 */
function AdaptOutput() {
}
util.inherits(AdaptOutput, OutputPlugin);

AdaptOutput.prototype.publish = require('./publish');
AdaptOutput.prototype.importsource = require('./importsource');
AdaptOutput.prototype.export = require('./export');

exports = module.exports = AdaptOutput;
