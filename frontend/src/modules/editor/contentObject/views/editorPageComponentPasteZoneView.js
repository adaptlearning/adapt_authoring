// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('core/origin');
  var EditorPasteZoneView = require('../../global/views/editorPasteZoneView');

  var EditorPageComponentPasteZone = EditorPasteZoneView.extend({
    className : 'paste-zone paste-zone-component display-none',

    events: {
      'click .editor-paste-zone-paste': 'onPasteElementClicked'
    },

    preRender: function () {
      this.listenTo(this.model, 'destroy', this.remove);
      this.listenTo(Origin, 'editorView:removeSubViews editorPageView:removePageSubViews', this.remove);
    },

    postRender: function () {
      var view = this;
      this.$el.addClass('paste-zone-component-' + this.model.get('_pasteZoneLayout'));
      this.$el.droppable({
        accept: function(el) {
          return el.hasClass('component-draggable') && $(this).css('visibility') == 'visible';
        },
        hoverClass: 'paste-zone-droppable',
        drop: function (e, ui) {
          var $component = $(ui.draggable);
          var parentId = view.model.get('_parentId');
          var blockId = $component.attr('data-block-id');
          var componentId = $component.attr('data-component-id');
          var left = $(this).hasClass('paste-zone-component-left');
          var right = $(this).hasClass('paste-zone-component-right');
          var newLayout = (!left && !right) ? 'full' : (left ? 'left' : 'right');
          var newData = {
            _layout: newLayout,
            _parentId: parentId
          };

          $.ajax({
            type: 'PUT',
            url:'api/content/component/' + componentId,
            data: newData,
            success: function(jqXHR, textStatus, errorThrown) {
              // Re-render the move-from block
              Origin.trigger('editorView:moveComponent:' + blockId);
              if (blockId !== parentId) {
                // Re-render the move-to block
                Origin.trigger('editorView:moveComponent:' + parentId);
              }
            },
            error: function(jqXHR, textStatus, errorThrown) {
              Origin.Notify.alert({
                type: 'error',
                text: jqXHR.responseJSON.message
              });
            }
          });
        }
      });
    }
  }, {
    template: 'editorPageComponentPasteZone'
  });

  return EditorPageComponentPasteZone;
});
