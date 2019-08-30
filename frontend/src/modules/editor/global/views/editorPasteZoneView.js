// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('core/origin');
  var Helpers = require('core/helpers');
  var EditorOriginView = require('./editorOriginView');

  var EditorPasteZoneView = EditorOriginView.extend({
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
      var $component = $(ui.draggable);
      var contentId = $component.attr('data-' + type + '-id');
      var parentId = this.model.get('_parentId');
      var droppedOnId = $component.attr('data-' + this.model.get('_parent') + '-id');
      $.ajax({
        url: 'api/content/' + type + '/' + contentId,
        type: 'PUT',
        data: {
          _parentId: parentId,
          _sortOrder: $('.paste-' + type, this.$el).attr('data-sort-order')
        },
        success: function() {
          var eventPrefix = 'editorView:move' + Helpers.capitalise(type) + ':';
          Origin.trigger(eventPrefix + droppedOnId);
          // notify the old parent that the child's gone
          if(droppedOnId !== parentId) Origin.trigger(eventPrefix + parentId);
        },
        error: function(jqXHR) {
          Origin.Notify.alert({ type: 'error', text: jqXHR.responseJSON.message });
        }
      });
    }
  }, {
    template: 'editorPasteZone'
  });

  return EditorPasteZoneView;
});
