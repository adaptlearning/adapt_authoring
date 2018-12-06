// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var Backbone = require('backbone');

  var LocationTitleView = Backbone.View.extend({
    el: '.location-title',

    initialize: function() {
      this.listenTo(Origin, {
        'router': this.render,
        'location:title:hide': this.hide
      });
      this.render();
    },

    render: function() {
      this.hide();

      var template = Handlebars.templates[this.constructor.template];
      var location = Origin.location;

      if(!location || !location.module) {
        return;
      }
      var mod = location.module.toLowerCase();
      var page = location.route1;
      var type = location.route2;
      var action = location.route4;

      var title = mod + '.titles.' + mod;

      if(page && !type) {
        title += '.' + page.toLowerCase();
      } else {
        if(type) title += '.' + type.toLowerCase();
        if(action) title += '.' + action.toLowerCase();
      }
      console.log('LocationTitleView#render:', title, location);

      if(!Origin.l10n.has(title)) {
        console.warn('Missing', title);
        return;
      }
      this.$el.html(template({ title: Origin.l10n.t(title) }));
      _.defer(_.bind(this.postRender, this));
      return this;
    },

    postRender: function() {
      this.show();
      Origin.trigger('location:title:postRender', this);
    },

    show: function() {
      this.$el.removeClass('display-none');
    },

    hide: function() {
      this.$el.addClass('display-none');
    }
  }, {
    template: 'locationTitle'
  });

  return LocationTitleView;
});
