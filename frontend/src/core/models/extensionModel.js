// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ContentModel = require('./contentModel');

  var ExtensionModel = ContentModel.extend({
    urlRoot: '/api/extensiontype',
    idAttribute: '_id',
    _type: 'extension'
  });

  return ExtensionModel;
});
