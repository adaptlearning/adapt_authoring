define(function(require){

  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var NavigationView = OriginView.extend({

    tagName: 'nav',

    className: 'navigation',

    initialize: function() {
      this.listenTo(Origin, 'login:changed', this.loginChanged);
      this.render();
    },

    events: {
      'click a':'onNavigationItemClicked'
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

    onNavigationItemClicked: function(event) {
      event.preventDefault();
      Origin.trigger('navigation:' + $(event.currentTarget).attr('data-event'));
    }

  }, {
    template: 'navigation'
  });

  return NavigationView;

});
