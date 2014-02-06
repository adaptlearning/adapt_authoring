define(function(require) {

  var Backbone = require('backbone'),
      AdaptBuilder = require('coreJS/adaptbuilder');


  var ProfileModel = Backbone.Model.extend({

    idAttribute: '_id',

    defaults: {
      id: -1,
      email: '',
      auth: '',
      password: '',
      tenant: '',
      active: false
    },

    initialize: function() { },

    url: function () {
      //@todo : swap this to the correct url
      return "/api/user/" + this.get('id');
    }

  });

  return ProfileModel;

})