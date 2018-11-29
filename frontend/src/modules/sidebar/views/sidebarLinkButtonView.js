// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');

  var SidebarLinkButtonView = OriginView.extend({
    className: 'sidebar-item',
    events: { 'click': 'onClick' },

    initialize: function(options) {
      this.model = new Backbone.Model(options);
      OriginView.prototype.initialize.apply(this, arguments);
    },

    onClick: function(e) {
      // NOTE two versions of events
      Origin.trigger('sidebar:link:' + this.model.get('page'));
      Origin.trigger('sidebar:link', this.model.get('page'));
      console.log('sidebar:link:' + this.model.get('page'));
    }
  }, {
    template: 'sidebarLinkButton'
  });

  return SidebarLinkButtonView;
});
