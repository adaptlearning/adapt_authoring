/*
* BuilderView - base class for all views
* License - http://github.com/adaptlearning/adapt_authoring/LICENSE
* Maintainers - Kevin Corry <kevinc@learningpool.com>
*/
define(function(require){

  var Backbone = require('backbone');
  var Builder = require('coreJS/app/adaptBuilder');

  var BuilderView = Backbone.View.extend({

    settings: {
      autoRender: true
    },

    initialize: function() {
      this.listenTo(Builder, 'remove', this.remove);
      this.preRender();
      if (this.settings.autoRender) {
        this.render();
      }
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

    },

    remove: function() {
      this.$el.remove();
      this.stopListening();
      return this;
    }

  });

  return BuilderView;

});
