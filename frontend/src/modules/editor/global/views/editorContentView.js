// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var Helpers = require('core/helpers');

  var EditorContentView = OriginView.extend({
    className: 'editor-content',

    getFormContainerDiv: function() { return this.$('.form-container'); },
    getFieldsetDivs: function() { return $('.form-container > form > div > fieldset'); },

    initialize: function(options) {
      // Set form on view
      if (options && options.form) {
        this.form = options.form;
        this.filters = [];
      }
      OriginView.prototype.initialize.apply(this, arguments);

      this.listenTo(Origin, {
        'sidebar:action:save': this.save,
        'sidebar:filter:toggle': this.filterForm,
        'editorView:pasteCancel': this.hidePasteZones
      });
    },

    render: function() {
      OriginView.prototype.render.apply(this, arguments);
      if(this.model) this.$el.attr('data-id', this.model.get('_id'));
      return this;
    },

    postRender: function() {
      if (!this.form) {
        return this.setViewToReady();
      }
      this.getFormContainerDiv().append(this.form.el);

      this.getFieldsetDivs().each(function(i, el) {
        var key = $(el).attr('data-key');
        if(key) this.filters.push(key);
      }.bind(this));

      this.filterForm();
      // Set the delays going to stop jumping pages
      _.delay(_.bind(this.setViewToReady, this, 400));
    },

    filterForm: function(filter) {
      // toggle filter
      if(_.contains(this.filters, filter)) {
        this.filters = _.reject(this.filters, function(filterItem) { return filterItem === filter; });
      } else {
        this.filters.push(filter);
      }
      // Now actually filter the form
      if(this.filters.length === 0) {
        this.getFieldsetDivs().removeClass('display-none');
        return;
      }
      this.getFieldsetDivs().addClass('display-none');
      this.filters.forEach(function(filter) {
        this.$('fieldset[data-key=' + filter + ']').removeClass('display-none');
      });
    },

    save: function() {
      if(!this.form) {
        return;
      }
      var errors = this.form.validate();
      
      Origin.sidebar.showErrors(errors);

      if (errors) {
        var errorText = Origin.l10n.t('app.validationfailedmessage') + "<br/><br/>" + this.buildErrorMessage(errors, '');
        return this.onSaveError(Origin.l10n.t('app.validationfailed'), errorText);
      }
      this.form.commit();
      this.model.pruneAttributes();

      this.model.save(null, {
        success: _.bind(this.onSaveSuccess, this),
        error: _.bind(this.onSaveError, this)
      });
    },

    buildErrorMessage: function(errorObjs, message) {
      _.each(errorObjs, function(item, key) {
        if(item.hasOwnProperty('message')) {
          message += '<span class="key">' + (item.title || key) + '</span>: ' + item.message + '<br/>';
        } else if(_.isObject(item)) { // recurse
          message = this.buildErrorMessage(item, message);
        }
      }, this);
      return message;
    },

    /**
    * Event handling
    */

    onSaveSuccess: function() {
      Origin.trigger('editor:refreshData', _.bind(function() {
        Origin.router.navigateBack();
        this.remove();
      }, this));
    },

    onSaveError: function(pTitle, pText) {
      var title = _.isString(pTitle) ? pTitle : Origin.l10n.t('app.errordefaulttitle');
      var text = _.isString(pText) ? pText : Origin.l10n.t('app.errorsave');
      Origin.Notify.alert({ type: 'error', title: title, text: text });
      Origin.trigger('sidebar:resetButtons');
    }
  }, {
    template: 'editorContent'
  });

  return EditorContentView;
});
