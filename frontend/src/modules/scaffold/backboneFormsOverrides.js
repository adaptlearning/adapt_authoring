define([
  'core/origin',
  'backbone-forms'
], function(Origin, BackboneForms) {

  var templates = Handlebars.templates;
  var fieldTemplate = templates.field;
  var templateData = Backbone.Form.Field.prototype.templateData;
  var initialize = Backbone.Form.editors.Base.prototype.initialize;
  var textInitialize = Backbone.Form.editors.Text.prototype.initialize;
  var textAreaRender = Backbone.Form.editors.TextArea.prototype.render;
  var textAreaSetValue = Backbone.Form.editors.TextArea.prototype.setValue;

  Backbone.Form.prototype.constructor.template = templates.form;
  Backbone.Form.Fieldset.prototype.template = templates.fieldset;
  Backbone.Form.Field.prototype.template = fieldTemplate;
  Backbone.Form.NestedField.prototype.template = fieldTemplate;

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

    function until(conditionFunction) {
      function poll(resolve) {
        if (conditionFunction()) {
          resolve();
          return;
        }
        setTimeout(function() {
          poll(resolve)
        }, 10);
      }
      return new Promise(poll);
    }
    function isAttached($element) {
      return function() {
        return Boolean($element.parents('body').length);
      };
    }

    function convertStringsToRegExDeep (arr) {
      function processEntry ([key, value]) {
        value = (typeof value === "string")
          ? new RegExp(value, 'i')
          : Array.isArray(value)
            ? arr.map((value, index) => processEntry([index, value])[1])
            : (typeof value === "object" && value !== null)
              ? Object.fromEntries(Object.entries(value).map(processEntry))
              : value;
        return [key, value];
      }
      return arr.map((value, index) => processEntry([index, value])[1])
    }

    until(isAttached(this.$el)).then(() => {
      return CKEDITOR.create(this.$el[0], {
        dataIndentationChars: '',
        disableNativeSpellChecker: false,
        enterMode: CKEDITOR[Origin.constants.ckEditorEnterMode],
        entities: false,
        htmlSupport: {
          // Convert all allow/disallow strings to regexp, as config is json only
          allow: convertStringsToRegExDeep((Origin.constants.ckEditorHtmlSupport && Origin.constants.ckEditorHtmlSupport.allow) || []),
          disallow: convertStringsToRegExDeep((Origin.constants.ckEditorHtmlSupport && Origin.constants.ckEditorHtmlSupport.disallow) || [])
        },
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
        plugins: window.CKEDITOR.pluginsConfig,
        toolbar: {
          items: [
            'sourceEditing',
            'showBlocks',
            'undo',
            'redo',
            '|',
            'findAndReplace',
            'selectAll',
            '|',
            'numberedList',
            'bulletedList',
            'blockQuote',
            'indent',
            'outdent',
            '|',
            'bold',
            'italic',
            'underline',
            'strikethrough',
            'subscript',
            'superscript',
            'alignment',
            'removeFormat',
            '|',
            'link',
            'fontColor',
            'fontBackgroundColor',
            '|',
            'specialCharacters',
            'insertTable'
          ],
          shouldNotGroupWhenFull: true
        }
      }).then(editor => {
        this.editor = editor
        CKEDITOR.instances = CKEDITOR.instances || []
        CKEDITOR.instances.length = CKEDITOR.instances.length || 0;
        this.editor.id = CKEDITOR.instances.length
        CKEDITOR.instances.length++;
        CKEDITOR.instances[this.editor.id] = this.editor
      })
    });
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
    this.editor.stopListening()
    delete CKEDITOR.instances[this.editor.id]
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
