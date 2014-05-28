define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var EditorOriginView = require('coreJS/editor/views/editorOriginView');
  var Origin = require('coreJS/app/origin');

  var EditorPasteZone = EditorOriginView.extend({
    className: 'visibility-hidden paste-zone',

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
            complete:function(xhr,status) {
              var contentCollection = Origin.editor.data[view.model._siblings];
              contentCollection.fetch().done(function() {
                // Re-render the move-from content item
                Origin.trigger('editorView:move' + view.capitalise(type) + ':' + droppedOnId);
                // Re-render the move-to content item if needed
                if (droppedOnId !== parentId) {
                  Origin.trigger('editorView:move' + view.capitalise(type) + ':' + parentId);
                }
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
