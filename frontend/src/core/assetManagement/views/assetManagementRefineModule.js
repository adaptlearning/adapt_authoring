// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Origin = require('coreJS/app/origin');
  var Backbone = require('backbone');

  var AssetManagementRefineModule = Backbone.View.extend({
    tagName: 'div',

    events: {
      'click .title': 'toggle'
    },

    initialize: function(options) {
      this.options = options;

      this.listenTo(Origin, 'assetManagement:refine:remove', this.remove);

      if(this.autoRender !== false) this.render();
    },

    render: function() {
      var data = this.options;
      var template = Handlebars.templates[this.constructor.template];

      this.$el.html(template(data));
      this.resetFilter();

      // HACK for now...
      _.defer(_.bind(function() {
        this.$('.title').click(_.bind(this.toggle,this));

        this.postRender();
        Origin.trigger('assetManagement:refine:moduleReady', this.constructor.template, this);
      }, this));

      return this;
    },

    postRender: function() {
    },

    applyFilter: function(options) {
      Origin.trigger('assetManagement:refine:apply', {
        type: this.filterType,
        options: options
      });
    },

    resetFilter: function(options) {
      console.error(this.constructor.template, 'needs to override resetFilter');
    },

    toggle: function() {
      this.$('.inner').toggleClass('hide');
    }
  });

  return AssetManagementRefineModule;
});
