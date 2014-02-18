define(function(require){

  var Backbone = require('backbone');
  var BuilderView = require('coreJS/core/views/builderView');
  var AdaptBuilder = require('coreJS/adaptbuilder');

  var NavigationView = BuilderView.extend({

    preRender: function() {
      this.listenTo(AdaptBuilder, 'login:changed', this.render, this);
      this.listenTo(AdaptBuilder, 'route:changed', this.routeChanged, this);
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
