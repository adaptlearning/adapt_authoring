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
        
        var children = Origin.editor[this.constructor._children].where({_parentId:this.get("_id")});
        var childrenCollection = new Backbone.Collection(children);
        // returns a collection of children
        return childrenCollection;
      },

      getParent: function() {
        var currentType = this.get('_type');
        var parent;
        var currentParentId = this.get('_parentId');

        if (currentType === 'menu' || currentType === 'page') {
          if (currentParentId === Origin.editor.course.get('_id')) {
            parent = Origin.editor.course;
          } else {
            parent = Origin.editor.contentObjects.findWhere({_id: currentParentId});
          }
        } else if (currentType != 'course'){
          parent = Origin.editor[this.constructor._parent].findWhere({_id: currentParentId});
        }

        return parent;

      }
    });

    return EditorModel;

});
