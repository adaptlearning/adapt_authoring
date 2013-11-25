this["Handlebars"] = this["Handlebars"] || {};
this["Handlebars"]["templates"] = this["Handlebars"]["templates"] || {};

this["Handlebars"]["templates"]["forgotPassword"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"row\">\n\n    <div class=\"main\">\n\n      <h3>Forgotten password</h3>\n      <form role=\"form\">\n        <div class=\"form-group\">\n          <label for=\"inputUsernameEmail\">Username or email</label>\n          <input type=\"text\" class=\"form-control\" id=\"inputUsernameEmail\">\n        </div>\n       <!--  <div class=\"form-group\">\n          <a id=\"linkForgotPassword\" class=\"pull-right\" href=\"#\">Forgot password?</a>\n          <label for=\"inputPassword\">Password</label>\n          <input type=\"password\" class=\"form-control\" id=\"inputPassword\">\n        </div>\n        <div class=\"checkbox pull-right\">\n          <label>\n            <input id=\"chkRememberMe\" type=\"checkbox\">\n            Remember me </label>\n        </div> -->\n        <button type=\"submit\" class=\"btn btn btn-primary\">\n          Reset my password\n        </button>\n      </form>\n    \n    </div>\n    \n  </div>";
  });

this["Handlebars"]["templates"]["home"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<h3>Welcome to the Adapt Builder</h3>\n<p>Please <a href=\"/login\">Login here</a></p>";
  });

this["Handlebars"]["templates"]["login"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"row\">\n\n    <div class=\"main\">\n\n      <h3>Please Log In, or <a id=\"linkRegister\" href=\"/register\">register</a></h3>\n<!--      <div class=\"row\">\n        <div class=\"col-xs-6 col-sm-6 col-md-6\">\n          <a href=\"#\" class=\"btn btn-lg btn-primary btn-block\">Facebook</a>\n        </div>\n        <div class=\"col-xs-6 col-sm-6 col-md-6\">\n          <a href=\"#\" class=\"btn btn-lg btn-info btn-block\">Google</a>\n        </div>\n      </div>\n      <div class=\"login-or\">\n        <hr class=\"hr-or\">\n        <span class=\"span-or\">or</span>\n      </div>\n-->\n      <form role=\"form\">\n        <div class=\"form-group\">\n          <label for=\"inputUsernameEmail\">Username or email</label>\n          <input type=\"text\" class=\"form-control\" id=\"inputUsernameEmail\">\n        </div>\n        <div class=\"form-group\">\n          <a id=\"linkForgotPassword\" class=\"pull-right\" href=\"#\">Forgot password?</a>\n          <label for=\"inputPassword\">Password</label>\n          <input type=\"password\" class=\"form-control\" id=\"inputPassword\">\n        </div>\n        <div class=\"checkbox pull-right\">\n          <label>\n            <input id=\"chkRememberMe\" type=\"checkbox\">\n            Remember me </label>\n        </div>\n        <button type=\"submit\" class=\"btn btn btn-primary\">\n          Log In\n        </button>\n      </form>\n    \n    </div>\n    \n  </div>";
  });