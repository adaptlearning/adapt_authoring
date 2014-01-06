this["Handlebars"] = this["Handlebars"] || {};
this["Handlebars"]["templates"] = this["Handlebars"]["templates"] || {};

this["Handlebars"]["templates"]["dashboard"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"row\">\r\n\r\n  <div class=\"main\">\r\n      \r\n    <h3>Welcome to the Dashboard!</h3>\r\n  \r\n    <p>More to follow...</p>\r\n  \r\n  </div>\r\n  \r\n</div>";
  });

this["Handlebars"]["templates"]["forgotPassword"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"row\">\r\n\r\n    <div class=\"main\">\r\n\r\n      <h3>Forgotten password</h3>\r\n      <form role=\"form\">\r\n        <div class=\"form-group\">\r\n          <label for=\"inputUsernameEmail\">Username or email</label>\r\n          <input type=\"text\" class=\"form-control\" id=\"inputUsernameEmail\">\r\n        </div>\r\n       <!--  <div class=\"form-group\">\r\n          <a id=\"linkForgotPassword\" class=\"pull-right\" href=\"#\">Forgot password?</a>\r\n          <label for=\"inputPassword\">Password</label>\r\n          <input type=\"password\" class=\"form-control\" id=\"inputPassword\">\r\n        </div>\r\n        <div class=\"checkbox pull-right\">\r\n          <label>\r\n            <input id=\"chkRememberMe\" type=\"checkbox\">\r\n            Remember me </label>\r\n        </div> -->\r\n        <button type=\"submit\" class=\"btn btn btn-primary\">\r\n          Reset my password\r\n        </button>\r\n      </form>\r\n    \r\n    </div>\r\n    \r\n  </div>";
  });

this["Handlebars"]["templates"]["home"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<h3>Welcome to the Adapt Builder</h3>\r\n<p>Please <a href=\"/login\">Login here</a></p>";
  });

this["Handlebars"]["templates"]["login"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"row\">\r\n\r\n    <div class=\"main\">\r\n      \r\n      <h3>Please Log In, or <a id=\"linkRegister\" href=\"/register\">register</a></h3>\r\n      \r\n      <div id=\"loginFailed\" class=\"alert alert-danger hide\">\r\n        Incorrect username or password\r\n      </div>\r\n      \r\n<!--      <div class=\"row\">\r\n        <div class=\"col-xs-6 col-sm-6 col-md-6\">\r\n          <a href=\"#\" class=\"btn btn-lg btn-primary btn-block\">Facebook</a>\r\n        </div>\r\n        <div class=\"col-xs-6 col-sm-6 col-md-6\">\r\n          <a href=\"#\" class=\"btn btn-lg btn-info btn-block\">Google</a>\r\n        </div>\r\n      </div>\r\n      <div class=\"login-or\">\r\n        <hr class=\"hr-or\">\r\n        <span class=\"span-or\">or</span>\r\n      </div>\r\n-->\r\n      <form role=\"form\">\r\n        <div class=\"form-group\">\r\n          <label for=\"inputUsernameEmail\">Username or email</label>\r\n          <input type=\"text\" class=\"form-control\" id=\"inputUsernameEmail\">\r\n        </div>\r\n        <div class=\"form-group\">\r\n          <a id=\"linkForgotPassword\" class=\"pull-right\" href=\"#\">Forgot password?</a>\r\n          <label for=\"inputPassword\">Password</label>\r\n          <input type=\"password\" class=\"form-control\" id=\"inputPassword\">\r\n        </div>\r\n        <div class=\"checkbox pull-right\">\r\n          <label>\r\n            <input id=\"chkRememberMe\" type=\"checkbox\">\r\n            Remember me </label>\r\n        </div>\r\n        <button type=\"submit\" class=\"btn btn btn-primary\">\r\n          Log In\r\n        </button>\r\n      </form>\r\n    \r\n    </div>\r\n    \r\n  </div>";
  });