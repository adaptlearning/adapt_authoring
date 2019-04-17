// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ContentModel = require('./contentModel');

  var ConfigModel = ContentModel.extend({
    _type: 'config',
    _parent: 'course',

    sync: function(method, model, options) {
      options = options || {};

      switch (method.toLowerCase()) {
        case 'read':
          options.url = 'api/content/config/' + this.get('_courseId');
          break;
        case 'update':
        case 'patch':
          options.url = 'api/content/config/' + this.get('_id');
          break;
      }

      return Backbone.sync.apply(this, arguments);
    }
  });

  return ConfigModel;
});
