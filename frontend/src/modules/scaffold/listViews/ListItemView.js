define([
  'libraries/backbone-forms-lists/ListItemView'
], function(ListItemView) {
  'use strict';
  
  var CustomListItemView = ListItemView.extend({
  }, {
    template: Handlebars.templates.listItem
  })

  return CustomListItemView;

});