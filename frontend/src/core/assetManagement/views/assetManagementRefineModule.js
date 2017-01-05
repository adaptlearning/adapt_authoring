// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Origin = require('coreJS/app/origin');
  var Backbone = require('backbone');

  var AssetManagementRefineModule = Backbone.View.extend({
    tagName: 'div',
    // if true, appends template to .inner of assetManagementRefineModule.hbs
    renderWrapper: true,
    // used to set the module's title in the wrapper's hbs
    // set in initialize
    title: false,

    events: {
      'click .title': 'toggle'
    },

    initialize: function(options) {
      if(!this.title) {
        this.title = window.polyglot.t('app.unsetmoduletitle');
      }
      this.options = options;

      this.listenTo(Origin, 'assetManagement:refine:remove', this.remove);

      if(this.autoRender !== false) this.render();
    },

    render: function() {
      var data = this.options;
      data.title = this.title;

      var inner = Handlebars.templates[this.constructor.template](data);

      if(this.renderWrapper) {
        var $wrapper = $(Handlebars.templates.assetManagementRefineModule(data));
        this.$el.html($wrapper);
        this.$('.inner').html(inner);
      } else {
        this.$el.html(inner);
      }
      // common classes
      this.$el.addClass('module hide');

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
      this.$el.toggleClass('hide');
    }
  });

  return AssetManagementRefineModule;
});
