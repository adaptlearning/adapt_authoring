// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var Backbone = require('backbone');

  var AssetManagementRefineModule = Backbone.View.extend({
    tagName: 'div',

    initialize: function(options) {
      this.options = options;

      this.listenTo(Origin, 'modal:closed', this.remove);
      this.listenTo(Origin, 'remove:views', this.remove);

      this.render();
    },

    render: function() {
      var data = this.options;
      var template = Handlebars.templates[this.constructor.template];
      this.$el.html(template(data));
      return this;
    },

    apply: function(type, options) {
      Origin.trigger('assetManagement:refine:apply', {
        type: type,
        options: options
      });
    },

    toggle: function() {
      this.inView() ? this.hide() : this.show();
    },

    show: function() {
      this.$el.addClass('show');
    },

    hide: function() {
      this.$el.removeClass('show');
    },
  });

  return AssetManagementRefineModule;
});
