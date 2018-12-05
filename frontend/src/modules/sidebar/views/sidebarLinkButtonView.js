// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');

  var SidebarLinkButtonView = OriginView.extend({
    tagName: 'button',
    className: function() {
      return 'link ' + this.model.get('name');
    },
    events: { 'click': 'onClick' },

    onClick: function(e) {
      // NOTE two versions of events
      Origin.trigger('sidebar:link:' + this.model.get('page'), this.model);
      Origin.trigger('sidebar:link', this.model);
      console.log('sidebar:link:' + this.model.get('name'));
    }
  }, {
    template: 'sidebarLinkButton'
  });

  return SidebarLinkButtonView;
});
