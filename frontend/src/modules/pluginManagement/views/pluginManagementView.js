// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');

  var Helpers = require('core/helpers');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');

  var PluginTypeView = require('./pluginTypeView');
  var ExtensionTypeCollection = require('../collections/extensionTypeCollection');
  var ThemeTypeCollection = require('../collections/themeTypeCollection');
  var ComponentTypeCollection = require('../collections/componentTypeCollection');
  var MenuTypeCollection = require('../collections/menuTypeCollection');

  var PluginManagementView = OriginView.extend({
    pluginType: "plugin",
    pluginCollections: {
      'extension' : ExtensionTypeCollection,
      'component' : ComponentTypeCollection,
      'theme' : ThemeTypeCollection,
      'menu': MenuTypeCollection
    },
    tagName: "div",
    className: "pluginManagement",

    events: {
      'click .refresh-all-plugins': 'refreshPluginList'
    },

    initialize: function (options) {
      this.pluginType = options.pluginType;
      return OriginView.prototype.initialize.apply(this, arguments);
    },

    initialiseCollection: function() {
      this.collection = new (this.pluginCollections[this.pluginType])();
      this.listenTo(this.collection, 'sync', this.renderPluginTypeViews);
      this.collection.fetch();
    },

    preRender: function() {
      Origin.trigger('location:title:update', { title: window.polyglot.t('app.' + this.pluginType + 'management') });
      this.initialiseCollection();
    },

    renderPluginTypeViews: function(collection) {
      this.$('.pluginManagement-plugins').empty();

      var pluginTypes = collection.models;

      _.each(pluginTypes, this.renderPluginTypeView, this);
      this.evaluatePluginTypeCount(pluginTypes);

      this.setViewToReady();
    },

    renderPluginTypeView: function(pluginType, index) {
      var cssClass = 'tb-row-' + Helpers.odd(index);
      if (pluginType.get('_isAvailableInEditor') == false) {
        cssClass += ' row-disabled';
      }
      var view = new PluginTypeView({ model: pluginType });
      this.$('.pluginManagement-plugins').append(view.$el.addClass(cssClass));
    },

    evaluatePluginTypeCount: function(pluginTypes) {
      if(pluginTypes.length === 0) {
        this.$('.pluginManagement-plugins').append(window.polyglot.t('app.noplugintypes'));
      }
    },

    refreshPluginList: function (e) {
      e && e.preventDefault();

      var pluginType = this.pluginType;
      var $btn = this.$('.refresh-all-plugins');

      if ($btn.hasClass('disabled')) {
        return false;
      }

      $btn.addClass('disabled').html(window.polyglot.t('app.updating'));

      $.get(this.collection.url() + '&refreshplugins=1', function (data) {
        Origin.trigger('scaffold:updateSchemas', function() {
          Origin.router.navigateTo('pluginManagement/' + pluginType);
        }, this);
      });

      return false;
    }
  }, {
    template: 'pluginManagement'
  });

  return PluginManagementView;
});
