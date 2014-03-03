require([
    'coreJS/app/origin',
    'coreJS/app/router',
    'coreJS/user/models/sessionModel',
    'coreJS/navigation/views/navigationView',
    'coreJS/app/helpers',
    'templates'
], function (Origin, Router, SessionModel, NavigationView, Helpers) {
  	Origin.sessionModel = new SessionModel();

    Origin.router = new Router();

  	Origin.sessionModel.fetch({
  		success: function(data) {
        $('#app').before(new NavigationView({model: Origin.sessionModel}).$el);
        Origin.initialize();
  		}
  	});
    
});
