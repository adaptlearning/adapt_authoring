// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');
  var Origin = require('coreJS/app/origin');

  var EditorPasteZone = EditorOriginView.extend({
    className: 'display-none paste-zone',

    events: {
        'click .editor-paste-zone-paste': 'onPasteElementClicked'
    },

    onPasteElementClicked: function(event) {
        event && event.preventDefault();
        var parentId = this.model.get('_parentId');
        var sortOrder = this.model.get('_pasteZoneSortOrder');
        var layout = this.model.get('_pasteZoneLayout');
        
        Origin.trigger('editorView:paste', parentId, sortOrder, layout);
    },

    preRender: function() {
      this.listenTo(this.model, 'destroy', this.remove);
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
      this.listenTo(Origin, 'editorPageView:removePageSubViews', this.remove);
    },

    postRender: function () {
      var view = this;
      var type = view.model.get('_type');
      var parentId = view.model.get('_parentId');
      this.$el.addClass('paste-zone-' + type);

      this.$el.droppable({
        accept: '.' + type + '-draggable',
        hoverClass: 'paste-zone-droppable',
        drop: function (e, ui) {
          var $component = $(ui.draggable);
          var contentId = $component.attr('data-' + type + '-id');
          var droppedOnId = $component.attr('data-' + view.model.get('_parent') + '-id');
          var sortOrder = $(this).find('.paste-' + type).attr('data-sort-order');
          var newData = {
            _sortOrder: sortOrder,
            _parentId: parentId
          };
          $.ajax({
            type: 'PUT',
            url:'/api/content/' + type + '/' + contentId,
            data: newData,
            success: function(jqXHR, textStatus, errorThrown) {
              var contentCollection = Origin.editor.data[view.model._siblings];
              contentCollection.fetch().done(function() {
                // Re-render the move-from content item
                Origin.trigger('editorView:move' + view.capitalise(type) + ':' + droppedOnId);
                // Re-render the move-to content item if needed
                if (droppedOnId !== parentId) {
                  Origin.trigger('editorView:move' + view.capitalise(type) + ':' + parentId);
                }
              });
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
    },

    capitalise: function(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
  }, {
    template: 'editorPasteZone'
  });

  return EditorPasteZone;

});
