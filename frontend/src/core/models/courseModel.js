// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var Helpers = require('core/helpers');
  var ContentModel = require('./contentModel');

  var CourseModel = ContentModel.extend({
    urlRoot: '/api/content/course',
    _type: 'course',
    _childTypes: 'contentobject',

    getHeroImageURI: function () {
      if(Helpers.isAssetExternal(this.get('heroImage'))) {
        return this.get('heroImage');
      }
      return '/api/asset/thumb/' + this.get('heroImage');
    },

    isEditable: function () {
      var hasTenantAdminPermission = false;
       if (Origin.permissions.hasTenantAdminPermission()) {
        hasTenantAdminPermission = Origin.sessionModel.get('tenantId') === this.get('_tenantId');
      }
      
      return this.get('_isShared') || this.get('createdBy') == Origin.sessionModel.get('id') || hasTenantAdminPermission;
    },

    getDuplicateURI: function () {
      return '/api/duplicatecourse/' + this.get('_id');
    }
  });

  return CourseModel;
});
