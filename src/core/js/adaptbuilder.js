define(["underscore", "backbone"], function(_, Backbone){
    
    var AdaptBuilder = {};

    _.extend(AdaptBuilder, Backbone.Events);
    
    AdaptBuilder.initialize = _.once(function() {
        AdaptBuilder.trigger('adaptbuilder:initialize');
        Backbone.history.start();
    });
    
    AdaptBuilder.componentStore = {};
    
    AdaptBuilder.register = function(name, object) {
        
        if (AdaptBuilder.componentStore[name])
            throw Error('This component already exists in your project');
        AdaptBuilder.componentStore[name] = object;     
        
    }
    
    return AdaptBuilder;
    
});
