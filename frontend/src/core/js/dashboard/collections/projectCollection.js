define(function(require) {
    var Backbone = require('backbone');
    var ProjectModel = require('coreJS/dashboard/models/projectModel');

    var ProjectCollection = Backbone.Collection.extend({

        model: ProjectModel,

        url: 'api/content/course',

        dateComparator: function(m) {
            return -m.get('lastUpdated').getTime();
        }
    });

    return ProjectCollection;

});