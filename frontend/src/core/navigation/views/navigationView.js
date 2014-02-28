define(function(require){

  var Backbone = require('backbone');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var NavigationView = OriginView.extend({

    tagName: 'nav',

    className: 'navigation',

    initialize: function() {
      this.render();
    },

    preRender: function() {
      this.listenTo(Origin, 'login:changed', this.render);
      this.listenTo(Origin, 'route:changed', this.routeChanged);
    },

    routeChanged: function (info) {
      this.$('.active').removeClass('active');
      this.$('li[data-route="' + info.route + '"]').addClass('active');
    }

  }, {
    template: 'navigation'
  });

  return NavigationView;

});
