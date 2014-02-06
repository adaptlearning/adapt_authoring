require([
    'coreJS/adaptbuilder',
    'coreViews/navigationView',  
    'coreJS/router',
    'bootstrap',
    'templates'
], function (AdaptBuilder, NavigationView, Router) {
    
    var navView = new NavigationView({el:'#nav'});
    navView.render(); 
  
    AdaptBuilder.initialize();

});