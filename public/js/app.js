define(["backbone", "router"], function(Backbone, Router) {
  window.App = {};


  window.App.start = function() {
    new Router();
    Backbone.history.start({pushState:true});
  };
  return window.App;
});