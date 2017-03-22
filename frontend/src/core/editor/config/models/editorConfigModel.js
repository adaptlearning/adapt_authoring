// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var EditorModel = require('../../global/models/editorModel');

  var EditorConfigModel = EditorModel.extend({
    _type: 'config',
    _parent: 'course',
    _siblings: '',
    _children: '',

    sync: function(method, model, options) {
      options = options || {};

      switch (method.toLowerCase()) {
        case 'read':
          options.url = '/api/content/config/' + this.get('_courseId');
          break;
        case 'update':
        case 'patch':
          options.url = '/api/content/config/' + this.get('_id');
          break;
      }

      return Backbone.sync.apply(this, arguments);
    }
  });

  return EditorConfigModel;
});
