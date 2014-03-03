define(function(require) {
  var Backbone = require('backbone');
  var OriginView = require('coreJS/app/views/originView');

  var ForgotPasswordView = OriginView.extend({
    
    tagName: "div",

    className: "forgotpassword"

  }, {
    template: 'forgotPassword'
  });

  return ForgotPasswordView;

});
