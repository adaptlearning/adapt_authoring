define(function(require) {

  var Origin = require('coreJS/app/origin');
  var EditorModel = require('coreJS/editor/models/editorModel');

  var EditorConfigModel = EditorModel.extend({
    urlRoot: '/api/content/config',
    
    initialize : function(options) {
      this.on('sync', this.loadedData, this);

      if (options && options.courseId) {
        this.url = '/api/content/config?_courseId=' + options.courseId;
      }
      this.fetch();
    },

    loadedData: function() {
      if (this.constructor._siblings) {
        this._type = this.constructor._siblings;
      } else {
        this._type = 'config';
      }
      Origin.trigger('editorModel:dataLoaded', this._type);
    },
  },
  {
    _parent: 'course',
    _siblings:'',
    _children: ''
  });

  return EditorConfigModel;

});
