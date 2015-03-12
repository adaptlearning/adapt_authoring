// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Backbone = require('backbone');
  var ExtensionModel = require('editorExtensions/models/extensionModel');

  var ExtensionCollection = Backbone.Collection.extend({

    model: ExtensionModel,

    url: 'api/extensiontype',

    comparator: function(model) {
      return model.get('displayName');
    }

  });

  return ExtensionCollection;

});
