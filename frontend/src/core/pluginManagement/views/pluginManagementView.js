define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var PluginTypeView = require('coreJS/pluginManagement/views/pluginTypeView');
  var ExtensionTypeCollection = require('coreJS/pluginManagement/collections/extensionTypeCollection');
  var ThemeTypeCollection = require('coreJS/pluginManagement/collections/themeTypeCollection');
  var ComponentTypeCollection = require('coreJS/pluginManagement/collections/componentTypeCollection');

  var PluginManagementView = OriginView.extend({

    pluginType: "plugin",

    pluginCollections: {
      'extension' : ExtensionTypeCollection,
      'component' : ComponentTypeCollection,
      'theme' : ThemeTypeCollection
    },

    tagName: "div",

    className: "pluginManagement",

    initialize: function (options) {
      this.pluginType = options.pluginType;
      return OriginView.prototype.initialize.apply(this, arguments);
    },

    preRender: function() {
      Origin.trigger('location:title:update', {title: window.polyglot.t('app.' + this.pluginType + 'management')});
      this.collection = new (this.pluginCollections[this.pluginType])();
      this.collection.fetch();

      this.listenTo(this.collection, 'sync', this.addPluginTypeViews);

      // External events
      this.listenTo(Origin, 'pluginManagement:layout:grid', this.switchLayoutToGrid);
      this.listenTo(Origin, 'pluginManagement:layout:list', this.switchLayoutToList);
      this.listenTo(Origin, 'pluginManagement:sort:asc', this.sortAscending);
      this.listenTo(Origin, 'pluginManagement:sort:desc', this.sortDescending);
    },

    events: {
      'click #pluginManagementMenu button'     : 'formclick',
      'click a#sortPluginsByName'      : 'sortPluginsByName',
      'click a#sortPluginsByAuthor'    : 'sortPluginsByAuthor',
      'click a#sortPluginsByLastEdit'  : 'sortPluginsByLastEdit',
      // 'click .contextMenu'              : 'handleContextMenuClick',
      // 'click .menu-container'           : 'toggleContextMenu',
      'click .plugin-detail'           : 'editPlugin'
    },

    switchLayoutToList: function() {
      var $container = $('.pluginManagement-plugins'),
        $items = $('.pluginType-list-item');

      $container.removeClass('grid-layout').addClass('list-layout');

    },

    switchLayoutToGrid: function() {
      var $container = $('.pluginManagement-plugins'),
        $items = $('.pluginType-list-item');

      $container.removeClass('list-layout').addClass('grid-layout');
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

      _.each(pluginTypes, function(pluginType) {
        this.$('.pluginManagement-plugins').append(new PluginTypeView({model: pluginType}).$el);
      }, this);

      this.evaluatePluginTypeCount(pluginTypes);
    },

    evaluatePluginTypeCount: function (pluginTypes) {
      if (pluginTypes.length == 0) {
        this.$('.pluginManagement-plugins').append('No plugin types to display');
      }
    },

    sortPluginTypessByAuthor: function(e) {
      e.preventDefault();

      var sortedCollection = this.collection.sortBy(function(pluginType){
        return pluginType.get("createdBy").toLowerCase();
      });

      this.renderPluginTypeViews(sortedCollection);
    },

    sortPluginTypesByName: function(e) {
      e.preventDefault();

      var sortedCollection = this.collection.sortBy(function(pluginType){
        return pluginType.get("displayName").toLowerCase();
      });

      this.renderPluginTypeViews(sortedCollection);
    },

    filterPluginTypes: function(filterText) {
      // var collection = this.collection;
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
            this.filterProjects(criteria);
          break;
      }
    }

  }, {
    template: 'pluginManagement'
  });

  return PluginManagementView;

});
