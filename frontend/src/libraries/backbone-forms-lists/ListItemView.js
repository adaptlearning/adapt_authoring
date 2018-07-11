define([
  'backbone-forms'
], function(Form) {
  'use strict';
  
    /**
   * A single item in the list
   *
   * @param {editors.List} options.list The List editor instance this item belongs to
   * @param {Function} options.Editor   Editor constructor function
   * @param {String} options.key        Model key
   * @param {Mixed} options.value       Value
   * @param {Object} options.schema     Field schema
   */
  // Form.editors.List.Item = Form.editors.Base.extend({
  var ListItemView = Form.editors.Base.extend({

    events: {
      'click [data-action="remove"]': function(event) {
        event.preventDefault();
        this.list.removeItem(this);
      },
      'keydown input[type=text]': function(event) {
        if(event.keyCode !== 13) return;
        event.preventDefault();
        this.list.addItem();
        this.list.$list.find("> li:last input").focus();
      }
    },

    initialize: function(options) {
      this.list = options.list;
      this.schema = options.schema || this.list.schema;
      this.value = options.value;
      this.Editor = options.Editor || Form.editors.Text;
      this.key = options.key;
      this.template = options.template || this.schema.itemTemplate || this.constructor.template;
      this.errorClassName = options.errorClassName || this.constructor.errorClassName;
      this.form = options.form;
    },

    render: function() {
      var $ = Backbone.$;

      //Create editor
      this.editor = new this.Editor({
        key: this.key,
        schema: this.schema,
        value: this.value,
        list: this.list,
        item: this,
        form: this.form
      }).render();

      //Create main element
      var $el = $($.trim(this.template()));

      $el.find('[data-editor]').append(this.editor.el);

      //Replace the entire element so there isn't a wrapper tag
      this.setElement($el);

      return this;
    },

    getValue: function() {
      return this.editor.getValue();
    },

    setValue: function(value) {
      this.editor.setValue(value);
    },

    focus: function() {
      this.editor.focus();
    },

    blur: function() {
      this.editor.blur();
    },

    remove: function() {
      this.editor.remove();

      Backbone.View.prototype.remove.call(this);
    },

    validate: function() {
      var value = this.getValue(),
          formValues = this.list.form ? this.list.form.getValue() : {},
          validators = this.schema.validators,
          getValidator = this.getValidator;

      if (this.editor.nestedForm && this.editor.nestedForm.validate) {
        return this.editor.nestedForm.validate();
      }

      if (!validators) return null;

      //Run through validators until an error is found
      var error = null;
      _.every(validators, function(validator) {
        error = getValidator(validator)(value, formValues);

        return error ? false : true;
      });

      //Show/hide error
      if (error){
        this.setError(error);
      } else {
        this.clearError();
      }

      //Return error to be aggregated by list
      return error ? error : null;
    },

    /**
     * Show a validation error
     */
    setError: function(err) {
      this.$el.addClass(this.errorClassName);
      this.$el.attr('title', err.message);
    },

    /**
     * Hide validation errors
     */
    clearError: function() {
      this.$el.removeClass(this.errorClassName);
      this.$el.attr('title', null);
    }
  }, {

    //STATICS
    template: _.template('\
      <div>\
        <span data-editor></span>\
        <button type="button" data-action="remove">&times;</button>\
      </div>\
    ', null, Form.templateSettings),

    errorClassName: 'error'

  });

  return ListItemView;

});