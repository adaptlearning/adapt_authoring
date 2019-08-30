define([ 'core/origin', 'backbone-forms' ], function(Origin, BackboneForms) {

  var ScaffoldCodeEditorView =  Backbone.Form.editors.Base.extend({

    defaultValue: '',

    className: 'scaffold-code-editor',

    editor: null,

    mode: 'text',

    session: null,

    initialize: function(options) {
      Backbone.Form.editors.Base.prototype.initialize.call(this, options);

      var inputType = options.schema.inputType;
      var mode = inputType.mode || inputType.split(':')[1];

      if (mode) {
        this.mode = mode;
      }
    },

    render: function() {
      window.ace.config.set('basePath', 'js/ace');

      this.editor = window.ace.edit(this.$el[0], {
        maxLines: 30,
        minLines: 14,
        mode: 'ace/mode/' + this.mode,
        theme: 'ace/theme/chrome'
      });

      this.editor.on('change', function() { this.trigger('change', this); }.bind(this));
      this.setValue(this.value);

      return this;
    },

    setValue: function(value) {
      if (this.mode === 'json') {
        value = JSON.stringify(value, null, '\t');
      }

      this.editor.setValue(value);
    },

    getValue: function() {
      var value = this.editor.getValue();

      if (this.mode !== 'json') {
        return value;
      }

      try {
        return JSON.parse(value);
      } catch(e) {
        return value;
      }
    },

    validate: function() {
      var error = Backbone.Form.editors.Base.prototype.validate.call(this);

      if (error) {
        return error;
      }

      if (this.isSyntaxError()) {
        return { message: Origin.l10n.t('app.errorsyntax') };
      }
    },

    isSyntaxError: function() {
      var annotations = this.editor.getSession().getAnnotations();

      for (var i = 0, j = annotations.length; i < j; i++) {
        if (annotations[i].type === 'error') {
          return true;
        }
      }
    }

  });

  Origin.on('origin:dataReady', function() {
    Origin.scaffold.addCustomField('CodeEditor', ScaffoldCodeEditorView);
    Origin.scaffold.addCustomField('CodeEditor:javascript', ScaffoldCodeEditorView);
    Origin.scaffold.addCustomField('CodeEditor:less', ScaffoldCodeEditorView);
  });

  return ScaffoldCodeEditorView;

});
