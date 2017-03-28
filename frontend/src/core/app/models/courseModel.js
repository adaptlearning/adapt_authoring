// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/app/origin');
  var Helpers = require('core/app/helpers');
  var ContentModel = require('./contentModel');

  var CourseModel = ContentModel.extend({
    urlRoot: '/api/content/course',
    _type: 'course',
    _children: 'contentObjects',

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
      return this.get('_isShared') || this.get('createdBy') == Origin.sessionModel.get('id');
    },

    getDuplicateURI: function () {
      return '/api/duplicatecourse/' + this.get('_id');
    }
  });

  return CourseModel;
});
