define([
  'core/origin',
  'backbone-forms',
  'backbone-forms-lists',
], function(Origin, BackboneForms, BackboneFormsLists) {

  var templates = Handlebars.templates;
  var fieldTemplate = templates.field;
  var templateData = Backbone.Form.Field.prototype.templateData;
  var textInitialize = Backbone.Form.editors.Text.prototype.initialize;
  var textAreaRender = Backbone.Form.editors.TextArea.prototype.render;

  Backbone.Form.prototype.constructor.template = templates.form;
  Backbone.Form.Fieldset.prototype.template = templates.fieldset;
  Backbone.Form.Field.prototype.template = fieldTemplate;
  Backbone.Form.NestedField.prototype.template = fieldTemplate;
  Backbone.Form.editors.List.prototype.constructor.template = templates.list;
  Backbone.Form.editors.List.Item.prototype.constructor.template = templates.listItem;

  // add legend to data
  Backbone.Form.Field.prototype.templateData = function() {
    var data = templateData.call(this);

    data.legend = this.schema.legend;

    return data;
  };

  // process nested items
  Backbone.Form.editors.List.Modal.prototype.itemToString = function(value) {
    var createTitle = function(key) {
      var context = { key: key };

      return Form.Field.prototype.createTitle.call(context);
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
        val = val.length += ' ' + val.length === 1 ? itemString : itemsString;
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
        extraAllowedContent: 'span(*)',
        on: {
          instanceReady: function() {
            var writer = this.dataProcessor.writer;

            writer.lineBreakChars = '';

            writer.setRules( 'p', {
              indent: false,
              breakBeforeOpen: false,
              breakAfterOpen: false,
              breakAfterClose: false
            });
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
