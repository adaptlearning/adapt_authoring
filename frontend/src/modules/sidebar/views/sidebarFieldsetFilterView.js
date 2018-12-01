// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var SidebarLinkButtonView = require('./sidebarLinkButtonView');

  var SidebarFieldsetFilterView = SidebarLinkButtonView.extend({
    className: function() {
      console.log(this.model.attributes);
      return 'link fieldset sidebar-fieldset-filter-' + this.model.get('key');
    },

    initialize: function(options) {
      this.model.set({
        icon: 'fa-toggle-off fa-toggle-on',
        label: this.model.get('legend')
      });
      SidebarLinkButtonView.prototype.initialize.apply(this, arguments);
    },

    onClick: function(e) {
      this.$('i').toggleClass('fa-toggle-on');
      console.log('sidebar:filter:toggle', this.model.get('key'));
      Origin.trigger('sidebar:filter:toggle', this.model.get('key'));
    }
  });

  return SidebarFieldsetFilterView;
});
