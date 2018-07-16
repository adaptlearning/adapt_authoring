define([
  'core/origin',
  'backbone-forms',
  'backbone-forms-lists',
  './overrideBackboneForms/base',
  './overrideBackboneForms/form',
  './overrideBackboneForms/textArea',
  './overrideBackboneForms/field',
  './overrideBackboneForms/text',
  './overrideBackboneForms/number',
  './overrideBackboneFormsLists/list',
  './overrideBackboneFormsLists/listItem',
  './overrideBackboneFormsLists/listModal'
], function(
  Origin,
  BackboneForms,
  BackboneFormsLists, 
  Base,
  Form,
  TextArea,
  Field,
  TextView,
  NumberView,
  List,
  ListModalView
) {

  var templates = Handlebars.templates;
  var fieldTemplate = templates.field;
  
  Backbone.Form.prototype.constructor.template = templates.form;
  Backbone.Form.Fieldset.prototype.template = templates.fieldset;
  Backbone.Form.Field.prototype.template = fieldTemplate;
  Backbone.Form.NestedField.prototype.template = fieldTemplate;
  Backbone.Form.editors.List.prototype.constructor.template = templates.list;
  Backbone.Form.editors.List.Item.prototype.constructor.template = templates.listItem;

  _.extend(Backbone.Form.editors.Base.prototype, Base);
  _.extend(Backbone.Form.prototype, Form);
  _.extend(Backbone.Form.editors.TextArea.prototype, TextArea);
  _.extend(Backbone.Form.Field.prototype, Field);
  _.extend(Backbone.Form.editors.Text.prototype, TextView);
  _.extend(Backbone.Form.editors.Number.prototype, NumberView);

  _.extend(Backbone.Form.editors.List.prototype, List);
  _.extend(Backbone.Form.editors.List.Modal.prototype, ListModalView);

});
