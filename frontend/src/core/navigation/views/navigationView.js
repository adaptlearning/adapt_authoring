define(function(require){

  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var NavigationView = OriginView.extend({

    tagName: 'nav',

    className: 'navigation',

    initialize: function() {
      this.listenTo(Origin, 'login:changed', this.loginChanged);
      this.listenTo(Origin, 'route:changed', this.routeChanged);

      this.render();
    },

    render: function() {
      var data = this.model ? this.model.toJSON() : null;
      var template = Handlebars.templates[this.constructor.template];
      this.$el.html(template(data));

      return this;
    },

    loginChanged: function() {
      this.render();
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
