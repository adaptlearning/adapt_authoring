// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');

  var ContentModel = Backbone.Model.extend({
    idAttribute: '_id',
    whitelistAttributes: null,

    initialize: function(options) {
      this.on('sync', this.loadedData, this);
      this.on('change', this.loadedData, this);
      this.fetch();
    },

    loadedData: function() {
      if (this._siblings) {
        this._type = this._siblings;
      }
      Origin.trigger('editorModel:dataLoaded', this._type, this.get('_id'));
    },

    getChildren: function() {
      var self = this;
      var getChildrenDelegate = function(type) {
        if (Origin.editor.data[type]) {
          var children = Origin.editor.data[type].where({ _parentId: self.get('_id') });
          var childrenCollection = new Backbone.Collection(children);
          return childrenCollection;
        }
        return null;
      };
      if(_.isArray(this._children)) {
        var allChildren;
        for(var i = 0, count = this._children.length; i < count; i++) {
          var children = getChildrenDelegate(this._children[i]);
          if(children) {
            if(!allChildren) allChildren = children;
            else allChildren.add(children.models);
          }
        }
        return allChildren;
      } else {
        return getChildrenDelegate(this._children);
      }
    },

    getParent: function() {
      var currentType = this.get('_type');
      var parent;
      var currentParentId = this.get('_parentId');

      if (currentType === 'menu' || currentType === 'page') {
        if (currentParentId === Origin.editor.data.course.get('_id')) {
          parent = Origin.editor.data.course;
        } else {
          parent = Origin.editor.data.contentObjects.findWhere({ _id: currentParentId });
        }
      } else if (currentType != 'course'){
        parent = Origin.editor.data[this._parent].findWhere({ _id: currentParentId });
      }

      return parent;
    },

    getSiblings: function(returnMyself) {
      if (returnMyself) {
        var siblings = Origin.editor.data[this._siblings].where({ _parentId: this.get('_parentId') });
        return new Backbone.Collection(siblings);
      }
      var siblings = _.reject(Origin.editor.data[this._siblings].where({
        _parentId: this.get('_parentId')
      }), _.bind(function(model){
        return model.get('_id') == this.get('_id');
      }, this));

      return new Backbone.Collection(siblings);
    },

    setOnChildren: function(key, value, options) {
      var args = arguments;

      if(!this._children) return;

      this.getChildren().each(function(child){
        child.setOnChildren.apply(child, args);
      });
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
    },

    serializeChildren: function() {
      var children = this.getChildren();
      var serializedJson = '';

      if (children) {
        _.each(children.models, function(child) {
          serializedJson += child.serialize();
        });
      }

      return serializedJson;
    }
  });

  return ContentModel;
});
