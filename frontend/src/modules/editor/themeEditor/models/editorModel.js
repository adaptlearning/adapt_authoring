// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
    var Backbone = require('backbone');
    var Origin = require('core/origin');

    var EditorModel = Backbone.Model.extend({
      idAttribute: '_id',
      whitelistAttributes: null,
      _type: 'theme',

      initialize : function() {
        this.on('sync change', this.loadedData, this);
        this.fetch();
      },

      loadedData: function() {
        if (this._siblings) {
          this._type = this._siblings;
        }
        Origin.trigger('editorModel:dataLoaded', this._type);
      },

      getChildren: function() {
        var children = Origin.editor.data[this._children] || null;

        return children && new Backbone.Collection(children.where({
          _parentId: this.get("_id")
        }));
      },

      getParent: function() {
        var currentParentId = this.get('_parentId');
        var data = Origin.editor.data;
        var course = data.course;

        switch (this.get('_type')) {
          case 'course':
            return;
          case 'menu':
          case 'page':
            return currentParentId === course.get('_id') ?
                course :
                data.contentObjects.findWhere({ _id: currentParentId });
          default:
            return data[this._parent].findWhere({ _id: currentParentId });
        }
      },

      getSiblings: function(shouldIncludeSelf) {
        var siblings = Origin.editor.data[this._siblings].where({
          _parentId: this.get('_parentId')
        });

        if (!shouldIncludeSelf) {
          siblings = siblings.filter(function(model) {
            return model.get('_id') !== this.get('id');
          }, this);
        }

        return new Backbone.Collection(siblings);
      },

      setOnChildren: function(key, value, options) {           
        var args = arguments;
        
        if (!this._children) return;
        
        this.getChildren().each(function(child) {
            child.setOnChildren.apply(child, args);
        });
      },

      getPossibleAncestors: function() {
        var map = {
          'contentObjects': {
            'ancestorType': 'page' 
          },
          'articles': {
            'ancestorType': 'article'
          },
          'blocks': {
            'ancestorType': 'block'
          }
        };
        ancestors = Origin.editor.data[this._parent].where({_type: map[this._parent].ancestorType});
        var ancestorsCollection = new Backbone.Collection(ancestors);
        return ancestorsCollection;
      },

      serialize: function() {
        return JSON.stringify(this);
      },

      // Remove any attributes which are not on the whitelist
      // Useful to call before a save()
      pruneAttributes: function() {
        if (!this.whitelistAttributes) return;

        // Ensure that only valid attributes are pushed back on the save
        Object.keys(this.attributes).forEach(function(key) {
          if (!_.contains(this.whitelistAttributes, key)) {
            this.unset(key);
          }
        }, this);
      },

      serializeChildren: function() {
        var children = this.getChildren();
        var serializedJson = '';

        if (children) {
          children.models.forEach(function(child) {
            serializedJson += child.serialize();
          });  
        }

        return serializedJson;
      }
      
    });

    return EditorModel;

});
