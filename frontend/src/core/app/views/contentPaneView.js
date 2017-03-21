// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');

  var ContentPaneView = Backbone.View.extend({
    className: 'contentPane',

    visibleCSS: {
      left: 0,
      opacity: 1
    },
    hiddenCSS: {
      left: '10%',
      opacity: 0
    },
    animDuration: 300,

    initialize: function() {
      this.listenTo(Origin, {
        'contentPane:show': this.show,
        'contentPane:hide': this.hide
      });
      $(window).on('resize', _.bind(this.resize, this));

      this.render();
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
      this.removeView();
      this.$('.contentPane-inner').html(view.$el);
      this.animateIn(_.bind(this.resize, this));
    },

    removeView: function(cb) {
      this.$('.contentPane-inner').empty();
      if(cb) cb.apply(this);
    },

    animateIn: function(cb) {
      this.$el.css(this.hiddenCSS);
      this.$el.velocity(
        this.visibleCSS,
        this.animDuration,
        cb ? _.bind(cb, this) : undefined
      );
    },

    show: function(element) {
      console.log('contentPaneView.show');
      this.animateIn();
    },

    hide: function() {
      console.log('contentPaneView.hide');
      this.animateOut();
    },

    resize: function() {
      var windowHeight = $(window).height();
      this.$el.height(windowHeight - this.$el.offset().top);
    }
  }, {
    template: 'contentPane'
  });

  return ContentPaneView;
});
