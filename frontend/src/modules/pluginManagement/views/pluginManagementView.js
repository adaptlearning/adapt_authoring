// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Helpers = require('core/helpers');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var PluginTypeView = require('./pluginTypeView');

  var PluginManagementView = OriginView.extend({
    className: "pluginManagement",
    tagName: "div",
    pluginType: "plugin",

    events: {
      'click .refresh-all-plugins': 'refreshPluginList'
    },

    getColl: function() {
      return this.pluginCollections[this.pluginType];
    },

    initialize: function(options) {
      this.pluginType = options.pluginType;
      this.pluginCollections = {
        extension: Origin.editor.data.extensiontypes,
        component: Origin.editor.data.componenttypes,
        theme: Origin.editor.data.themetypes,
        menu: Origin.editor.data.menutypes
      };

      return OriginView.prototype.initialize.apply(this, arguments);
    },

    preRender: function() {
      Origin.trigger('location:title:update', { title: Origin.l10n.t('app.' + this.pluginType + 'management') });
      this.getColl().fetch({ success: this.renderPluginTypeViews.bind(this) });
    },
    
    render: function() {
      this.model = {
        toJSON: _.bind(function() {
          return { type: this.pluginType };
        }, this)
      }
      return OriginView.prototype.render.apply(this, arguments);
    },

    renderPluginTypeViews: function() {
      this.$('.pluginManagement-plugins').empty();

      this.getColl().each(this.renderPluginTypeView);
      this.evaluatePluginTypeCount(this.getColl());

      this.setViewToReady();
    },

    renderPluginTypeView: function(pluginType, index) {
      var cssClass = 'tb-row-' + Helpers.odd(index);
      var view = new PluginTypeView({ model: pluginType });
      this.$('.pluginManagement-plugins').append(view.$el.addClass(cssClass));
    },

    evaluatePluginTypeCount: function(pluginTypes) {
      if(pluginTypes.length === 0) {
        this.$('.pluginManagement-plugins').append(Origin.l10n.t('app.noplugintypes'));
      }
    },

    refreshPluginList: function(e) {
      e && e.preventDefault();
      var $btn = $(e.currentTarget);

      if($btn.is(':disabled')) return false;

      $btn.attr('disabled', true);

      this.getColl().fetch({
        success: _.bind(function() {
          Origin.trigger('scaffold:updateSchemas', function() {
            this.renderPluginTypeViews();
          }, this);
        }, this),
        error: console.log
      });
    }
  }, {
    template: 'pluginManagement'
  });

  return PluginManagementView;
});
