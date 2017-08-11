// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

	var Origin = require('core/origin');
  var _ = require('underscore');
	var BackboneForms = require('backbone-forms');
	var BackboneFormsLists = require('backbone-forms-lists');
	var ScaffoldItemsModalView = require('./views/scaffoldItemsModalView');
	var ScaffoldImageView = require('./views/scaffoldAssetView');
	var ScaffoldBooleanView = require('./views/scaffoldBooleanView');
	var ScaffoldTagsView = require('./views/scaffoldTagsView');
	var ScaffoldQuestionButtonView = require('./views/scaffoldQuestionButtonView');
	var ScaffoldColorPickerView = require('./views/scaffoldColorPickerView');
	var ScaffoldDisplayTitleView = require('./views/scaffoldDisplayTitleView');
  var ScaffoldCodeEditorView = require('./views/scaffoldCodeEditorView');
	var ScaffoldTextAreaView = require('./views/scaffoldTextAreaView');
	var Schemas = require('./schemas');
	var Overrides = require('./backboneFormsOverrides');
	var Helpers = require('core/helpers');
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

	Backbone.Form.editors.List.Modal.ModalAdapter = ScaffoldItemsModalView;

	var defaultValidators = _.keys(Backbone.Form.validators);
	var types = ['string', 'number', 'boolean', 'object', 'objectid', 'date', 'array'];
	var customValidators = [];
	var customTemplates = [];

	Origin.on('scaffold:updateSchemas', function(callback, context) {
		Origin.trigger('schemas:loadData', function() {
			resetSchemas();
			callback.apply(context);
		});
	});

	var resetSchemas = function() {
		builtSchemas = {};
	}

	var setupSchemaFields = function(field, key, schema, scaffoldSchema) {
		if (field.type === 'array') {

			if (field.items && field.items.properties) {
				// If Array type has inputType - should use the inputType to render a fieldObject
				if (field.inputType) {
					var fieldObject = {
						type: field.inputType,
						help: field.help,
						default: field.default,
						fieldType: field.inputType,
						subSchema: field.items.properties
					};

					if (_.isObject(field.inputType)) {
						fieldObject = _.extend(fieldObject, field.inputType);
					}
					scaffoldSchema[key] = fieldObject;
				} else {
					scaffoldSchema[key] = {
						type:  (Backbone.Form.editors[field.items.inputType]) ? field.items.inputType : 'List',
						itemType: 'Object',
						subSchema: field.items.properties,
            confirmDelete: Origin.l10n.t('app.confirmdelete'),
						fieldType: 'List'
					}
				}

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
					}
				}
			}

			var objectSchema = (schema[key].properties || schema[key].subSchema);
			var scaffoldObjectSchema = scaffoldSchema[key].subSchema;

			_.each(objectSchema, function(field, key) {
				setupSchemaFields(field, key, objectSchema, scaffoldObjectSchema);
			});

		} else if (field.type != 'object' || field.inputType) {

			var validators = [];
			// Go through each validator checking whether this is a default
			// or a custom validator
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
            if (validator !== '') {
              var customValidator = _.findWhere(customValidators, {name: validator});
              if (!customValidator) {
                console.log('No validator of that sort - please register: "' + validator + '" by using Origin.scaffold.addCustomValidator(name, validatorMethod)');
              }
              // If match is found - add the method
              validators.push(customValidator.validatorMethod);
            }
					}
				}
			})

			// Check if inputType is an object
			// if so extend

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

		} else {

			scaffoldSchema[key] = {
				type: 'Object',
				subSchema: field.properties
			}

			var objectSchema = (schema[key].properties || schema[key].subSchema);
			var scaffoldObjectSchema = scaffoldSchema[key].subSchema;

			_.each(objectSchema, function(field, key) {
				setupSchemaFields(field, key, objectSchema, scaffoldObjectSchema);
			});

		}

		if (field.title) {
			scaffoldSchema[key].title = field.title;

		} else if (field.type === 'object' || field.type === 'array') {
			scaffoldSchema[key].title = '';
			scaffoldSchema[key].legend = field.legend;
		}
	}

	var buildSchema = function(schema, options, type) {

    	try {
            // These types of schemas change frequently and cannot be cached.
    	    var volatileTypes = ['course', 'config', 'article', 'block', 'component'];

    	    if (_.indexOf(volatileTypes, type) == -1 && builtSchemas[type]) {
    	       return builtSchemas[type];
            }

            var scaffoldSchema = {};

            _.each(schema, function(field, key) {
    	       // Build schema
                setupSchemaFields(field, key, schema, scaffoldSchema);
            });

            // Only cache non-volatile types.
            if (_.indexOf(volatileTypes, type) == -1) {
                builtSchemas[type] = scaffoldSchema;
            }

            return scaffoldSchema;
        } catch (e) {
            alert('buildSchema - ' + e.message);
        }
	}

	var buildFieldsets = function(schema, options) {

		// Setup default fieldsets
		var fieldsets = {
			general: {
				legend: Origin.l10n.t('app.general'),
				fields: []
			},
			// ::TODO
			// I want to remove this please
			properties: {
				legend: Origin.l10n.t('app.properties'),
				fields: []
			},
			settings :{
				legend: Origin.l10n.t('app.settings'),
				fields: []
			},
			extensions: {
				legend: Origin.l10n.t('app.extensions'),
				fields: ['_extensions']
			}
		};

		_.each(schema, function(value, key) {
			// Build main fieldSets
			// Check if field is a settings
			if (key === '_extensions') {
				return;
			}

			if (value.isSetting) {

				fieldsets.settings.fields.push(key);

			} else  if (value.type === 'object') {
				// If value is an object - should give it some rights
				// and add it as a field set - but not _extensions
				if (fieldsets[key]) {

					fieldsets[key].fields.push(key);

				} else {

					fieldsets[key] = {
						legend: Helpers.keyToTitleString(key),
						fields: [key]
					};

				}

			} else {

				// All general ones here please
				fieldsets.general.fields.push(key);

			}
		});

		// Should check if no settings and no extensions are available
		if (!schema._extensions) {
			delete fieldsets.extensions;
		}

		// Delete empty field sets
		if (fieldsets.settings.fields.length === 0) {
			delete fieldsets.settings;
		}

		if (fieldsets.properties.fields.length === 0) {
			delete fieldsets.properties;
		}

		// We only want the values
		return _.values(fieldsets);

	}

	Scaffold.buildForm = function(options) {
    try {
      var type = options.model.get('_type') || options.schemaType || options.model._type;
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

      // Support ommission of attributes for certain types
      switch (initialType) {
        case '_courseStyle':
          schema = _.pick(schema, 'customStyle');
          break;
      }

      options.model.schema = buildSchema(schema, options, type);
      options.fieldsets = buildFieldsets(schema, options);
      alternativeModel = options.alternativeModelToSave;
      alternativeAttribute = options.alternativeAttributeToSave;
      currentModel = options.model;

      var form = new Backbone.Form(options).render();
      currentForm = form;

      return form;
    } catch (e) {
      alert(e.message);
    }

	}

	Scaffold.addCustomField = function(fieldName, view, overwrite) {
		// Check if field already exists
		if (Backbone.Form.editors[fieldName] && !overwrite) {
			return console.log("Sorry, the custom field you're trying to add already exists")
		} else {
			Backbone.Form.editors[fieldName] = view;
		}

	}

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
	}

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
	}

	Scaffold.isOverlayActive = function() {
		return isOverlayActive;
	}

	Scaffold.setOverlayActive = function(booleanValue) {
		isOverlayActive = booleanValue;
	}

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
