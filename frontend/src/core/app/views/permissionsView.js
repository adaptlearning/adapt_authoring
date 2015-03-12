// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');

  var PermissionsView = Backbone.View.extend({

    className: 'permissions',

    initialize: function(options) {
      this.preRender(options);
      this.render();
      this.listenTo(Origin, 'remove:views', this.remove);
    },

    preRender: function() {},

    render: function() {
      var data = this.model ? this.model.toJSON() : null;
      var template = Handlebars.templates[this.constructor.template];
      this.$el.html(template(data));
      _.defer(_.bind(function() {
        this.postRender();
      }, this));
      return this;
    },

    postRender: function() {
      this.setViewToReady();
    },

    setViewToReady: function() {
      Origin.trigger('router:hideLoading');
    }

  }, {
    template: 'permissions'
  });

  return PermissionsView;

});