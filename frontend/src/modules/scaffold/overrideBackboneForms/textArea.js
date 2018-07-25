define([
  'core/origin',
  'backbone-forms',
], function(Origin, BackboneForms) {
  'use strict';
  
  var textAreaRender = Backbone.Form.editors.TextArea.prototype.render;
  var textAreaSetValue = Backbone.Form.editors.TextArea.prototype.setValue;

  return {
    // render ckeditor in textarea
    render: function() {
      textAreaRender.call(this);
  
      _.defer(function() {
        this.editor = CKEDITOR.replace(this.$el[0], {
          dataIndentationChars: '',
          disableNativeSpellChecker: false,
          entities: false,
          extraAllowedContent: Origin.constants.ckEditorExtraAllowedContent,
          on: {
            change: function() {
              this.trigger('change', this);
            }.bind(this),
            instanceReady: function() {
              var writer = this.dataProcessor.writer;
              var elements = Object.keys(CKEDITOR.dtd.$block);

              var rules = {
                indent: false,
                breakBeforeOpen: false,
                breakAfterOpen: false,
                breakBeforeClose: false,
                breakAfterClose: false
              };

              writer.indentationChars = '';
              writer.lineBreakChars = '';
              elements.forEach(function(element) { writer.setRules(element, rules); });
            }
          },
          toolbar: [
            { name: 'document', groups: [ 'mode', 'document', 'doctools' ], items: [ 'Source', '-', 'ShowBlocks' ] },
            { name: 'clipboard', groups: [ 'clipboard', 'undo' ], items: [ 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo' ] },
            { name: 'editing', groups: [ 'find', 'selection', 'spellchecker' ], items: [ 'Find', 'Replace', '-', 'SelectAll' ] },
            { name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi' ], items: [ 'NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', 'CreateDiv' ] },
            { name: 'direction', items: [ 'BidiLtr', 'BidiRtl' ] },
            '/',
            { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ], items: [ 'Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'RemoveFormat'] },
            { name: 'styles', items: [ 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock' ] },
            { name: 'links', items: [ 'Link', 'Unlink' ] },
            { name: 'colors', items: [ 'TextColor', 'BGColor' ] },
            { name: 'insert', items: [ 'SpecialChar', 'Table' ] },
            { name: 'tools', items: [] },
            { name: 'others', items: [ '-' ] }
          ]
        });
      }.bind(this));
  
      return this;
    },

    // get data from ckeditor in textarea
    getValue: function() {
      return this.editor.getData();
    },

    // set value in ckeditor
    setValue: function(value) {
      textAreaSetValue.call(this, value);
    
      if (this.editor) {
        this.editor.setData(value);
      }
    },
    
    // ckeditor removal
    remove: function() {
      this.editor.removeAllListeners();
      CKEDITOR.remove(this.editor);
    }
  }

});
