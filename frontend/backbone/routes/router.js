/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	var AppRouter = Backbone.Router.extend({

        routes: {
            ""                  : "home",
            "home"	            : "home"
        },
    
        initialize: function () {
            
        },
    
        home: function (id) {
            if (!this.homeView) {
                this.homeView = new HomeView();
            }
            $('#content').html(this.homeView.el);
        }
    });

	app.AppRouter = new AppRouter();
	Backbone.history.start();
})();
