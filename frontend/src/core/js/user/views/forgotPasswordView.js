define(function(require) {
  var Backbone = require('backbone');
  var BuilderView = require('coreJS/core/views/builderView');

  var ForgotPasswordView = BuilderView.extend({
    
    tagName: "div",

    className: "forgotpassword"

  }, {
    template: 'forgotPassword'
  });

  return ForgotPasswordView;

});
