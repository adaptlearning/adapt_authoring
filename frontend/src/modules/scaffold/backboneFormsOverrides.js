define([
  'core/origin',
  'backbone-forms',
  'backbone-forms-lists',
], function(Origin, BackboneForms, BackboneFormsLists) {

  var templates = Handlebars.templates;
  var fieldTemplate = templates.field;
  var templateData = Backbone.Form.Field.prototype.templateData;
  var initialize = Backbone.Form.editors.Base.prototype.initialize;
  var listSetValue = Backbone.Form.editors.List.prototype.setValue;
  var textInitialize = Backbone.Form.editors.Text.prototype.initialize;
  var textAreaRender = Backbone.Form.editors.TextArea.prototype.render;
  var textAreaSetValue = Backbone.Form.editors.TextArea.prototype.setValue;

  Backbone.Form.prototype.constructor.template = templates.form;
  Backbone.Form.Fieldset.prototype.template = templates.fieldset;
  Backbone.Form.Field.prototype.template = fieldTemplate;
  Backbone.Form.NestedField.prototype.template = fieldTemplate;
  Backbone.Form.editors.List.prototype.constructor.template = templates.list;
  Backbone.Form.editors.List.Item.prototype.constructor.template = templates.listItem;

  // add reset to default handler
  Backbone.Form.Field.prototype.events = {
    'click [data-action="default"]': function() {
      this.setValue(this.editor.defaultValue);
      this.editor.trigger('change', this);

      return false;
    }
  };

  // merge schema into data
  Backbone.Form.Field.prototype.templateData = function() {
    return _.extend(templateData.call(this), this.schema, {
      isDefaultValue: _.isEqual(this.editor.value, this.editor.defaultValue)
    });
  };

  // use default from schema and set up isDefaultValue toggler
  Backbone.Form.editors.Base.prototype.initialize = function(options) {
    var schemaDefault = options.schema.default;

    if (schemaDefault !== undefined && options.id) {
      this.defaultValue = schemaDefault;
    }

    this.listenTo(this, 'change', function() {
      if (this.hasNestedForm) return;

      var isDefaultValue = _.isEqual(this.getValue(), this.defaultValue);

      this.form.$('[data-editor-id="' + this.id + '"]')
        .toggleClass('is-default-value', isDefaultValue);
    });

    initialize.call(this, options);
  };

  // process nested items
  Backbone.Form.editors.List.Modal.prototype.itemToString = function(value) {
    var createTitle = function(key) {
      var context = { key: key };

      return Backbone.Form.Field.prototype.createTitle.call(context);
    };

    value = value || {};

    //Pretty print the object keys and values
    var itemString = Origin.l10n.t('app.item');
    var itemsString = Origin.l10n.t('app.items');
    var parts = [];
    _.each(this.nestedSchema, function(schema, key) {
      var desc = schema.title ? schema.title : createTitle(key),
          val = value[key],
          pairs = '';

      if (Array.isArray(val)) {
        // print length
        val = val.length + ' ' + (val.length === 1 ? itemString : itemsString);
      } else if (typeof val === 'object') {
        // print nested name/value pairs
        for (var name in val) {
          if (val.hasOwnProperty(name)) {
            pairs += '<br>' + name + ' - ' + val[name];
          }
        }

        val = pairs;
      }

      if (_.isUndefined(val) || _.isNull(val)) val = '';

      // embolden key
      parts.push('<b>' + desc + '</b>: ' + val);
    });

    return parts.join('<br />');
  };

  // fix rerendering of lists
  // see https://github.com/powmedia/backbone-forms/pull/372
  Backbone.Form.editors.List.prototype.setValue = function(value) {
    this.items = [];

    listSetValue.call(this, value);
  }

  Backbone.Form.editors.List.prototype.render = function() {
    var self = this,
        value = this.value || [],
        $ = Backbone.$;

    //Create main element
    var $el = $($.trim(this.template({
      addLabel: this.schema.addLabel
    })));

    //Store a reference to the list (item container)
    this.$list = $el.is('[data-items]') ? $el : $el.find('[data-items]');

    //Add existing items
    if (value.length) {
      _.each(value, function(itemValue) {
        self.addItem(itemValue);
      });
    }

    //If no existing items create an empty one, unless the editor specifies otherwise
    else {
      if (!this.Editor.isAsync) this.addItem();
    }

    // cache existing element
    var domReferencedElement = this.el;

    this.setElement($el);

    // replace existing element
    if (domReferencedElement) {
      $(domReferencedElement).replaceWith(this.el);
    }

    this.$el.attr('id', this.id);
    this.$el.attr('name', this.key);

    if (this.hasFocus) this.trigger('blur', this);

    return this;
  }

  // accomodate sweetalert in item removal
  Backbone.Form.editors.List.prototype.removeItem = function(item) {
    //Confirm delete
    var confirmMsg = this.schema.confirmDelete;

    var remove = function(isConfirmed) {
      if (isConfirmed === false) return;

      var index = _.indexOf(this.items, item);

      this.items[index].remove();
      this.items.splice(index, 1);

      if (item.addEventTriggered) {
        this.trigger('remove', this, item.editor);
        this.trigger('change', this);
      }

      if (!this.items.length && !this.Editor.isAsync) this.addItem();
    }.bind(this);

    if (confirmMsg) {
      window.confirm({ title: confirmMsg, type: 'warning', callback: remove });
    } else {
      remove();
    }
  };

  // disable automatic completion on text fields if not specified
  Backbone.Form.editors.Text.prototype.initialize = function(options) {
    textInitialize.call(this, options);

    if (!this.$el.attr('autocomplete')) {
      this.$el.attr('autocomplete', 'off');
    }
  };

  // render ckeditor in textarea
  Backbone.Form.editors.TextArea.prototype.render = function() {
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
  };

  // get data from ckeditor in textarea
  Backbone.Form.editors.TextArea.prototype.getValue = function() {
    return this.editor.getData();
  };

  // set value in ckeditor
  Backbone.Form.editors.TextArea.prototype.setValue = function(value) {
    textAreaSetValue.call(this, value);

    if (this.editor) {
      this.editor.setData(value);
    }
  };

  // ckeditor removal
  Backbone.Form.editors.TextArea.prototype.remove = function() {
    this.editor.removeAllListeners();
    CKEDITOR.remove(this.editor);
  };

  // add override to allow prevention of validation
  Backbone.Form.prototype.validate = function(options) {
    var self = this,
        fields = this.fields,
        model = this.model,
        errors = {};

    options = options || {};

    //Collect errors from schema validation
    // passing in validate: false will stop validation of the backbone forms validators
    if (!options.skipModelValidate) {
      _.each(fields, function(field) {
        var error = field.validate();

        if (!error) return;

        var title = field.schema.title;

        if (title) {
            error.title = title;
        }

        errors[field.key] = error;
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
  };

  // allow hyphen to be typed in number fields
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

    var numeric = /^-?[0-9]*\.?[0-9]*?$/.test(newVal);

    if (numeric) {
      delayedDetermineChange();
    }
    else {
      event.preventDefault();
    }
  };

});
