// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var SidebarView = require('./views/sidebarView');

  var view = new SidebarView();

  /**
  * Public API for the sidebar
  */
  Origin.sidebar = {
    show: function() {
      view.show();
    },
    hide: function() {
      view.hide();
    },
    update: function(options) {
      view.update(options);
    },
    addActionButton: function(data, index) {
      view.model.get('actions').push(data);
      view.renderActionButton(data, index);
    },
    addLinkButton: function(data, index) {
      view.model.get('links').push(data);
      view.renderLinkButton(data, index);
    },
    addWidget: function($el, index) {
      view.model.get('widgets').push(data);
      view.renderWidget($el, index);
    },
    showErrors: function(errors) {
      view.showErrors(errors);
    },
    // TODO remove this
    addView: function($el) {
      console.log('Sidebar#addView', $el);
      view.renderWidget($el);
    }
  };
  
  Origin.once('origin:initialize', function() {
    $('body').append(view.$el);
  });
});
