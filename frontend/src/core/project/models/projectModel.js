// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var EditorModel = require('editorGlobal/models/editorModel');
  var Helpers = require('coreJS/app/helpers');
  var Origin = require('coreJS/app/origin');

  var ProjectModel = EditorModel.extend({
    idAttribute: '_id',
    urlRoot: '/api/content/course',
    defaults: {
      'tags': [],
      _type: 'course',
      customStyle: ''
    },

    initialize : function(options) {
    },

    getHeroImageURI: function () {
      if(Helpers.isAssetExternal(this.get('heroImage'))) {
        return this.get('heroImage');
      } else {
        return '/api/asset/thumb/' + this.get('heroImage');
      }
    },

    isEditable: function () {
      return this.get('_isShared') || this.get('createdBy') == Origin.sessionModel.get('id')
    },

    getDuplicateURI: function () {
      return '/api/duplicatecourse/' + this.get('_id');
    }
  });

  return ProjectModel;
});
