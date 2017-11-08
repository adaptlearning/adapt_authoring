// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Backbone = require('backbone');
  var BackboneForms = require('backbone-forms');
  var Origin = require('core/origin');
  var Helpers = require('core/helpers');
  var UserCollection = require('modules/userManagement/collections/userCollection');

  var ScaffoldTenantUsersView = Backbone.Form.editors.Select.extend({

    initialize: function(options) {
      options.schema.options = new UserCollection();
      Backbone.Form.editors.Select.prototype.initialize.call(this, options);
    },

    /**
     * Sets the options that populate the <select>
     *
     * @param {Mixed} options
     */
    setOptions: function(options) {
      var self = this;
      options.fetch({
        url: 'api/user/tenant',
        data: $.param({
          _tenantId: Origin.sessionModel.get('tenantId')
        }),
        success: function(collection) {
          Backbone.Form.editors.Select.prototype.setOptions.call(self, collection);
        }
      });
    },

    /**
     * Transforms a collection into HTML ready to use in the renderOptions method
     * @param {Backbone.Collection}
     * @return {String}
     */
    _collectionToHtml: function(collection) {
      // Convert collection to array first
      var array = [];

      collection.each(function(model) {
        array.push({ val: model.id, label: model.attributes.email });
      });

      // Now convert to HTML
      var html = this._arrayToHtml(array);

      return html;
    }
  });

  Origin.on('app:dataReady', function() {
    // Add Image editor to the list of editors
    Origin.scaffold.addCustomField('TenantUsers', ScaffoldTenantUsersView);
  });


  return ScaffoldTenantUsersView;

});