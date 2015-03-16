// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Backbone = require('backbone');
  var ProjectModel = require('coreJS/project/models/projectModel');

  var MyProjectCollection = Backbone.Collection.extend({

    model: ProjectModel,

    url: 'api/my/course'

  });

  return MyProjectCollection;

});