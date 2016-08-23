// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var PluginTypeView = require('coreJS/pluginManagement/views/pluginTypeView');
  var ExtensionTypeCollection = require('coreJS/pluginManagement/collections/extensionTypeCollection');
  var ThemeTypeCollection = require('coreJS/pluginManagement/collections/themeTypeCollection');
  var ComponentTypeCollection = require('coreJS/pluginManagement/collections/componentTypeCollection');
  var MenuTypeCollection = require('coreJS/pluginManagement/collections/menuTypeCollection');
  var Helpers = require('coreJS/app/helpers');

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
      'click #pluginManagementMenu button'     : 'formclick', // @TODO - add support for this
      'click .refresh-all-plugins'             : 'refreshPluginList'
    },

    initialize: function (options) {
      this.pluginType = options.pluginType;
      return OriginView.prototype.initialize.apply(this, arguments);
    },

    preRender: function() {
      Origin.trigger('location:title:update', {title: window.polyglot.t('app.' + this.pluginType + 'management')});
      this.collection = new (this.pluginCollections[this.pluginType])();
      this.listenTo(this.collection, 'sync', this.addPluginTypeViews);
      this.collection.fetch();

      // External events
      // @TODO - add controls for these
      this.listenTo(Origin, 'pluginManagement:sort:asc', this.sortAscending);
      this.listenTo(Origin, 'pluginManagement:sort:desc', this.sortDescending);
    },

    sortAscending: function() {
      var sortedCollection = this.collection.sortBy(function(pluginType){
        return pluginType.get("displayName").toLowerCase();
      });

      this.renderPluginTypeViews(sortedCollection);
    },

    sortDescending: function() {
      var sortedCollection = this.collection.sortBy(function(pluginType){
        return pluginType.get("displayName").toLowerCase();
      });

      sortedCollection = sortedCollection.reverse();

      this.renderPluginTypeViews(sortedCollection);
    },

    addPluginTypeViews: function() {
      this.renderPluginTypeViews(this.collection.models);
    },

    renderPluginTypeViews: function(pluginTypes) {
      this.$('.pluginManagement-plugins').empty();

      _.each(pluginTypes, function(pluginType, index) {
        var cssClass = 'tb-row-' + Helpers.odd(index);

        if (pluginType.get('_isAvailableInEditor') == false) {
          cssClass += ' row-disabled';
        }

        this.$('.pluginManagement-plugins').append(new PluginTypeView({model: pluginType}).$el.addClass(cssClass));
      }, this);

      _.defer(this.setViewToReady);

      this.evaluatePluginTypeCount(pluginTypes);

      var windowHeight = $(window).height() - this.$el.offset().top;
      this.$el.height(windowHeight);
    },

    evaluatePluginTypeCount: function (pluginTypes) {
      if (pluginTypes.length == 0) {
        this.$('.pluginManagement-plugins').append('No plugin types to display');
      }
    },

    filterPluginTypes: function(filterText) {
      var filteredCollection = _.filter(this.collection.models, function(model) {
        return model.get('displayName').toLowerCase().indexOf(filterText.toLowerCase()) > -1;
      });

      this.renderPluginTypeViews(filteredCollection);
    },

    formclick: function (e) {
      e.preventDefault();

      var type = $(e.target).data('action');

      switch (type) {
          case 'filter':
            var criteria = $('#filterCriteria').val();
            this.filterPluginTypes(criteria);
          break;
      }
    },

    refreshPluginList: function (e) {
      e.preventDefault();

      var pluginType = this.pluginType;
      var $btn = this.$('.refresh-all-plugins');
      if ($btn.hasClass('disabled')) {
        // do nothing!
        return false;
      }

      $btn.addClass('disabled').html(window.polyglot.t('app.updating'));
      $.ajax({
        'method': 'GET',
        'url': this.collection.url() + '&refreshplugins=1'
      }).done(function (data) {
        // Refresh the schemas
        Origin.trigger('scaffold:updateSchemas', function() {
          // regardless of the result, refresh the view
          Origin.router.navigate('#/pluginManagement/' + pluginType, {trigger: true});
        }, this);
      });

      return false;
    }

  }, {
    template: 'pluginManagement'
  });

  return PluginManagementView;

});
