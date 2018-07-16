// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');

  var ContentPaneView = Backbone.View.extend({
    className: 'contentPane',

    visibleCSS: {
      opacity: 1
    },
    hiddenCSS: {
      opacity: 0
    },
    animDuration: 500,

    initialize: function() {
      this.listenToEvents();
      this.render();
    },

    listenToEvents: function() {
      this.listenTo(Origin, 'remove:views', this.removeView);
      this.$el.scroll(_.bind(this.onScroll, this));
      $(window).on('resize', _.bind(this.resize, this));
    },

    render: function() {
      var template = Handlebars.templates[this.constructor.template];
      this.$el.html(template());
      return this;
    },

    // expects a backbone view
    setView: function(view) {
      if(!view.$el || !view.$el[0] || !_.isElement(view.$el[0])) {
        console.log('ContentPaneView.setView: expects a Backbone.View instance, received', view);
      }
      if(this.$('.contentPane-inner').html() !== '') {
        this.removeView();
      }
      this.$('.contentPane-inner').html(view.$el);
      Origin.trigger('contentPane:changed');
      this.animateIn(_.bind(this.resize, this));
    },

    removeView: function(cb) {
      this.$('.contentPane-inner').empty();
      if(cb) cb.apply(this);
      Origin.trigger('contentPane:emptied');
    },

    animateIn: function(cb) {
      this.$el.css(this.hiddenCSS);
      this.$el.velocity(
        this.visibleCSS,
        this.animDuration,
        cb ? _.bind(cb, this) : undefined
      );
    },

    resize: function() {
      var windowHeight = $(window).height();
      this.$el.height(windowHeight - this.$el.offset().top);
    },

    onScroll: function(e) {
      Origin.trigger('contentPane:scroll', this.$el.scrollTop());
    }
  }, {
    template: 'contentPane'
  });

  return ContentPaneView;
});
