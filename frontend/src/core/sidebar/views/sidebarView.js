// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var SidebarFilterView = require('coreJS/sidebar/views/sidebarFilterView');

  var Sidebar = OriginView.extend({
    className: 'sidebar',

    initialize: function() {
      OriginView.prototype.initialize.apply(this, arguments);
      // otherwise parent class will remove us unexpectedly
      this.stopListening(Origin, 'remove:views');

      this.listenTo(Origin, {
        'sidebar:sidebarContainer:update': this.updateViews,
        'sidebar:sidebarFilter:add': this.addFilterView,
        'sidebar:sidebarContainer:hide': this.hideSidebar
      });
    },

    showSidebar: function() {
      $('html').removeClass('sidebar-hide');
    },

    hideSidebar: function() {
      $('html').addClass('sidebar-hide');
    },

    updateViews: function($element, options) {
      this.showSidebar();

      var options = options || {};
      var hasBackButton = !_.isEmpty(options.backButtonText) && !_.isEmpty(options.backButtonRoute);

      if(hasBackButton) this.addBackButton(options);
      else this.removeBackButton();
      // append new view to sidebar so we can animate the current view out
      this.$('.sidebar-item-container').append($element);
    },

    addBackButton: function(options) {
      var $container = this.$('.sidebar-breadcrumb');
      var template = Handlebars.templates['sidebarBreadcrumb'];
      $container.html(template(options));
      _.defer(function() {
        $container.velocity({ 'top': '0px', 'opacity': 1 }, function() {
          Origin.trigger('sidebar:views:animateIn');
        });
      });
    },

    removeBackButton: function(options, callback) {
      this.$('.sidebar-breadcrumb').css({ 'top': '-60px', 'opacity': 0 }).empty();
      // FIXME don't use setTimeout
      setTimeout(function() {
        Origin.trigger('sidebar:views:animateIn');
      }, 750);
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
