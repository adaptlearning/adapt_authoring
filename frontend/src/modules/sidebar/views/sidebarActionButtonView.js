// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Helpers = require('core/helpers');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');

  var SidebarActionButtonView = OriginView.extend({
    className: 'sidebar-item',
    events: { 'click': 'onClick' },

    initialize: function(options) {
      this.model = new Backbone.Model(options);
      // this.listenTo(Origin, 'sidebar:resetButtons', this.reset);
      OriginView.prototype.initialize.apply(this, arguments);
    },

    /*
    TODO
    updateButton: function(buttonClass, updateText) {
      this.$(buttonClass)
        .append(Handlebars.templates['sidebarUpdateButton']({ updateText: updateText }))
        .addClass('sidebar-updating')
        .attr('disabled', true)
        .find('span').eq(0).addClass('display-none');
    },
    */

    reset: function() {
      var $buttonsSpans = this.$('.sidebar-updating').removeClass('sidebar-updating').attr('disabled', false).find('span');
      $buttonsSpans.eq(0).removeClass('display-none');
      $buttonsSpans.eq(1).remove();
    },

    onClick: function(e) {
      if(this.labels && this.labels.processing) {
        // TODO switch label
      }
      // NOTE two versions of events
      Origin.trigger('sidebar:action:' + this.model.get('name'));
      Origin.trigger('sidebar:action', this.model.get('name'));
      console.log('sidebar:action:' + this.model.get('name'));
    }
  }, {
    template: 'sidebarActionButton'
  });

  return SidebarActionButtonView;
});
