define([
  'core/origin',
  'core/helpers',
  './schemas',
  'backbone-forms',
  'backbone-forms-lists',
  './backboneFormsOverrides',
  './views/scaffoldAssetView',
  './views/scaffoldCodeEditorView',
  './views/scaffoldColourPickerView',
  './views/scaffoldDisplayTitleView',
  './views/scaffoldItemsModalView',
  './views/scaffoldListView',
  './views/scaffoldTagsView'
], function(Origin, Helpers, Schemas, BackboneForms, BackboneFormsLists, Overrides, ScaffoldAssetView, ScaffoldCodeEditorView, ScaffoldColourPickerView, ScaffoldDisplayTitleView, ScaffoldItemsModalView, ScaffoldListView, ScaffoldTagsView) {

  var Scaffold = {};
  var builtSchemas = {};
  var alternativeModel;
  var alternativeAttribute;
  var currentModel;
  var currentForm;
  var ActiveItemsModal = 0;
  var isOverlayActive = false;
  var defaultValidators = Object.keys(Backbone.Form.validators);
  var customValidators = [];
  var customTemplates = [];

  Backbone.Form.editors.List.Modal.ModalAdapter = ScaffoldItemsModalView;

  function onScaffoldUpdateSchemas(callback, context) {
    Origin.trigger('schemas:loadData', function() {
      builtSchemas = {};
      callback.apply(context);
    });
  }

  function generateFieldObject(field, key) {
    var fieldType = field.type;
    var isFieldTypeObject = fieldType === 'object';
    var inputType = field.inputType;
    var items = field.items;
    var itemsProperties = items && items.properties;
    var itemsInputType = items && items.inputType;
    var confirmDelete = Origin.l10n.t('app.confirmdelete');

    var getTitle = function() {
      var title = field.title;

      if (title) {
        return title;
      }

      if (!isFieldTypeObject) {
        return Backbone.Form.Field.prototype.createTitle.call({ key: key }); 
      }
    };

    var getType = function() {
      if (inputType) {
        return inputType;
      }

      if (isFieldTypeObject) {
        return 'Object';
      }

      if (itemsProperties && Backbone.Form.editors[itemsInputType]) {
        return itemsInputType;
      }

      if (fieldType === 'array') {
        return 'List';
      }
    };

    var getValidators = function() {
      var validators = field.validators || [];

      for (var i = 0, j = validators.length; i < j; i++) {
        var validator = validators[i];

        if (!validator) continue;

        var isDefaultValidator = !Array.isArray(validator) && _.isObject(validator) ||
          _.contains(defaultValidators, validator);

        if (isDefaultValidator) continue;

        var customValidator = _.findWhere(customValidators, { name: validator });

        if (customValidator) {
          validators[i] = customValidator.validatorMethod;
          continue;
        }

        validators[i] = '';

        console.log('No validator of that sort – please register "' + validator +
          '" by using Origin.scaffold.addCustomValidator("' + validator +
          '", validatorMethod);');
      }

      return validators.filter(Boolean);
    };

    var fieldObject = {
      confirmDelete: itemsProperties ? confirmDelete : field.confirmDelete,
      default: field.default,
      editorAttrs: field.editorAttrs,
      editorClass: field.editorClass,
      fieldAttrs: field.fieldAttrs,
      fieldClass: field.fieldClass,
      help: field.help,
      itemType: itemsProperties ? 'Object' : itemsInputType,
      inputType: inputType,
      legend: field.legend,
      subSchema: isFieldTypeObject ? field.properties : itemsProperties || items,
      title: getTitle(),
      titleHTML: field.titleHTML,
      type: getType(),
      validators: getValidators()
    };

    if (_.isObject(inputType)) {
      // merge nested inputType attributes into fieldObject
      fieldObject = _.extend(fieldObject, inputType);
    }

    return fieldObject;
  }

  function setUpSchemaFields(field, key, schema, scaffoldSchema) {
    scaffoldSchema[key] = generateFieldObject(field, key);

    var objectSchema = schema[key].properties || schema[key].subSchema;
    var scaffoldObjectSchema = scaffoldSchema[key].subSchema;

    for (var i in objectSchema) {
      if (objectSchema.hasOwnProperty(i)) {
        setUpSchemaFields(objectSchema[i], i, objectSchema, scaffoldObjectSchema);
      }
    }
  }

  function buildSchema(schema, options, type) {
    // these types of schemas change frequently and cannot be cached
    var isVolatileType = _.contains([
      'course',
      'config',
      'article',
      'block',
      'component'
    ], type);

    var builtSchema = builtSchemas[type];

    if (!isVolatileType && builtSchema) {
      return builtSchema;
    }

    var scaffoldSchema = {};

    for (var key in schema) {
      if (schema.hasOwnProperty(key)) {
        setUpSchemaFields(schema[key], key, schema, scaffoldSchema);
      }
    }

    // only cache non-volatile types
    if (!isVolatileType) {
      builtSchemas[type] = scaffoldSchema;
    }

    return scaffoldSchema;
  }

  function buildFieldsets(schema, options) {
    var fieldsets = {
      general: { key: 'general', legend: Origin.l10n.t('app.scaffold.general'), fields: [] },
      properties: { key: 'properties', legend: Origin.l10n.t('app.scaffold.properties'), fields: [] },
      settings: { key: 'settings', legend: Origin.l10n.t('app.scaffold.settings'), fields: [] },
      extensions: { key: 'extensions', legend: Origin.l10n.t('app.scaffold.extensions'), fields: [ '_extensions' ] }
    };

    for (var key in schema) {
      if (!schema.hasOwnProperty(key) || key === '_extensions') continue;

      var value = schema[key];

      if (value.isSetting) {
        fieldsets.settings.fields.push(key);
        continue;
      }

      if (value.type !== 'object') {
        fieldsets.general.fields.push(key);
        continue;
      }

      // if value is an object, give it some rights and add it as field set
      if (fieldsets[key]) {
        fieldsets[key].fields.push(key);
      } else {
        fieldsets[key] = { key: key, legend: Helpers.keyToTitleString(key), fields: [ key ] };
      }
    }

    if (!schema._extensions) {
      delete fieldsets.extensions;
    }

    if (!fieldsets.settings.fields.length) {
      delete fieldsets.settings;
    }

    if (!fieldsets.properties.fields.length) {
      delete fieldsets.properties;
    }

    return _.values(fieldsets);
  }

  Scaffold.buildForm = function(options) {
    var model = options.model;
    var type = model.get('_type') || model._type;

    switch (type) {
      case 'menu':
      case 'page':
        type = 'contentobject';
        break;
      case 'component':
        type = model.get('_component');
    }

    var schema = new Schemas(type);

    options.model.schema = buildSchema(schema, options, type);
    options.fieldsets = buildFieldsets(schema, options);
    alternativeModel = options.alternativeModelToSave;
    alternativeAttribute = options.alternativeAttributeToSave;
    currentModel = options.model;
    currentForm = new Backbone.Form(options).render();

    return currentForm;
  };

  Scaffold.addCustomField = function(fieldName, view, overwrite) {
    if (Backbone.Form.editors[fieldName] && !overwrite) {
      console.log('Sorry, the custom field you’re trying to add already exists');
    } else {
      Backbone.Form.editors[fieldName] = view;
    }
  };

  Scaffold.addCustomTemplate = function(templateName, template, overwrite) {
    if (!templateName || !template) {
      return console.log('Custom templates need a name and template');
    }

    if (customTemplates[templateName] && !overwrite) {
      console.log('Sorry, the custom template you’re trying to add already exists');
    } else {
      customTemplates[templateName] = template;
    }
  };

  Scaffold.addCustomValidator = function(name, validatorMethod) {
    if (!name || !validatorMethod) {
      console.log('Custom validators need a name and validatorMethod');
    } else {
      customValidators.push({ name: name, validatorMethod: validatorMethod });
    }
  };

  // example of customValidator
  /*Scaffold.addCustomValidator('title', function(value, formValues) {
    var err = {
      type: 'username',
      message: 'Usernames must be at least three characters long'
    };

    if (value.length < 3) return err;
  });*/

  Scaffold.getCurrentModel = function() { return currentModel; };
  Scaffold.getCurrentForm = function() { return currentForm; };
  Scaffold.getAlternativeModel = function() { return alternativeModel; };
  Scaffold.getAlternativeAttribute = function() { return alternativeAttribute; };
  Scaffold.getCurrentActiveModals = function() { return ActiveItemsModal; };
  Scaffold.isOverlayActive = function() { return isOverlayActive; };
  Scaffold.setOverlayActive = function(booleanValue) { isOverlayActive = booleanValue; };
  Scaffold.addCustomField('Boolean', Backbone.Form.editors.Checkbox);
  Scaffold.addCustomField('QuestionButton', Backbone.Form.editors.Text);

  Origin.on({
    'scaffold:updateSchemas': onScaffoldUpdateSchemas,
    'scaffold:increaseActiveModals': function() { ActiveItemsModal++; },
    'scaffold:decreaseActiveModals': function() { ActiveItemsModal--; },
  });

  Origin.scaffold = Scaffold;

});
