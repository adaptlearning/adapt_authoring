// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var Helpers = require('core/helpers');

  var ContentCollection = Backbone.Collection.extend({
    initialize : function(models, options) {
      this._type = options._type;
      this.model = Helpers.contentModelMap(this._type);
      this._courseId = options._courseId;
      this._parentId = options._parentId;
      this.url = options.url || 'api/content/' + options._type + this.buildQuery();

      this.on('reset', this.loadedData, this);
    },

    buildQuery: function() {
      var query = '';
      if(this._courseId) {
        query += '_courseId=' + this._courseId
      }
      if(this._parentId) {
        query += '_parentId=' + this._parentId
      }
      return query ? '?' + query : '';
    },

    loadedData: function() {
      Origin.trigger('contentCollection:dataLoaded', this._type);
    }
  });

  return ContentCollection;
});
