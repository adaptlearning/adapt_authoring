define([ 'core/origin' ], function(Origin) {

  var ScaffoldItemsModalView = Backbone.View.extend({

    className: 'scaffold-items-modal',

    content: null,

    initialize: function(options) {
      this.content = options.content;
      this.listenTo(Origin, 'remove:views', this.remove);
      Origin.trigger('scaffold:increaseActiveModals');
      this.toggleModalOverlay();
      this._onKeyUp = this.onKeyUp.bind(this);
    },

    events: {
      'click .scaffold-items-modal-footer a': function(event) {
        event.preventDefault();

        this.trigger($(event.currentTarget).data('action'));
        this.close();
      }
    },

    render: function() {
      var template = Handlebars.templates[this.constructor.template];
      var data = this.model && this.model.toJSON();

      $('body').append(this.$el.html(template(data)));
      this.$('.scaffold-items-modal-body').html(this.content.render().$el);
      _.defer(this.postRender.bind(this));

      return this;
    },

    postRender: function() {
      this.$el.addClass('show');
    },

    onKeyUp: function(event) {
      if (event.which !== 27) return;

      this.trigger('cancel');
      this.close();
    },

    open: function() {
      this.render();
      $(document).keyup(this._onKeyUp);
    },

    close: function() {
      if (this._preventClose) {
        this._preventClose = false;
        return;
      }

      Origin.trigger('scaffold:decreaseActiveModals');
      this.toggleModalOverlay();
      $(document).off('keyup', this._onKeyUp);
      this.remove();
    },

    preventClose: function() {
      this._preventClose = true;
    },

    toggleModalOverlay: function() {
      var modalCount = Origin.scaffold.getCurrentActiveModals();

      switch (modalCount) {
        case 1:
          if (Origin.scaffold.isOverlayActive()) return;

          Origin.scaffold.setOverlayActive(true);
          $('body').append(Handlebars.templates.scaffoldModalOverlay);
          break;
        case 0:
          if (!Origin.scaffold.isOverlayActive()) return;

          Origin.scaffold.setOverlayActive(false);
          $('.scaffold-modal-overlay').remove();
      }
    }

  }, { template: 'scaffoldItemsModal' });

  return ScaffoldItemsModalView;

});