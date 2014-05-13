define(function(require){

  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');

  var EditorOriginView = OriginView.extend({

    events: {
      'click .paste-cancel'   : 'pasteCancel',
    },

    initialize: function() {
      OriginView.prototype.initialize.apply(this, arguments);
      this.listenTo(Origin, 'editorView:pasteCancel', this.hidePasteZone);
    },

    onCopy: function(event) {
      if (event) {
        event.preventDefault();
      }

      $('.paste-zone').addClass('display-none');
      $('.paste-zone-'+ this.model.get('_type')).removeClass('display-none');

      Origin.trigger('editorView:copy', this.model);
    },

    onPaste: function(event) {
      event.preventDefault();

      $('.paste-zone').addClass('display-none');

      Origin.trigger('editorView:paste', this.model, $(event.target).data('sort-order'), $(event.target).data('paste-layout'));
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
      e.stopPropagation();
      e.preventDefault();

      Origin.trigger('contextMenu:open', this, e);
    }

  });

  return EditorOriginView;

});
