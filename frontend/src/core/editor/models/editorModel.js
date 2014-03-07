define(function(require) {
    var Backbone = require('backbone');
    var Origin = require('coreJS/app/origin');

    var EditorModel = Backbone.Model.extend({

      idAttribute: '_id',

      initialize : function(options) {
        this.on('sync', this.loadedData, this);
        this.fetch();
      },
      loadedData: function() {
        if (this.constructor._siblings) {
          this._type = this.constructor._siblings;
        } else {
          this._type = 'course';
        }
        Origin.trigger('editorModel:dataLoaded', this._type);
      },

      getChildren: function() {
        if (Origin.editor[this.constructor._children]) {
          var children = Origin.editor[this.constructor._children].where({_parentId:this.get("_id")});
          var childrenCollection = new Backbone.Collection(children);

          return childrenCollection;          
        } else {
          return null;
        }

      },

      getSiblings: function() {

        var siblings = Origin.editor[this.constructor._siblings].where({_parentId:this.get("_parentId")});
        var siblingsCollection = new Backbone.Collection(siblings);

        return siblingsCollection;
      },

      getPossibleAncestors: function() {
        var map = {
          'articles': {
            'ancestor' : 'contentObjects',
            'ancestorType': 'page' 
          },
          'blocks' : {
            'ancestor' : 'articles',
            'ancestorType' : 'article'
          },
          'components' : {
            'ancestor' : 'blocks',
            'ancestorType' : 'block'            
          }
        };

        ancestors = Origin.editor[map[this.constructor._siblings].ancestor].where({_type: map[this.constructor._siblings].ancestorType});

        var ancestorsCollection = new Backbone.Collection(ancestors);

        return ancestorsCollection;
      },

      serialize: function() {
        return JSON.stringify(this);
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

    return EditorModel;

});
