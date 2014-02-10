define(function(require){

  var Backbone = require('backbone');
  var BuilderView = require('coreJS/core/views/builderView');
  var AdaptBuilder = require('coreJS/adaptBuilder');

  var NavigationView = BuilderView.extend({

    preRender: function() {
      this.listenTo(AdaptBuilder, 'login:changed', this.render);
      this.listenTo(AdaptBuilder, 'route:changed', this.routeChanged);
    },

    routeChanged: function ( info ) {
      console.log('Route changed ' + info.route);

      this.$('.active').removeClass('active');
      this.$('li[data-route="' + info.route + '"]').addClass('active');
    }

  }, {
    template: 'navigation'
  });

  return NavigationView;

});
