// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var SidebarFilterView = require('coreJS/sidebar/views/sidebarFilterView');

  var Sidebar = OriginView.extend({
    className: 'sidebar',

    preRender: function() {
      this.listenTo(Origin, {
        'sidebar:sidebarContainer:update': this.updateViews,
        'sidebar:sidebarFilter:add': this.addFilterView,
        'sidebar:sidebarContainer:hide': this.hideSidebar
      });
    },

    updateViews: function($element, options) {
      this.hideSidebar();

      var options = (options || {});

      var hasBackButton = options.backButtonText && options.backButtonRoute;
      if(hasBackButton) this.addBackButton(options);
      else this.removeBackButton();
      // APPEND new view to sidebar so we can animate the current view out
      this.$('.sidebar-item-container').append($element);
    },

    hideSidebar: function() {
      $('html').addClass('sidebar-hide');
    },

    animateBreadcrumb: function(options, callback) {
      var self = this;
      this.$('.sidebar-breadcrumb').velocity(options, function() {
        Origin.trigger('sidebar:views:animateIn');
        if(callback) callback.call(this);
      });
    },

    addBackButton: function(options) {
      var template = Handlebars.templates['sidebarBreadcrumb'];
      this.$('.sidebar-breadcrumb').html(template(options));
      _.defer(function() {
        this.animateBreadcrumb({ 'top': '0px', 'opacity': 1 });
      });
    },

    removeBackButton: function() {
      this.animateBreadcrumb({ 'top': '-40px', 'opacity': 0 }, function() {
        this.empty();
      });
    },

    addFilterView: function(options) {
      Origin.trigger('sidebar:sidebarFilter:remove');
      $('body').append(new SidebarFilterView(options).$el);
    }
  }, {
    template: 'sidebar'
  });

  return Sidebar;
});
