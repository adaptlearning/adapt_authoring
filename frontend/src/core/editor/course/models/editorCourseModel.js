// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var EditorModel = require('../../global/models/editorModel');

  var EditorCourseModel = EditorModel.extend({
    urlRoot: '/api/content/course',
    _type: 'course',
    _siblings: '',
    _children: 'contentObjects',

    initialize : function(options) {
    },

    getHeroImageURI: function () {
      if(Helpers.isAssetExternal(this.get('heroImage'))) {
        return this.get('heroImage');
      }
      return '/api/asset/serve/' + this.get('heroImage');
    },

    isEditable: function () {
      return this.get('_isShared') || this.get('createdBy') == Origin.sessionModel.get('id');
    },

    getDuplicateURI: function () {
      return '/api/duplicatecourse/' + this.get('_id');
    }
  });

  return EditorCourseModel;
});
