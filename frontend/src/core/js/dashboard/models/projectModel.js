define(function(require) {
    var Backbone = require('backbone');
    var AdaptBuilder = require('coreJS/adaptbuilder');

    var ProjectModel = Backbone.Model.extend({

      idAttribute: '_id',

      urlRoot: '/api/content/course'

    });

    return ProjectModel;

});