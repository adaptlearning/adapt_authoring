// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Helpers = require('core/helpers');
  var Origin = require('core/origin');
  var _ = require('underscore');

  var MessageManagementModel = Backbone.Model.extend({

    idAttribute: '_id',
    url: 'api/messages',

    validate: function (attributes, options) {
      var validationErrors = {};
      if(attributes.generalRibbonEnabled){
        var generalRibbonWCAG = Helpers.getWCAGStatus(attributes.generalRibbonBgColor, attributes.generalRibbonTextColor);
        if (!attributes.generalRibbonEN) {
          validationErrors.generalRibbonEN = Origin.l10n.t('app.validationrequired');
        }
        if (!attributes.generalRibbonFR) {
          validationErrors.generalRibbonFR = Origin.l10n.t('app.validationrequired');
        }
        if (!generalRibbonWCAG){
          validationErrors.generalRibbonBgColor = Origin.l10n.t('app.validationWCAG');
          validationErrors.generalRibbonTextColor = Origin.l10n.t('app.validationWCAG');
        }
      }

      return _.isEmpty(validationErrors) 
      ? null
      : validationErrors;
    }

  });

  return MessageManagementModel;

});