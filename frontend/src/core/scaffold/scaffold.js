// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
	var Origin = require('coreJS/app/origin');
	var BackboneForms = require('backboneForms');
	var BackboneFormsLists = require('backboneFormsLists');
	var ScaffoldItemsModalView = require('coreJS/scaffold/views/scaffoldItemsModalView');
	var ScaffoldImageView = require('coreJS/scaffold/views/scaffoldAssetView');
	var ScaffoldBooleanView = require('coreJS/scaffold/views/scaffoldBooleanView');
	var ScaffoldTagsView = require('coreJS/scaffold/views/scaffoldTagsView');
	var ScaffoldQuestionButtonView = require('coreJS/scaffold/views/scaffoldQuestionButtonView');
	var ScaffoldColorPickerView = require('coreJS/scaffold/views/scaffoldColorPickerView');
	var ScaffoldDisplayTitleView = require('coreJS/scaffold/views/scaffoldDisplayTitleView');
	var ScaffoldTextAreaView = require('coreJS/scaffold/views/scaffoldTextAreaView');
	var Schemas = require('coreJS/scaffold/schemas');
	var Overrides = require('coreJS/scaffold/scaffoldOverrides');
	var Helpers = require('coreJS/app/helpers');

	var ActiveItemsModal = 0;
	var isOverlayActive = false;
	var Scaffold = {};
	// Used to pass model data around the current form
	var currentModel;
	var currentForm;

	// Used to pass an alternative model and alternative attribute to save
	var alternativeModel;
	var alternativeAttribute;

	// Used to store already build schemas
	var builtSchemas = {};
	var defaultValidators = _.keys(Backbone.Form.validators);
	var customValidators = [];
	var customTemplates = [];

	Backbone.Form.editors.List.Modal.ModalAdapter = ScaffoldItemsModalView;

	Origin.on('scaffold:updateSchemas', function(callback, context) {
		Origin.trigger('schemas:loadData', function() {
			resetSchemas();
			callback.apply(context);
		});
	});

	var resetSchemas = function() {
		builtSchemas = {};
	};

	var setupSchemaFields = function(field, key, schema, scaffoldSchema) {
		if (field.type === 'array') {
			setupArraySchemaField(field, key, schema, scaffoldSchema);
		} else if('object' === field.type) {
			setupObjectSchemaField(field, key, schema, scaffoldSchema);
		} else {
			setupNonObjectSchemaField(field, key, schema, scaffoldSchema);
		}

		if (field.title) {
			scaffoldSchema[key].title = field.title;
		} else if (field.type === 'object') {
			scaffoldSchema[key].title = '';
			scaffoldSchema[key].legend = field.legend;
		}
	};

	var setupArraySchemaField = function(field, key, schema, scaffoldSchema) {
		if (field.items && field.items.properties) {
			scaffoldSchema[key] = {
				type: 'List',
				itemType: 'Object',
				subSchema: field.items.properties,
				fieldType: 'List'
			};
		} else {
			if (field.inputType) {
				var fieldObject = {
					type: field.inputType,
					help: field.help,
					default: field.default,
					fieldType: field.inputType
				};

				if (_.isObject(field.inputType)) {
					fieldObject = _.extend(fieldObject, field.inputType);
				}
				scaffoldSchema[key] = fieldObject;
			} else {
				scaffoldSchema[key] = {
					type: 'List',
					itemType:field.items.inputType,
					subSchema: field.items,
					fieldType: field.items.inputType
				};
			}
		}

		var objectSchema = (schema[key].properties || schema[key].subSchema);
		var scaffoldObjectSchema = scaffoldSchema[key].subSchema;

		_.each(objectSchema, function(field, key) {
			setupSchemaFields(field, key, objectSchema, scaffoldObjectSchema);
		});
	};

	var setupNonObjectSchemaField = function(field, key, schema, scaffoldSchema) {
		var validators = [];
		// Go through each validator checking whether this is a default or a custom validator
		_.each(field.validators, function(validator) {
			if (!_.isArray(validator) && _.isObject(validator)) {
				// If validator is an object - must be a default
				validators.push(validator);
			} else {
				// Check whether this is a defaultValidator
				if (_.contains(defaultValidators, validator)) {
					validators.push(validator);
				} else {
					// If custom - search custom validators
					var customValidator = _.findWhere(customValidators, {name: validator});
					if (!customValidator) {
						return console.log('No validator of that sort - please register: "' + validator + '" by using Origin.scaffold.addCustomValidator(name, validatorMethod)');
					}
					// If match is found - add the method
					validators.push(customValidator.validatorMethod);
				}
			}
		});

		var fieldObject = {
			type: field.inputType,
			validators: validators,
			help: field.help,
			default: field.default,
			fieldType: field.inputType
		};

		if (_.isObject(field.inputType)) {
			fieldObject = _.extend(fieldObject, field.inputType);
		}

		scaffoldSchema[key] = fieldObject;
	};

	var setupObjectSchemaField = function(field, key, schema, scaffoldSchema) {
		scaffoldSchema[key] = {
			type: 'Object',
			subSchema: field.properties
		}

		var objectSchema = (schema[key].properties || schema[key].subSchema);
		var scaffoldObjectSchema = scaffoldSchema[key].subSchema;

		_.each(objectSchema, function(field, key) {
			setupSchemaFields(field, key, objectSchema, scaffoldObjectSchema);
		});
	};

	var buildSchema = function(schema, options, type) {
		if (builtSchemas[type]) {
			return builtSchemas[type];
		}

		var scaffoldSchema = {};

		// Build schema
		_.each(schema, function(field, key) {
			if("properties" === key && field.properties) {
				_.each(field.properties, function(propField, propKey) {
					setupSchemaFields(propField, propKey, field.properties, scaffoldSchema);
				});
			} else {
				setupSchemaFields(field, key, schema, scaffoldSchema);
			}
		});

		// Remove extensions if none apply
		// TODO: Make this generic to apply to any field?
		if(scaffoldSchema._extensions && _.isEmpty(scaffoldSchema._extensions.subSchema)) {
			delete scaffoldSchema._extensions;
		}

		builtSchemas[type] = scaffoldSchema;
		return scaffoldSchema;
	};

	/**
	* 1. Merge both layout schemas
	* 2. Extend the initial fieldsets and attempt to categorise
	*
	* NOTE: All base fieldsets will be supplied with core
	*/
	var buildFieldSets = function(initialType, type, schema) {
		// for base type
		var initialLayout = Origin.editor.data.layouts[initialType];
		var initialFieldsets = (initialLayout && initialLayout.fieldsets) ? initialLayout.fieldsets : false;
		// for custom type
		var layout = Origin.editor.data.layouts[type];
		var fieldsets = (layout && layout.fieldsets) ? layout.fieldsets : false;
		var orderedFieldsets = [];

		if(fieldsets) {
			if(initialType !== type && initialFieldsets) {
				orderedFieldsets = extendLayoutFieldsets(initialLayout, layout);
			} else {
				// convert to an array with correct order
				var ordering = (initialLayout) ? initialLayout.ordering : layout.ordering;
				for(var i = 0, len = ordering.length; i < len; i++) {
					var fieldset;
					if(initialLayout) fieldset = initialLayout.fieldsets[ordering[i]];
					else fieldset = layout.fieldsets[ordering[i]]
					orderedFieldsets.push(fieldset);
				}
			}
		} else if(initialFieldsets) {
			var newFields = getNewFieldsFromFieldsets(initialFieldsets, fieldsets);
			var tempLayout = {
				fieldsets: generateNewFieldSets(schema, newFields)
			};
			orderedFieldsets = extendLayoutFieldsets(initialLayout, tempLayout);
		}

		return pruneUnusedFieldsets(orderedFieldsets, schema);
	};

	/*
	* Removes any empty fieldsets
	* TODO: Schema validation
	*/
	var pruneUnusedFieldsets = function(fieldsets, schema) {
		var fieldsetsClone = fieldsets.slice(0);

		for(var i = 0; i < fieldsetsClone.length; i++) {
			if(0 === fieldsetsClone[i].fields.length) {
				console.log("'" + fieldsetsClone[i].legend + "' fieldset doesn't have any fields, removing.");
				fieldsetsClone.splice(i--,1);
				continue;
			}

			var empties = 0;
			for(var j = 0; j < fieldsetsClone[i].fields.length; j++) {
				var field = fieldsetsClone[i].fields[j];
				if(schema[field]) {
					var props = schema[field].properties;
					if(props && _.isEmpty(props)) {
						empties++;
					}
				} else {
					console.log("'" + fieldsetsClone[i].legend + "' field '" + field + "' isn't in the schema, removing.");
					fieldsetsClone[i].fields.splice(j--,1);
					continue;
				}
			}

			if(fieldsetsClone[i].fields.length === empties) {
				console.log("'" + fieldsetsClone[i].legend + "' fieldset only has empty fields, removing.");
				fieldsetsClone.splice(i--,1);
			}
		}

		return fieldsetsClone;
	};

	var getFieldsFromFieldsets = function(fieldsets) {
		var fields = [];
		for(var key in fieldsets) {
			fields = fields.concat(fieldsets[key].fields);
		}
		return fields;
	};

	var getNewFieldsFromFieldsets = function(initialFieldsets, extraFieldsets) {
		var initialFields = getFieldsFromFieldsets(initialFieldsets);
		var extraFields = getFieldsFromFieldsets(extraFieldsets);
		var newFields = [];

		for(var i = 0, len = extraFields.length; i < len; i++) {
			if(-1 === initialFields.indexOf(extraFields[i])) {
				newFields.push(extraFields[i]);
			}
		}

		return newFields;
	};

	// Create fieldsets from newFields
	var generateNewFieldSets = function(schema, newFields) {
		/*
		* TODO: Use localised strings here
		* Should these be stored in the fieldsets.schema, or the routes/lang/*.json?
		* e.g. window.polyglot.t('fieldsetLegend-' + key)
		*/
		var fieldsets = {
			general: {
				legend: 'General',
				fields: []
			},
			settings :{
				legend: 'Settings',
				fields: []
			}
		};

		for(var key in schema) {
			if(-1 === newFields.indexOf(key) && 'properties' !== key) {
				continue;
			}

			// TODO: Do we have nested .isSettings?
			if (schema[key].isSetting) {
				fieldsets.settings.fields.push(key);
			} else if (schema[key].type === 'object') {
				if(!fieldsets[key]) {
					fieldsets[key] = {
						legend: Helpers.keyToTitleString(key),
						fields: []
					};
				}
				if(schema[key].properties) {
					for(var propsKey in schema[key].properties) {
						fieldsets[key].fields.push(propsKey);
					}
				} else {
					fieldsets[key].fields.push(key);
				}
			} else {
				fieldsets.general.fields.push(key);
			}
		}

		for(var key in fieldsets) {
			var isEmpty = (fieldsets[key].properties && 0 === Object.keys(fieldsets[key].properties).length) ||
				0 === fieldsets[key].fields.length;
			if(isEmpty) {
				delete fieldsets[key];
			}
		}

		return fieldsets;
	};

	// NOTE: Add fieldsets from the 'extra' layout (any duplicates in the original are replaced)
	var extendLayoutFieldsets = function(originalLayout, extraLayout) {
		var extended = [];
		var ordering = extraLayout.ordering || originalLayout.ordering;

		// NOTE: Assumes that all ordering fieldsets actually exist
		for(var i = 0, len = ordering.length; i < len; i++) {
			extended.push(extraLayout.fieldsets[ordering[i]] || originalLayout.fieldsets[ordering[i]]);
		}

		// Make sure any props in extra are added to the end
		if(!extraLayout.ordering) {
			var keys = Object.keys(extraLayout.fieldsets);
			for(var i = 0, len = keys.length; i < len; i++) {
				if(-1 === ordering.indexOf(keys[i])) {
					extended.push(extraLayout.fieldsets[keys[i]]);
				}
			}
		}

		return extended;
	};

	/**
	* Public static functions
	*/

	Scaffold.buildForm = function(options) {
		// TODO: _type:'config' should be set on the model
		var type = options.model.get('_type') || options.schemaType || 'config';
		var initialType = type;

		switch (type) {
			case 'component':
				type = options.model.get('_component');
				break;
			case 'page':
			case 'menu':
				type = 'contentobject';
				break;
			case '_courseStyle':
				type = 'course';
				break;
			case 'theme':
				type = options.schemaType;
				break;
		}

		var schema = new Schemas(type);

		if('_courseStyle' === initialType) {
			schema = _.pick(schema, 'customStyle');
		}

		options.model.schema = buildSchema(schema, options, type);
		options.fieldsets = buildFieldSets(initialType, type, options.model.schema);

		alternativeModel = options.alternativeModelToSave;
		alternativeAttribute = options.alternativeAttributeToSave;

		currentModel = options.model;

		var form = new Backbone.Form(options).render();
		currentForm = form;
		return form;
	};

	Scaffold.addEditorFieldset = function(jsonData) {

	};

	Scaffold.addCustomField = function(fieldName, view, overwrite) {
		// Check if field already exists
		if (Backbone.Form.editors[fieldName] && !overwrite) {
			return console.log("Sorry, the custom field you're trying to add already exists")
		} else {
			Backbone.Form.editors[fieldName] = view;
		}
	};

	Scaffold.addCustomValidator = function(name, validatorMethod) {
		var customValidator = {};
		if (!name) {
			return console.log('Custom Validators need a name');
		}
		if (!validatorMethod) {
			return console.log('Custom Validators need a validatorMethod');
		}
		customValidator.name = name;
		customValidator.validatorMethod = validatorMethod;
		customValidators.push(customValidator);
	};

	Scaffold.addCustomTemplate = function(templateName, template, overwrite) {
		// Check if arguments are correct
		if (!templateName) {
			return console.log('Custom Templates need a name');
		}
		if (!template) {
			return console.log('Custom Templates need a template');
		}
		// Check if custom template already exists
		if (customTemplates[templateName] && !overwrite) {
			return console.log("Sorry, the custom template you're trying to add already exists");
		} else {
			customTemplates[templateName] = template;
		}
	};

	Scaffold.getCurrentModel = function() {
		return currentModel;
	};

	Scaffold.getCurrentForm = function() {
		return currentForm;
	}

	Scaffold.getAlternativeModel = function() {
		return alternativeModel
	}

	Scaffold.getAlternativeAttribute = function() {
		return alternativeAttribute
	}

	// Listen to modal views
	Origin.on('scaffold:increaseActiveModals', function() {
		ActiveItemsModal++;
	});

	Origin.on('scaffold:decreaseActiveModals', function() {
		ActiveItemsModal--;
	});

	Scaffold.getCurrentActiveModals = function() {
		return ActiveItemsModal;
	};

	Scaffold.isOverlayActive = function() {
		return isOverlayActive;
	};

	Scaffold.setOverlayActive = function(booleanValue) {
		isOverlayActive = booleanValue;
	};

	// Example of customValidator
	/*Scaffold.addCustomValidator('title', function(value, formValues) {
		var err = {
            type: 'username',
            message: 'Usernames must be at least 3 characters long'
        };

        if (value.length < 3) return err;
	});*/

	Origin.scaffold = Scaffold;
});
