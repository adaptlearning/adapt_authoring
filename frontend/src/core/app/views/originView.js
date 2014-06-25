/*
* BuilderView - base class for all views
* License - http://github.com/adaptlearning/adapt_authoring/LICENSE
* Maintainers - Kevin Corry <kevinc@learningpool.com>
*/
define(function(require){

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');

  var OriginView = Backbone.View.extend({

    settings: {
      autoRender: true
    },

    initialize: function(options) {
      this.preRender(options);
      if (this.settings.autoRender) {
        this.render();
      }
      this.listenTo(Origin, 'remove:views', this.remove);
      this.listenTo(Origin, 'origin:showLoading', this.showLoading);
      this.listenTo(Origin, 'origin:hideLoading', this.hideLoading);
    },

    preRender: function() {},

    render: function() {
      var data = this.model ? this.model.toJSON() : null;
      var template = Handlebars.templates[this.constructor.template];
      this.$el.html(template(data));
      _.defer(_.bind(function() {
        this.postRender();
        this.onReady();
      }, this));
      return this;
    },

    postRender: function() {},

    onReady: function() {},

    showLoading: function () {
      $('.loading').show();
    },

    hideLoading: function () {
      $('.loading').hide();
    }

  });

  return OriginView;

});
