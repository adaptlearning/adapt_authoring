require([
    'coreJS/app/adaptBuilder',
    'coreJS/app/router',
    'coreJS/user/models/sessionModel',
    'coreJS/navigation/views/navigationView',
    'coreJS/app/helpers',
    'templates'
], function (AdaptBuilder, Router, SessionModel, NavigationView, Helpers) {
  	AdaptBuilder.sessionModel = new SessionModel();

    AdaptBuilder.router = new Router();

  	AdaptBuilder.sessionModel.fetch({
  		success: function(data) {
        $('#app').before(new NavigationView({model: AdaptBuilder.sessionModel}).$el);
        AdaptBuilder.initialize();
  		}
  	});
    
});
