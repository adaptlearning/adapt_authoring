// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('core/app/origin');
  var Helpers = require('core/app/helpers');
  var EditorOriginView = require('./editorOriginView');

  var EditorPasteZone = EditorOriginView.extend({
    className: 'display-none paste-zone',

    events: {
      'click .editor-paste-zone-paste': 'onPasteElementClicked'
    },

    preRender: function() {
      this.listenTo(this.model, 'destroy', this.remove);
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
      this.listenTo(Origin, 'editorPageView:removePageSubViews', this.remove);
    },

    postRender: function () {
      var type = this.model.get('_type');
      this.$el.addClass('paste-zone-' + type);
      this.$el.droppable({
        accept: '.' + type + '-draggable',
        hoverClass: 'paste-zone-droppable',
        drop: _.bind(this.onDrop, this)
      });
    },

    /**
    * Event handling
    */

    onPasteElementClicked: function(event) {
      event && event.preventDefault();

      var parentId = this.model.get('_parentId');
      var sortOrder = this.model.get('_pasteZoneSortOrder');
      var layout = this.model.get('_pasteZoneLayout');
      Origin.trigger('editorView:paste', parentId, sortOrder, layout);
    },

    onDrop: function(e, ui) {
      var type = this.model.get('_type');
      var parentId = this.model.get('_parentId');
      var $component = $(ui.draggable);
      var contentId = $component.attr('data-' + type + '-id');
      var droppedOnId = $component.attr('data-' + this.model.get('_parent') + '-id');
      var sortOrder = $(this).find('.paste-' + type).attr('data-sort-order');
      var newData = {
        _sortOrder: sortOrder,
        _parentId: parentId
      };
      $.ajax({
        type: 'PUT',
        url:'/api/content/' + type + '/' + contentId,
        data: newData,
        success: this.onSaveSuccess,
        error: this.onSaveError
      });
    },

    onSaveSuccess: function(jqXHR, textStatus, errorThrown) {
      var contentCollection = Origin.editor.data[view.model._siblings];
      contentCollection.fetch().done(function() {
        // Re-render the move-from content item
        Origin.trigger('editorView:move' + Helpers.capitalise(type) + ':' + droppedOnId);
        // Re-render the move-to content item if needed
        if (droppedOnId !== parentId) {
          Origin.trigger('editorView:move' + Helpers.capitalise(type) + ':' + parentId);
        }
      });
    },

    onSaveError: function(jqXHR) {
      Origin.Notify.alert({
        type: 'error',
        text: jqXHR.responseJSON.message
      });
    }
  }, {
    template: 'editorPasteZone'
  });

  return EditorPasteZone;
});
