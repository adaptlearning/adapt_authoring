require([
    'coreJS/adaptbuilder',
    'coreJS/router',
    'coreModels/userModel',
    'bootstrap',
    'templates'
], function (AdaptBuilder, Router, UserModel) {
  
  	AdaptBuilder.router = new Router();

  	AdaptBuilder.userModel = new UserModel();

  	AdaptBuilder.userModel.fetch({
  		success: function(data) {
  			AdaptBuilder.initialize();
  		}
  	});
  	
    

});