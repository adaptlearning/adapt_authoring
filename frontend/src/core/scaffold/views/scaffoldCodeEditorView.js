// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

    var Backbone = require('backbone');
    var BackboneForms = require('backboneForms');
    var Origin = require('coreJS/app/origin');

    var ScaffoldCodeEditorView =  Backbone.Form.editors.Base.extend({

        tagName: 'div',

        className: 'scaffold-code-editor',
        
        initialize: function(options) {
            // Call parent constructor
            Backbone.Form.editors.Base.prototype.initialize.call(this, options);
            
            // Check which mode the code editor should be in
            var schemaParts = options.schema.fieldType.split(':');
            
            if (schemaParts.length == 1) {
              this.mode = 'text';
            } else {
              this.mode = schemaParts[1];
            }
        },
        
        render: function() {
            // Place value
            var self = this;
            
            _.defer(_.bind(function() {
                window.ace.config.set("basePath", "./adaptbuilder/js/ace");
                this.editor = window.ace.edit(self.$el[0]);
                this.editor.$blockScrolling = Infinity;
                this.editor.setTheme("ace/theme/chrome");
                this.editor.getSession().setMode("ace/mode/" + this.mode);
                this.editor.setValue(self.value);
            }, this));
            
            return this;
        },

        getValue: function() {
          return this.editor.getValue();
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