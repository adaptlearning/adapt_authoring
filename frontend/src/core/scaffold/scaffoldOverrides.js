define(function(require) {

	var Backbone = require('backbone');
	var BackboneForms = require('backboneForms');
	var Handlebars = require('handlebars');

	// Setup templates
	Backbone.Form.Fieldset.prototype.template = Handlebars.templates['fieldset'];
	Backbone.Form.Field.prototype.template = Handlebars.templates['field'];
	Backbone.Form.NestedField.prototype.template = Handlebars.templates['field'];

	// Overwrites
	Backbone.Form.Field.prototype.templateData = function() {
		var schema = this.schema;

		return {
			help: schema.help || '',
			title: schema.title,
			titleHTML: schema.titleHTML,
			fieldAttrs: schema.fieldAttrs,
			editorAttrs: schema.editorAttrs,
			key: this.key,
			editorId: this.editor.id,
			legend: schema.legend,
			fieldType: this.schema.fieldType
		};
	};

	// Used to setValue with defaults

	Backbone.Form.editors.Base.prototype.setValue = function(value) {
		if (!value && typeof this.schema.default !== 'undefined') {
            value = this.schema.default;
        }
		this.value = value;
	}

	Backbone.Form.editors.Text.prototype.setValue = function(value) {
		if (!value && typeof this.schema.default !== 'undefined') {
            value = this.schema.default;
        }
		this.$el.val(value);
	}

	Backbone.Form.editors.Checkbox.prototype.setValue = function(value) {
		if (value || this.schema.default) {
			this.$el.prop('checked', true);
		}else {
			this.$el.prop('checked', false);
		}
	}

	Backbone.Form.editors.TextArea.prototype.render = function() {
	    // Place value
	    this.setValue(this.value);
	    _.delay(_.bind(function() {
	    	// Initialize the editor
	    	var textarea = this.$el[0];
	    	this.editor = CKEDITOR.replace(textarea, {
	    		toolbar: [
					{ name: 'document', groups: [ 'mode', 'document', 'doctools' ], items: [ 'Source', '-', 'ShowBlocks' ] },
					{ name: 'clipboard', groups: [ 'clipboard', 'undo' ], items: [ 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo' ] },
					{ name: 'editing', groups: [ 'find', 'selection', 'spellchecker' ], items: [ 'Find', 'Replace', '-', 'SelectAll' ] },
					{ name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi' ], items: [ 'NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', 'CreateDiv' ] },
					{name: 'direction', items: ['BidiLtr', 'BidiRtl']},
					'/',
					{ name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ], items: [ 'Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'RemoveFormat'] },
					{ name: 'styles', items: ['JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock']},
					{ name: 'links', items: [ 'Link', 'Unlink' ] },
					{ name: 'colors', items: [ 'TextColor', 'BGColor' ] },
					{ name: 'insert', items: [ 'SpecialChar' ] },
					{ name: 'tools', items: [  ] },
					{ name: 'others', items: [ '-' ] }
				]
			});

	    }, this), 100);

	    return this;
	}

	Backbone.Form.editors.TextArea.prototype.setValue = function(value) {
		if (!value && typeof this.schema.default !== 'undefined') {
            value = this.schema.default;
        }
        this.$el.html(value);
	}

	Backbone.Form.editors.TextArea.prototype.getValue = function() {
		return this.editor.getData();
	}

});