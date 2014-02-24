define(function(require) {
    var Backbone = require('backbone');
    var AdaptBuilder = require('coreJS/app/adaptbuilder');

    var ProjectModel = Backbone.Model.extend({

      defaults: {
        type:'page' //@todo best default
      },

      initialize: function(options) {
          this.on('sync', this.loadedData, this);
      },

      url: function () {
        var stRet = '/api/content/'+ this.type + '/';

        if(!this.get('id')){
          return stRet;
        } else {
          return stRet + this.get('id');
        }
      },

      loadedData: function() {
          console.log('course content model loaded');
          AdaptBuilder.trigger('loaded:data');
      }

    });

    return ProjectModel;

});