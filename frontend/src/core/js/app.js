require([
    'coreJS/adaptbuilder',
    'coreJS/router',
    'coreJS/user/models/sessionModel',
    'coreJS/navigation/views/navigationView',
    'bootstrap',
    'templates'
], function (AdaptBuilder, Router, SessionModel, NavigationView) {
  	AdaptBuilder.sessionModel = new SessionModel();

    AdaptBuilder.router = new Router();

  	AdaptBuilder.sessionModel.fetch({
  		success: function(data) {
        $('#nav').html(new NavigationView({model: AdaptBuilder.sessionModel}).$el);
        AdaptBuilder.initialize();
  		}
  	});
});
