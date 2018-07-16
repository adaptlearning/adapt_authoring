// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var Helpers = require('core/helpers');
  var ContentCollection = require('core/collections/contentCollection');

  var ContentModel = Backbone.Model.extend({
    idAttribute: '_id',
    whitelistAttributes: null,

    initialize: function(options) {
      this.on('sync', this.loadedData, this);
      this.on('change', this.loadedData, this);
    },

    loadedData: function() {
      if(this._siblingTypes) this._type = this._siblingTypes;
    },

    fetchChildren: function(callback) {
      var childTypes = _.isArray(this._childTypes) ? this._childTypes : [this._childTypes];
      // has to be a plain old array because we may have multiple model types
      var children = [];
      Helpers.forParallelAsync(childTypes, _.bind(function(childType, index, done) {
        (new ContentCollection(null, {
          _type: childType,
          _parentId: this.get('_id')
        })).fetch({
          success: function(collection) {
            children = children.concat(collection.models);
            done();
          },
          error: function(collecion, response) {
            Origin.Notify.alert({
              type: 'error',
              text: 'app.errorfetchingdata'
            });
          }
        });
      }, this), function() {
        callback(children);
      });
    },

    fetchParent: function(callback) {
      if(!this._parentType || !this.get('_parentId')) {
        return callback();
      }
      if(this.get('_parentId') === Origin.editor.data.course.get('_id')) {
        return callback(Origin.editor.data.course);
      }
      // create model instance using _parentType and _parentId
      var modelClass = Helpers.contentModelMap(this._parentType);
      var model = new modelClass({ _id: this.get('_parentId') });
      model.fetch({
        success: _.bind(callback, this),
        error: _.bind(function(jqXHR) {
          Origin.Notify.alert({
            type: 'error',
            text: 'app.errorfetchingdata'
          });
          callback.call(this);
        }, this)
      });
    },

    fetchSiblings: function(callback) {
      var siblings = new ContentCollection(null, {
        _type: this._siblingTypes,
        _parentId: this.get('_parentId')
      });
      siblings.fetch({
        success: _.bind(function(collection) {
          collection.remove(this);
          callback(collection);
        }, this),
        error: _.bind(function(jqXHR) {
          Origin.Notify.alert({
            type: 'error',
            text: 'app.errorfetchingdata'
          });
          callback.call(this);
        }, this)
      });
    },

    serialize: function() {
      return JSON.stringify(this);
    },

    // Remove any attributes which are not on the whitelist (called before a save)
    pruneAttributes: function() {
      var self = this;
      // Ensure that only valid attributes are pushed back on the save
      if (self.whitelistAttributes) {
        _.each(_.keys(self.attributes), function(key) {
          if (!_.contains(self.whitelistAttributes, key)) {
            self.unset(key);
          }
        });
      }
    }
  });

  return ContentModel;
});
