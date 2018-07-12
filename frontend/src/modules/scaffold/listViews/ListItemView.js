define([
  'backbone-forms',
  'backbone-forms-lists',
], function(BackboneForms, BackboneFormsLists) {
  'use strict';
  
  var CustomListItemView = Backbone.Form.editors.List.Item.extend({
  }, {
    template: Handlebars.templates.listItem
  })

  return CustomListItemView;

});