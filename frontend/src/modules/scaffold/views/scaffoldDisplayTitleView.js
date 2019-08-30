define([ 'core/origin', 'backbone-forms' ], function(Origin, BackboneForms) {

  var ScaffoldDisplayTitleView = Backbone.Form.editors.Text.extend({

    tagName: 'div',

    form: null,

    isLocked: false,

    events: {
      'change input': 'triggerChange',
      'keyup input': 'triggerChange',
      'focus input': function() {
        this.trigger('focus', this);
      },
      'blur input': function() {
        this.trigger('blur', this);
      },
      'click .scaffold-display-title-clear': function(event) {
        event.preventDefault();

        this.isLocked = false;
        this.setValue('');
      },
      'click .scaffold-display-title-lock': function(event) {
        event.preventDefault();

        this.isLocked = !this.isLocked;
        this.toggleLockButton();

        if (this.isLocked) {
          this.setValue(this.form.fields.title.editor.getValue());
        }
      }
    },

    initialize: function(options) {
      Backbone.Form.editors.Text.prototype.initialize.call(this, options);

      this.form = options.form;
      this.listenTo(this, 'change', this.onDisplayTitleChange);
      this.listenTo(this.form, 'title:change', this.onTitleChange);
    },

    render: function() {
      this.$el.append(Handlebars.templates[this.constructor.template]({ field: '' }));
      this.setValue(this.value);

      if (this.form.fields.title.editor.getValue() === this.getValue()) {
        this.isLocked = true;
        this.toggleLockButton();
      }

      return this;
    },

    triggerChange: function() {
      this.trigger('change', this);
    },

    onDisplayTitleChange: function() {
      this.toggleLockButton();
      this.toggleClearButton();
    },

    onTitleChange: function(form, titleEditor) {
      if (this.isLocked) {
        this.setValue(titleEditor.getValue());
      }
    },

    getValue: function() {
      return this.$('input').val();
    },

    setValue: function(value) {
      this.$('input').val(value).trigger('change');
    },

    focus: function() {
      if (!this.hasFocus) {
        this.$('input').focus();
      }
    },

    blur: function() {
      if (this.hasFocus) {
        this.$('input').blur();
      }
    },

    toggleLockButton: function() {
      this.$el.parents('.field').toggleClass('unlocked', !this.isLocked);
      this.$('input').prop('disabled', this.isLocked);
    },

    toggleClearButton: function() {
      this.$('.scaffold-display-title-clear')
        .toggleClass('display-none', !this.getValue());
    }

  }, { template: 'scaffoldDisplayTitle' });

  Origin.on('origin:dataReady', function() {
    Origin.scaffold.addCustomField('DisplayTitle', ScaffoldDisplayTitleView);
  });

  return ScaffoldDisplayTitleView;

});
