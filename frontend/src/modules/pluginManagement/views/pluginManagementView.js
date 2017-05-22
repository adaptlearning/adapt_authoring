// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Helpers = require('core/helpers');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');

  var PluginTypeView = require('./pluginTypeView');
  var ExtensionTypeCollection = require('../collections/extensionTypeCollection');
  var ThemeTypeCollection = require('../collections/themeTypeCollection');
  var ComponentTypeCollection = require('../collections/componentTypeCollection');
  var MenuTypeCollection = require('../collections/menuTypeCollection');

  var PluginManagementView = OriginView.extend({
    className: "pluginManagement",
    tagName: "div",

    pluginType: "plugin",
    pluginCollections: {
      'extension' : ExtensionTypeCollection,
      'component' : ComponentTypeCollection,
      'theme' : ThemeTypeCollection,
      'menu': MenuTypeCollection
    },

    events: {
      'click .refresh-all-plugins': 'refreshPluginList'
    },

    initialize: function(options) {
      this.pluginType = options.pluginType;
      return OriginView.prototype.initialize.apply(this, arguments);
    },

    initialiseCollection: function() {
      this.collection = new (this.pluginCollections[this.pluginType])();
      this.listenTo(this.collection, 'sync', this.renderPluginTypeViews);
      this.collection.fetch();
    },

    preRender: function() {
      Origin.trigger('location:title:update', { title: Origin.l10n.t('app.' + this.pluginType + 'management') });
      this.initialiseCollection();
    },

    renderPluginTypeViews: function(collection) {
      this.$('.pluginManagement-plugins').empty();

      this.collection.each(this.renderPluginTypeView);
      this.evaluatePluginTypeCount(this.collection);

      this.setViewToReady();
    },

    renderPluginTypeView: function(pluginType, index) {
      var cssClass = 'tb-row-' + Helpers.odd(index);
      if (pluginType.get('_isAvailableInEditor') === false) {
        cssClass += ' row-disabled';
      }
      var view = new PluginTypeView({ model: pluginType });
      this.$('.pluginManagement-plugins').append(view.$el.addClass(cssClass));
    },

    evaluatePluginTypeCount: function(pluginTypes) {
      if(pluginTypes.length === 0) {
        this.$('.pluginManagement-plugins').append(Origin.l10n.t('app.noplugintypes'));
      }
    },

    refreshPluginList: function (e) {
      e && e.preventDefault();
      var self = this;
      var $btn = this.$('.refresh-all-plugins');

      if ($btn.hasClass('disabled')) return false;

      $btn.addClass('disabled');

      this.collection.fetch({
        success: function() {
          Origin.trigger('scaffold:updateSchemas', function() {
            self.renderPluginTypeViews(self.collection);
          }, this);
        },
        error: console.log
      });
    }
  }, {
    template: 'pluginManagement'
  });

  return PluginManagementView;
});
