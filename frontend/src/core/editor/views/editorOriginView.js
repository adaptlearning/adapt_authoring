define(function(require){

  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');

  var EditorOriginView = OriginView.extend({

    events: {
      'click .paste-cancel'   : 'pasteCancel'
    },

    initialize: function() {
      OriginView.prototype.initialize.apply(this, arguments);
      
      this.listenTo(Origin, 'editorView:pasteCancel', this.hidePasteZones);
    },

    onCopy: function(event) {
      if (event) {
        event.preventDefault();
      }

      this.showPasteZones();

      Origin.trigger('editorView:copy', this.model);
    },

    onPaste: function(event) {
      event.preventDefault();

      this.hidePasteZones();

      Origin.trigger('editorView:paste', this.model, $(event.target).data('sort-order'), $(event.target).data('paste-layout'));
    },

    pasteCancel: function(event) {
      event.preventDefault();

      Origin.trigger('editorView:pasteCancel', this.model);
    },

    hidePasteZones: function() {
      // Purposeful global selector here
      $('.paste-zone').addClass('visibility-hidden');
    },

    openContextMenu: function (e) {
      e.stopPropagation();
      e.preventDefault();

      Origin.trigger('contextMenu:open', this, e);
    },

    showPasteZones: function () {
      $('.paste-zone').addClass('visibility-hidden');
      $('.paste-zone-'+ this.model.get('_type')).removeClass('visibility-hidden');
    }

  });

  return EditorOriginView;

});
