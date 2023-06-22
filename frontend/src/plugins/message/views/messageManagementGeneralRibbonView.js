// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var OriginView = require('core/views/originView');
  var Origin = require('core/origin');

  var MessageManagementGeneralRibbonView= OriginView.extend({
    tagName: 'div',
    className: 'general-ribbon',

    initialize: function() {
      this.listenTo(Origin, 'login:changed', this.loginChanged);
      this.render();
    },

    render: function() {
      var data = this.model ? this.model.toJSON() : null;
      var template = Handlebars.templates[this.constructor.template];
      this.$el.html(template(data));
      return this;
    },

    loginChanged: function() {
      this.render();
    }

  }, {
    template: 'messageManagementGeneralRibbon'
  });

  return MessageManagementGeneralRibbonView;
});
