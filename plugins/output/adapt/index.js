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

// TODO should these go in OutputManager.Constants?
var Constants = {
  Filenames: {
    Bower: 'bower.json',
    Metadata: 'metadata.json',
    Package: 'package.json'
  },
  Folders: {
    Plugins: 'plugins',
    Assets: 'assets'
  }
};

function AdaptOutput() {
}
util.inherits(AdaptOutput, OutputPlugin);

AdaptOutput.prototype.Constants = Constants;
AdaptOutput.prototype.publish = Publish;
AdaptOutput.prototype.export = Export;
AdaptOutput.prototype.import = Import;

/**
 * Module exports
 */
exports = module.exports = AdaptOutput;
