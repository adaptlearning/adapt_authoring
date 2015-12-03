// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var EditorModel = require('editorGlobal/models/editorModel');
  var EditorConfigModel = EditorModel.extend({

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
    },

    _siblings: '',
    _children: '',
    _parent: 'course',
    _type: 'config'
  });

  return EditorConfigModel;
});