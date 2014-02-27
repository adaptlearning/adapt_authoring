define(function(require){

  var Backbone = require('backbone');
  var BuilderView = require('coreJS/app/views/builderView');
  var AdaptBuilder = require('coreJS/app/adaptbuilder');

  var NavigationView = BuilderView.extend({

    tagName: 'nav',

    className: 'navigation',

    preRender: function() {
      this.listenTo(AdaptBuilder, 'login:changed', this.render);
      this.listenTo(AdaptBuilder, 'route:changed', this.routeChanged);
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
