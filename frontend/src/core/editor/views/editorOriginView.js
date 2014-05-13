define(function(require){

  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');

  var EditorOriginView = OriginView.extend({

    initialize: function() {
      OriginView.prototype.initialize.apply(this, arguments);
      this.listenTo(Origin, 'editorView:pasteCancel', this.hidePasteZone);
    },

    onCopy: function(event) {
      if (event) {
        event.preventDefault();
      }
      Origin.trigger('editorView:copy', this.model);
      $('.paste-zone').addClass('display-none');
      $('.paste-zone-'+ this.model.get('_type')).removeClass('display-none');
    },

    onPaste: function(event) {
      event.preventDefault();
      Origin.trigger('editorView:paste', this.model, $(event.target).data('sort-order'), $(event.target).data('paste-layout'));
      $('.paste-zone').addClass('display-none');
    },

    pasteCancel: function(event) {
      event.preventDefault();
      Origin.trigger('editorView:pasteCancel', this.model);
    },

    hidePasteZone: function() {
      // Purposeful global selector here
      $('.paste-zone').addClass('display-none');
    },

    openContextMenu: function (e) {
      Origin.trigger('contextMenu:open', this, e);
    }

  });

  return EditorOriginView;

});
