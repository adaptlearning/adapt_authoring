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

    postRender: function() {
      console.log('+1');
    },

    scrollIntoPosition: function() {
      if (Origin.editor.scrollTo) {
        window.scrollTo(0, Origin.editor.scrollTo);
      }
    },

    storeScrollPosition: function(event) {     
      if (event && event.pageY) {
        console.log(event.pageY);
        Origin.editor.scrollTo = event.pageY;  
      }
    },

    onCopy: function(event) {
      if (event) {
        event.preventDefault();
      }

      this.showPasteZones();

      Origin.trigger('editorView:copy', this.model);
    },

    onCut: function(event) {
      if (event) {
        event.preventDefault();
      }

      Origin.trigger('editorView:cut', this);
    },

    capitalise: function(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
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
    },

    showDropZones: function () {
      // Purposeful global selector here
      $('.paste-zone').addClass('visibility-hidden');
      // Hide the links within the dropzone
      $('.paste-zone-'+ this.model.get('_type') + ' a').addClass('visibility-hidden');
      $('.paste-zone-'+ this.model.get('_type')).addClass('paste-zone-available').removeClass('visibility-hidden');
      this.$el.parent().children('.drop-only').css({visibility : 'visible'});
    },

    hideDropZones: function() {
      // Purposeful global selectors here
      $('.paste-zone').addClass('visibility-hidden').removeClass('paste-zone-available');
      // Show the links within the dropzone again, incase copy is initiated
      $('.paste-zone a').removeClass('visibility-hidden');
      this.$el.parent().children('.drop-only').css({visibility : 'hidden'});
    },

  });

  return EditorOriginView;

});
