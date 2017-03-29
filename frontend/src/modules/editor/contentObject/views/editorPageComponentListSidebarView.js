// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');

  var ComponentModel = require('core/models/componentModel');
  var SidebarItemView = require('modules/sidebar/views/sidebarItemView');

  var EditorPageComponentListSidebarView = SidebarItemView.extend({
    events: {
      'click .editor-component-list-sidebar-save': 'onSaveClicked',
      'click .editor-component-list-sidebar-save-edit': 'onSaveAndEditClicked',
      'click .editor-component-list-sidebar-cancel': 'cancelEditing'
    },

    onSaveClicked: function(event) {
      event && event.preventDefault();
      this.updateButton('.editor-component-list-sidebar-save', window.polyglot.t('app.saving'));

      if(!this.model.get('component') || !this.model.get('layout')) {
        return;
      }

      var componentType = _.find(Origin.editor.data.componenttypes.models, function(type){
        return type.get('name') == this.model.get('component');
      }, this);

      var _this = this;
      var newComponentModel = new ComponentModel();

      newComponentModel.save({
        title: window.polyglot.t('app.placeholdernewcomponent'),
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
          Origin.Notify.alert({
            type: 'error',
            text: window.polyglot.t('app.erroraddingcomponent')
          });
        },
        success: function() {
          Origin.trigger('editor:refreshData', function() {
            Backbone.history.history.back();
          }, this);
        }
      });
    },

    onSaveAndEditClicked: function(event) {
      event && event.preventDefault();
      this.updateButton('.editor-component-list-sidebar-save-edit', window.polyglot.t('app.saving'));

      if(!this.model.get('component') || !this.model.get('layout')) {
        return;
      }

      var componentType = _.find(Origin.editor.data.componenttypes.models, function(type){
        return type.get('name') == this.model.get('component');
      }, this);

      var _this = this;
      var newComponentModel = new ComponentModel();

      newComponentModel.save({
        title: window.polyglot.t('app.placeholdernewcomponent'),
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
          Origin.Notify.alert({
            type: 'error',
            text: window.polyglot.t('app.erroraddingcomponent')
          });
        },
        success: function(data) {
          Origin.trigger('editor:refreshData', function() {
            Origin.router.navigate('#/editor/'
            + Origin.editor.data.course.get('_id')
            + '/component/'
            + data.get('_id'));
          }, this);

        }
      });
    },

    cancelEditing: function(event) {
      event && event.preventDefault();
      var currentCourseId = Origin.location.route1;
      var currentBlockId = Origin.location.route3;
      var currentBlock = Origin.editor.data.blocks.findWhere({_id: currentBlockId});
      // Don't like this line but until we have findAncestor this will do
      var currentPage = currentBlock.getParent().getParent();
      var currentPageId = currentPage.get('_id');

      Origin.router.navigate('#/editor/' + currentCourseId + '/page/' + currentPageId);
    }
  }, {
    template: 'editorPageComponentListSidebar'
  });

  return EditorPageComponentListSidebarView;
});
