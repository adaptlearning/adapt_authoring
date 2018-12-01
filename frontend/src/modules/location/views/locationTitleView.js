// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var Backbone = require('backbone');

  var LocationTitleView = Backbone.View.extend({
    el: '.location-title',

    initialize: function() {
      this.listenTo(Origin, {
        'location:title:update': this.render,
        'location:title:hide': this.onHideTitle
      });
      this.render();
    },

    render: function() {
      var template = Handlebars.templates[this.constructor.template];
      var location = Origin.location;

      if(location) {
        var mod = location.module;
        var type = location.route2;
        var action = location.route4;
        console.log('LocationTitleView#render: titles.' + mod + '.' + type + (action ? '.' + action : ''), location);
        var title = 'titles.' + mod + (type ? '.' + type : '') + (action ? '.' + action : '');
      }
      this.$el.html(template({ title: title }));
      _.defer(_.bind(this.postRender, this));
      return this;
    },

    postRender: function() {
      this.$el.removeClass('display-none');
      Origin.trigger('location:title:postRender', this);
    },

    onHideTitle: function() {
      this.$el.addClass('display-none');
    }
  }, {
    template: 'locationTitle'
  });

  return LocationTitleView;
});
