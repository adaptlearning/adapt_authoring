// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var Backbone = require('backbone');

  var AssetManagementRefineView = Backbone.View.extend({
    className: 'assetManagement-refine',
    tagName: 'div',
    /*
    asset type
    ? license
    */
    modules: {
      AssetManagementSummaryModule: require('coreJS/assetManagement/views/assetManagementSummaryModule'),
      AssetManagementSearchModule: require('coreJS/assetManagement/views/AssetManagementSearchModule'),
      AssetManagementSortModule: require('coreJS/assetManagement/views/assetManagementSortModule'),
      AssetManagementWorkspaceModule: require('coreJS/assetManagement/views/assetManagementWorkspaceModule'),
      AssetManagementMineModule: require('coreJS/assetManagement/views/assetManagementMineModule'),
      AssetManagementTagsModule: require('coreJS/assetManagement/views/assetManagementTagsModule')
    },
    modulesLoaded: [],

    initialize: function(options) {
      this.options = options;

      this.listenTo(Origin, 'modal:closed', this.remove);
      this.listenTo(Origin, 'modal:resize', this.onModalResize);
      this.listenTo(Origin, 'remove:views', this.remove);

      this.render();
    },

    render: function() {
      var data = this.options;
      var template = Handlebars.templates['assetManagementRefineView'];
      this.$el.html(template(data));
      // position
      // TODO fix this 1px
      var top = $('.modal-popup-toolbar').outerHeight()+1;
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
      this.modulesLoaded = [];

      this.listenTo(Origin, 'assetManagement:refine:moduleReady', this.onModuleReady);
      this.renderNextModule();
    },

    // ensures same order as this.modules
    renderNextModule: function() {
      var next = Object.keys(this.modules)[this.modulesLoaded.length];
      var moduleView = new this.modules[next](this.options);

      this.$('.modules').append(moduleView.$el);
    },

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
    },

    onModuleReady: function(moduleName) {
      console.log(moduleName + '.ready');
      if(this.modulesLoaded.indexOf(moduleName) < 0) {
        this.modulesLoaded.push(moduleName);
      }
      var allLoaded = this.modulesLoaded.length === Object.keys(this.modules).length;
      (allLoaded) ? this.onAllModulesReady() : this.renderNextModule();
    },

    onAllModulesReady: function() {
      this.stopListening(Origin, 'assetManagement:refine:moduleReady', this.onModuleReady);
      this.listenTo(Origin, 'assetManagement:refine:reset', this.resetFilters);
      Origin.trigger('assetManagement:refine:ready');
    },

    onModalResize: function(newSize) {
      this.$el.css('height', newSize.height);
    }
  });

  return AssetManagementRefineView;
});
