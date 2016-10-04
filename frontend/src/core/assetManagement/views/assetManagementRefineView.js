// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var Backbone = require('backbone');
  var AssetManagementMineModule = require('coreJS/assetManagement/views/assetManagementMineModule');
  var AssetManagementSortModule = require('coreJS/assetManagement/views/assetManagementSortModule');
  var AssetManagementSummaryModule = require('coreJS/assetManagement/views/assetManagementSummaryModule');
  var AssetManagementWorkspaceModule = require('coreJS/assetManagement/views/assetManagementWorkspaceModule');

  var AssetManagementRefineView = Backbone.View.extend({
    className: 'assetManagement-refine',
    tagName: 'div',
    modules: [],

    initialize: function(options) {
      this.options = options;

      this.listenTo(Origin, 'modal:closed', this.remove);
      this.listenTo(Origin, 'remove:views', this.remove);

      this.render();
    },

    render: function() {
      var data = this.options;
      var template = Handlebars.templates['assetManagementRefineView'];
      this.$el.html(template(data));
      // position
      var top = $('.modal-popup-toolbar').outerHeight();
      this.$el.css('top', top);

      this.renderToggle();
      this.renderSubViews();

      return this;
    },

    renderToggle: function() {
      var toggleTemplate = Handlebars.templates['assetManagementRefineToggle'];
      $('.modal-popup-toolbar-buttons').prepend(toggleTemplate());
      $('button.refine').click(_.bind(this.toggle, this));
    },

    renderSubViews: function() {
      this.renderModule(AssetManagementSummaryModule);
      this.renderModule(AssetManagementSortModule);
      this.renderModule(AssetManagementWorkspaceModule);
      this.renderModule(AssetManagementMineModule);
      /*
      search
      asset type
      tags
      ? license
      */

      this.listenTo(Origin, 'assetManagement:refine:reset', this.resetFilters);

      Origin.trigger('assetManagement:refine:ready');
    },

    renderModule: function(className) {
      var moduleView = new className(this.options);
      this.modules.push(moduleView);
      this.$('.modules').append(moduleView.$el);
    },

    /*
    Need to get latest collection after reset
    Can't guarantee modules return in order
    */

    resetFilters: function() {
      var modulesReset = 0;
      // bit hacky: make sure all modules have been fetched and triggerevent again
      this.listenTo(Origin, 'assetManagement:assetManagementCollection:fetched', function(collection){
        if(++modulesReset === this.modules.length) {
          this.stopListening(Origin, 'assetManagement:assetManagementCollection:fetched');
          Origin.trigger('assetManagement:sidebarFilter:add');
        }
      });

      for(var i = 0, count = this.modules.length; i < count; i++) {
        this.modules[i].resetFilter();
      }
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

    inView: function() {
      return this.$el.hasClass('show');
    }
  });

  return AssetManagementRefineView;
});
