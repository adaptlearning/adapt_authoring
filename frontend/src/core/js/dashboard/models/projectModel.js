define(function(require) {
    var Backbone = require('backbone');
    var AdaptBuilder = require('coreJS/adaptbuilder');

    var ProjectModel = Backbone.Model.extend({

      idAttribute: '_id',

      initialize: function(options) {
          this.on('sync', this.loadedData, this);
      },

      url: function () {
        var url = '/api/content/course';

        return (!this.get('id') ? url : url + '/' + this.get('id'));
      },

      loadedData: function() {
          console.log('course model loaded');
          AdaptBuilder.trigger('loaded:data');
      }

    });

    return ProjectModel;

});