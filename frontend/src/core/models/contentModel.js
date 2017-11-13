// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');

  var Origin = require('core/origin');
  var Helpers = require('core/helpers');
  var ContentCollection = require('core/collections/contentCollection');

  var ContentModel = Backbone.Model.extend({
    idAttribute: '_id',
    whitelistAttributes: null,
    children: undefined,

    initialize: function(options) {
      this.initialiseChildren();

      this.on('sync', this.loadedData, this);
      this.on('change', this.loadedData, this);
      this.fetch();
    },

    fetch: function() {
      // console.log('ContentModel.fetch', this.get("_id"));
      Backbone.Model.prototype.fetch.apply(this, arguments);
    },

    loadedData: function() {
      if(this._siblingTypes) {
        this._type = this._siblingTypes;
      }
    },

    initialiseChildren: function() {
      if(!this._childTypes) {
        return;
      }
      this.children = {};
      var childTypes = _.isArray(this._childTypes) ? this._childTypes : [this._childTypes];
      for(var i = 0, count = childTypes.length; i < count; i++) {
        var childType = childTypes[i];
        this.children[childType] = new ContentCollection(null, {
          _type: childType,
          _parentId: this.get('_id')
        });
      }
    },

    fetchChildren: function(callback) {
      var childTypes = _.isArray(this._childTypes) ? this._childTypes : [this._childTypes];
      var done = 0;
      for(var i = 0, count = childTypes.length; i < count; i++) {
        var childType = childTypes[i];
        this.children[childType].fetch({
          success: function(collection) {
            if(++done === childTypes.length) callback(collection);
          },
          error: function(collecion, response) {
            console.error(response.responseJSON.message);
          }
        });
      }
    },

    getChildren: function(callback) {
      var children = new Backbone.Collection();
      var childTypes = _.isArray(this._childTypes) ? this._childTypes : [this._childTypes];
      for(var i = 0, count = childTypes.length; i < count; i++) {
        var childType = childTypes[i];
        children.add(this.children[childType].models);
      }
      return children;
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
        success: callback,
        error: function(jqXHR) {
          console.error(jqXHR);
          callback();
        }
      });
    },

    getSiblings: function(returnMyself) {
      if (returnMyself) {
        var siblings = Origin.editor.data[this._siblingTypes].where({ _parentId: this.get('_parentId') });
        return new Backbone.Collection(siblings);
      }
      var siblings = _.reject(Origin.editor.data[this._siblingTypes].where({
        _parentId: this.get('_parentId')
      }), _.bind(function(model){
        return model.get('_id') == this.get('_id');
      }, this));

      return new Backbone.Collection(siblings);
    },

    getPossibleAncestors: function() {
      var map = {
        'contentObjects': { 'ancestorType': 'page' },
        'articles': { 'ancestorType': 'article' },
        'blocks': { 'ancestorType': 'block' }
      };
      ancestors = Origin.editor.data[this._parent].where({ _type: map[this._parent].ancestorType });
      return new Backbone.Collection(ancestors);
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
