// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ResetPasswordView = require('./resetPasswordView');

  var SetPasswordView = ResetPasswordView.extend(
    { className: "reset-password" },
    { template: 'setPassword' }
  );
  return SetPasswordView;
});
