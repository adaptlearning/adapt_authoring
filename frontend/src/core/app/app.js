require([
    'coreJS/app/adaptbuilder',
    'coreJS/app/router',
    'coreJS/user/models/sessionModel',
    'coreJS/navigation/views/navigationView',
    'coreJS/app/helpers',
    'bootstrap',
    'templates'
], function (AdaptBuilder, Router, SessionModel, NavigationView, Helpers) {
  	AdaptBuilder.sessionModel = new SessionModel();

    AdaptBuilder.router = new Router();

  	AdaptBuilder.sessionModel.fetch({
  		success: function(data) {
        $('#nav').html(new NavigationView({model: AdaptBuilder.sessionModel}).$el);
        AdaptBuilder.initialize();
  		}
  	});

    console.log('fuck wit')
});
