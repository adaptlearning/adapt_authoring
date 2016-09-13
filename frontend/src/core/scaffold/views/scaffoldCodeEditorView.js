// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

    var Backbone = require('backbone');
    var BackboneForms = require('backboneForms');
    var Origin = require('coreJS/app/origin');

    var ScaffoldCodeEditorView =  Backbone.Form.editors.Base.extend({

        tagName: 'div',

        className: 'scaffold-code-editor',

        isSyntaxError: false,

        initialize: function(options) {
            // Call parent constructor
            Backbone.Form.editors.Base.prototype.initialize.call(this, options);
            
            // Check which mode the code editor should be in
            var fieldType = options.schema.fieldType;
            var mode = fieldType.mode;

            if (mode) {
                this.mode = mode;
                return;
            }

            var schemaParts = fieldType.split(':');
            
            if (schemaParts.length == 1) {
              this.mode = 'text';
            } else {
              this.mode = schemaParts[1];
            }
        },
        
        render: function() {
            this.setValue(this.value);

            _.defer(_.bind(function() {
                window.ace.config.set("basePath", "./adaptbuilder/js/ace");
                this.editor = window.ace.edit(this.$el[0]);

                var session = this.editor.getSession();

                this.editor.$blockScrolling = Infinity;
                this.editor.setTheme("ace/theme/chrome");
                session.setMode("ace/mode/" + this.mode);
                session.on('changeAnnotation', _.bind(this.onChangeAnnotation, this));
                this.editor.setValue(this.value);
            }, this));
            
            return this;
        },

        setValue: function(value) {
            var schemaDefault = this.schema.default;
            var fallbackDefault = this.mode === 'json' ? {} : '';

            if (value === null) {
                value = schemaDefault !== undefined ? schemaDefault : fallbackDefault;
            }
            if (this.mode === 'json') {
                value = JSON.stringify(value, null, '\t');
            }

            this.value = value;
        },

        getValue: function() {
            if (this.mode === 'json' && !this.isSyntaxError) {
                return JSON.parse(this.editor.getValue() || null);
            }

            return this.editor.getValue();
        },

        validate: function() {
            var error = Backbone.Form.editors.Base.prototype.validate.call(this);

            if (error) {
                return error;
            }
            if (this.isSyntaxError) {
                return { message: 'Syntax error' };
            }
        },

        onChangeAnnotation: function() {
            var annotations = this.editor.getSession().getAnnotations();

            for (var i = 0, j = annotations.length; i < j; i++) {
                if (annotations[i].type === 'error') {
                    this.isSyntaxError = true;
                    return;
                }
            }

            this.isSyntaxError = false;
        },

        remove: function() {
            this.editor.getSession().off('changeAnnotation');

            Backbone.Form.editors.Base.prototype.remove.call(this);
        }

    }, {
      template: 'scaffoldCodeEditor'
    });

    Origin.on('app:dataReady', function() {
        // Add code editor to the list of editors
        // Anything after "CodeEditor:" can correspond to the ACE editor mode types
        Origin.scaffold.addCustomField('CodeEditor:javascript', ScaffoldCodeEditorView);
        Origin.scaffold.addCustomField('CodeEditor:less', ScaffoldCodeEditorView);
        Origin.scaffold.addCustomField('CodeEditor', ScaffoldCodeEditorView);
    })
    

    return ScaffoldCodeEditorView;

})