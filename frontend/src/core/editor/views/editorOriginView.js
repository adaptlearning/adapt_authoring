define(function(require){

  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');

  var EditorOriginView = OriginView.extend({

    initialize: function() {
      OriginView.prototype.initialize.apply(this, arguments);
      this.listenTo(Origin, 'editor:pasteCancel', this.hidePasteZone);
    },

    onCopy: function(event) {
      event.preventDefault();
      Origin.trigger('editorView:copy', this.model);
      $('.paste-zone').addClass('display-none');
      $('.paste-zone-'+ this.model.get('_type')).removeClass('display-none');
      console.log('copied ' + this.model.get('_type'));
    },

    onPaste: function(event) {
      event.preventDefault();
      Origin.trigger('editorView:paste', this.model);
      $('.paste-zone').addClass('display-none');
      console.log('pasting to ' + this.model.get('_type'));
    },

    pasteCancel: function(event) {
      event.preventDefault();
      Origin.trigger('editorView:pasteCancel', this.model);
    },

    hidePasteZone: function() {
      this.$('.paste-zone').addClass('display-none');
    }

  });

  return EditorOriginView;

});
