// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var Backbone = require('backbone');
  var AssetManagementSortModule = require('coreJS/assetManagement/views/assetManagementSortModule');
  var AssetManagementMineModule = require('coreJS/assetManagement/views/assetManagementMineModule');
  var AssetManagementWorkspaceModule = require('coreJS/assetManagement/views/assetManagementWorkspaceModule');

  var AssetManagementRefineView = Backbone.View.extend({
    className: 'assetManagement-refine',
    tagName: 'div',

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
      /*
      - sort
      - search
      - workspace
      tags
      ? license
      * reset filters
      */
      this.renderControl(AssetManagementSortModule);
      this.renderControl(AssetManagementMineModule);
      this.renderControl(AssetManagementWorkspaceModule);

      // renderControl(AssetManagementModalFiltersView);
    },

    renderControl: function(className) {
      this.$('.controls').append(new className(this.options).$el);
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
