// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var ProjectModel = require('./projectModel');

  var ProjectContentObjectModel = ProjectModel.extend({

    urlRoot: '/api/content/contentobject',

    _parent: 'course',

    _siblings:'contentObjects',

    _children: 'articles',

    defaults: {
      _isSelected: false,
      _isExpanded: false
    }
  });

  return ProjectContentObjectModel;

});