require([
    'coreJS/adaptbuilder',
    'coreJS/router',
    'coreJS/user/models/userModel',
    'coreJS/navigation/views/navigationView',
    'bootstrap',
    'templates'
], function (AdaptBuilder, Router, UserModel, NavigationView) {
  	AdaptBuilder.userModel = new UserModel();

    AdaptBuilder.router = new Router();

  	AdaptBuilder.userModel.fetch({
  		success: function(data) {
        $('#nav').html(new NavigationView({model: AdaptBuilder.userModel}).$el);
        AdaptBuilder.initialize();
  		}
  	});
});
