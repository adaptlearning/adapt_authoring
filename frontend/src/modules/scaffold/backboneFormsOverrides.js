// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

	var Backbone = require('backbone');
	var BackboneForms = require('backbone-forms');
	var BackboneFormsLists = require('backbone-forms-lists');
	var Handlebars = require('handlebars');
	var templateSettings = Backbone.Form.templateSettings;

	// Setup templates
	Backbone.Form.prototype.constructor.template = _.template('\
	    <form>\
	     <div data-fieldsets></div>\
	      <% if (submitButton) { %>\
	        <button class="btn btn-primary" type="submit"><%= submitButton %></button>\
	      <% } %>\
	    </form>\
	', null, templateSettings);
	Backbone.Form.Fieldset.prototype.template = Handlebars.templates['fieldset'];
	Backbone.Form.Field.prototype.template = Handlebars.templates['field'];
	Backbone.Form.NestedField.prototype.template = Handlebars.templates['field'];
	Backbone.Form.editors.List.prototype.constructor.template = _.template('\
		<div class="list-items">\
			<div data-items></div>\
			<button class="btn primary" type="button" data-action="add">\
				<%= addLabel %>\
			</button>\
		</div>\
	', null, templateSettings)
	Backbone.Form.editors.List.Item.prototype.constructor.template = _.template('\
		<div class="list-item clearfix">\
			<span data-editor></span>\
			<button class="btn warning" type="button" data-action="remove">\
				&times;\
			</button>\
		</div>\
	', null, templateSettings);

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

	Backbone.Form.editors.List.Modal.prototype.itemToString = function(value) {
		var createTitle = function(key) {
			var context = { key: key };

			return Backbone.Form.Field.prototype.createTitle.call(context);
		};

		value = value || {};

		//Pretty print the object keys and values
		var parts = [];
		_.each(this.nestedSchema, function(schema, key) {
			
			var desc = schema.title ? schema.title : createTitle(key),
			val = value[key];

			// If value is an array then print out how many items it contains
			if (_.isArray(val)) {
				var itemsString = ' items';
				if (val.length === 1) {
					itemsString = ' item';
				}
				val = val.length + itemsString;
			} else if (_.isObject(val)) {
				// If the value is an object print out the keys and values
				valueText = '';
				_.each(val, function(value, key) {
					valueText += '<br>' + key + ' - ' + value;
				});
				val = valueText;
			}

			if (_.isUndefined(val) || _.isNull(val)) val = '';

			parts.push('<b>' + desc + '</b>: ' + val);

		});

		return parts.join('<br />');
    };

	Backbone.Form.editors.List.prototype.removeItem = function(item) {
		//Confirm delete
		var confirmMsg = this.schema.confirmDelete;

		var remove = _.bind(function(isConfirmed) {
			if (isConfirmed === false) return;

			var index = _.indexOf(this.items, item);

			this.items[index].remove();
			this.items.splice(index, 1);

			if (item.addEventTriggered) {
				this.trigger('remove', this, item.editor);
				this.trigger('change', this);
			}

			if (!this.items.length && !this.Editor.isAsync) this.addItem();
		}, this);

		if (confirmMsg) {
			window.confirm({ title: confirmMsg, type: 'warning', callback: remove });
		} else {
			remove();
		}
	};

	// Used to setValue with defaults

	Backbone.Form.editors.Base.prototype.setValue = function(value) {
		if (!value && typeof this.schema.default !== 'undefined') {
            value = this.schema.default;
        }
		this.value = value;
	}

	var textInitialize = Backbone.Form.editors.Text.prototype.initialize;

	Backbone.Form.editors.Text.prototype.initialize = function(options) {
		textInitialize.call(this, options);

		// HACK to disable auto-completion
		this.$el.attr('autocomplete', 'off');
	};

	Backbone.Form.editors.Text.prototype.setValue = function(value) {
		var schemaDefault = this.schema.default;

		if (!value && typeof schemaDefault !== 'undefined' &&
			!(schemaDefault instanceof Array)) {
			value = schemaDefault;
		}

		this.$el.val(value);
	}

	Backbone.Form.editors.TextArea.prototype.render = function() {

	    // Place value
	    this.setValue(this.value);
	    _.defer(_.bind(function() {
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
            { name: 'insert', items: [ 'SpecialChar', 'Table' ] },
            { name: 'tools', items: [  ] },
            { name: 'others', items: [ '-' ] }
          ],
          extraAllowedContent: 'span(*)',
          disableNativeSpellChecker: false
        });

	    }, this));

	    return this;
	}

	Backbone.Form.editors.TextArea.prototype.setValue = function(value) {
		if (!value && typeof this.schema.default !== 'undefined') {
      value = this.schema.default;
    }
    
    this.$el.val(value);
	}

	Backbone.Form.editors.TextArea.prototype.getValue = function() {
		return this.editor.getData().replace(/[\t\n]/g, '');
	}
  
  Backbone.Form.editors.TextArea.prototype.remove = function() {
    this.editor.removeAllListeners();
    CKEDITOR.remove(this.editor);
  }

	Backbone.Form.prototype.validate = function(options) {
	    var self = this,
	        fields = this.fields,
	        model = this.model,
	        errors = {};

	    options = options || {};

	    //Collect errors from schema validation
	    // !!!OVERRIDE Passing in validate:false will stop the validation of the backbone forms validators
	    if (!options.skipModelValidate) {
			_.each(fields, function(field) {
				var error = field.validate();
				if (error) {
					if(field.schema.title) {
						error.title = field.schema.title;
					}
					errors[field.key] = error;
				}
			});
	    }

	    //Get errors from default Backbone model validator
		if (!options.skipModelValidate && model && model.validate) {
			var modelErrors = model.validate(this.getValue());

			if (modelErrors) {
				var isDictionary = _.isObject(modelErrors) && !_.isArray(modelErrors);

				//If errors are not in object form then just store on the error object
				if (!isDictionary) {
					errors._others = errors._others || [];
					errors._others.push(modelErrors);
				}

				//Merge programmatic errors (requires model.validate() to return an object e.g. { fieldKey: 'error' })
				if (isDictionary) {
					_.each(modelErrors, function(val, key) {
						//Set error on field if there isn't one already
						if (fields[key] && !errors[key]) {
							fields[key].setError(val);
							errors[key] = val;
						}

						else {
							//Otherwise add to '_others' key
							errors._others = errors._others || [];
							var tmpErr = {};
							tmpErr[key] = val;
							errors._others.push(tmpErr);
						}
					});
				}
			}
		}

	    return _.isEmpty(errors) ? null : errors;
	}

	Backbone.Form.editors.Number.prototype.onKeyPress = function(event) {
		var self = this,
			delayedDetermineChange = function() {
				setTimeout(function() {
				self.determineChange();
			}, 0);
		};

		//Allow backspace
		if (event.charCode === 0) {
			delayedDetermineChange();
			return;
		}

		//Get the whole new value so that we can prevent things like double decimals points etc.
		var newVal = this.$el.val()
		if( event.charCode != undefined ) {
			newVal = newVal + String.fromCharCode(event.charCode);
		}

		// Allow support for negative numbers.
		var numeric = /^-?[0-9]*\.?[0-9]*?$/.test(newVal);

		if (numeric) {
			delayedDetermineChange();
		}
		else {
			event.preventDefault();
		}
	};

});