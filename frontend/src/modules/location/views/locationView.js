// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var Backbone = require('backbone');

  var LocationView = Backbone.View.extend({
    el: '.location',

    initialize: function() {
      this.listenTo(Origin, {
        'router': this.render,
        'location:title:hide': this.hide
      });
      this.render();
    },

    render: function() {
      this.hide();

      var title = this.generateTitleString();
      if(!title) return;

      console.log('LocationView#render:', title, location);

      var compiled = Handlebars.templates[this.constructor.template]({ title: title });
      this.$el.html(compiled);
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
    },

    generateTitleString: function() {
      var location = Origin.location;

      if(_.isEmpty(location)) {
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
      if(!Origin.l10n.has(title)) {
        return console.warn('Missing', title);
      }
      return Origin.l10n.t(title);
    }
  }, {
    template: 'location'
  });

  return LocationView;
});
