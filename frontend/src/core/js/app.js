require([
    'coreJS/adaptbuilder',
    'coreJS/router',
    'coreModels/userModel',
    'bootstrap',
    'templates'
], function (AdaptBuilder, Router, UserModel) {
  	AdaptBuilder.userModel = new UserModel();

    AdaptBuilder.router = new Router();

  	AdaptBuilder.userModel.fetch({
  		success: function(data) {
  			AdaptBuilder.initialize();
  		}
  	});
});