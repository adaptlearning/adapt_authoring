// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Origin = require('core/origin');

  var ModalView = Backbone.View.extend({

    className: 'modal',

    events: {
      'click .modal-popup-close': 'onCloseButtonClicked',
      'click .modal-popup-done': 'onDoneButtonClicked'
    },

    initialize: function(options) {
      var defaults = {
        _shouldShowCancelButton: true,
        _shouldShowDoneButton: true,
        _shouldDisableCancelButton: false,
        _shouldDisableDoneButton: false
      }
      this.view = options.view;
      this.options = _.extend(defaults, options.options);
      this.context = options.context;
      this.listenTo(Origin, 'remove:views', this.remove);
      this.listenTo(Origin, 'modal:onCancel', this.onCloseButtonClicked);
      this.listenTo(Origin, 'modal:onUpdate', this.onDoneButtonClicked);
      this.listenTo(Origin, 'modal:disableCancelButton', this.onCloseButtonDisabled);
      this.listenTo(Origin, 'modal:disableDoneButton', this.onDoneButtonDisabled);
      this.listenTo(Origin, 'modal:enableCancelButton', this.onCloseButtonEnabled);
      this.listenTo(Origin, 'modal:enableDoneButton', this.onDoneButtonEnabled);
      this.render();
    },

    render: function() {
      var data = _.omit(this.options, 'model');
      var template = Handlebars.templates['modal'];
      this.$el.html(template(data)).appendTo('body');
      _.defer(_.bind(this.postRender, this));
      
      return this;
    },

    postRender: function() {
      if (this.options._shouldDisableCancelButton) {
        this.onCloseButtonDisabled();
      }
      if (this.options._shouldDisableDoneButton) {
        this.onDoneButtonDisabled();
      }
      this.modalView = new this.view(this.options);
      this.$('.modal-popup-content-inner').append(this.modalView.$el);
      $('html').addClass('no-scroll');
    },

    onCloseButtonClicked: function(event) {
      if (event) event.preventDefault();
      this.closeModal('onCancel');
    },

    onDoneButtonClicked: function(event) {
      if (event) event.preventDefault();
      this.closeModal('onUpdate');
    },

    onCloseButtonDisabled: function() {
      this.$('.modal-popup-close').attr('disabled', true);
    },

    onDoneButtonDisabled: function() {
      this.$('.modal-popup-done').attr('disabled', true);
    },

    onCloseButtonEnabled: function() {
      this.$('.modal-popup-close').attr('disabled', false);
    },

    onDoneButtonEnabled: function() {
      this.$('.modal-popup-done').attr('disabled', false);
    },

    closeModal: function(callbackType) {
      var data = this.modalView.getData();
      if (this.options[callbackType]) {
        this.options[callbackType].call(this.context, data);
      }
      this.modalView.remove();
      Origin.trigger('modal:closed');
      $('html').removeClass('no-scroll');
      this.remove();
    }

  });

  return ModalView;

});
