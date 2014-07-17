define(function(require) {
    
    var Origin = require('coreJS/app/origin');
    var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');
    var Backbone = require('backbone');
    var EditorComponentModel = require('editorPage/models/editorComponentModel');

    var EditorComponentListSidebarView = SidebarItemView.extend({

        events: {
            'click .editor-component-list-sidebar-save': 'saveEditing',
            'click .editor-component-list-sidebar-cancel': 'cancelEditing'
        },

        saveEditing: function(event) {
            event.preventDefault();

            if (!this.model.get('component') || !this.model.get('layout')) {
              return;
            }

            var componentType = _.find(Origin.editor.data.componentTypes.models, function(type){
              return type.get('name') == this.model.get('component');
            }, this);

            var _this = this;
            var newComponentModel = new EditorComponentModel();

            newComponentModel.save({
              title: '',
              displayTitle: '',
              body: '',
              _parentId: this.model.get('_parentId'),
              _courseId: Origin.editor.data.course.get('_id'),
              _type: 'component',
              _componentType: componentType.get('_id'),
              _component: componentType.get('component'),
              _layout: this.model.get('layout'),
              version: componentType.get('version')
            },
            {
              error: function() {
                alert('error adding new component');
              },
              success: function() {
                Backbone.history.history.back();
                Origin.trigger('editingOverlay:views:hide');
                Origin.trigger('editorView:fetchData');
              }
            });
        },

        cancelEditing: function(event) {
            event.preventDefault();
            
            Origin.trigger('editingOverlay:views:hide');
        }

    }, {
        template: 'editorComponentListSidebar'
    });

    return EditorComponentListSidebarView;

});