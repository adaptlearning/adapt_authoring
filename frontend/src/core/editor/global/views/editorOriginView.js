// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var Helpers = require('coreJS/app/helpers');

  var EditorOriginView = OriginView.extend({

    events: {
      'click .paste-cancel'   : 'pasteCancel',
      'click .field-object .legend': 'onFieldObjectClicked'
    },

    onFieldObjectClicked: function(event) {
      $(event.currentTarget).closest('.field-object').children('.collapsed').first().toggleClass('expanded');
    },

    initialize: function(options) {
      // Set form on view
      if (options && options.form) {
        this.form = options.form;
        this.filters = [];
      }
      OriginView.prototype.initialize.apply(this, arguments);
      this.listenTo(Origin, 'sidebarFieldsetFilter:filterForm', this.filterForm);
      this.listenTo(Origin, 'editorView:pasteCancel', this.hidePasteZones);
    },

    filterForm: function(filter) {
      // Check if the tag is already being filtered and remove it
      if (_.contains(this.filters, filter)) {
          this.filters = _.reject(this.filters, function(filterItem) {
              return filterItem === filter;
          });
      } else {
          // Else add it to array
          this.filters.push(filter);
      }

      // Now actually filter the form
      if (this.filters.length === 0) {
        $('.form-container > form > div > fieldset').removeClass('display-none');
      } else {
        $('.form-container > form > div > fieldset').addClass('display-none');
        _.each(this.filters, function(filter) {
          $('.fieldset-' + Helpers.lowerCase(filter)).removeClass('display-none');
        });
      }
    },

    postRender: function() {
      // On post render - pop the form into place
      if (!this.form) {
        this.setViewToReady();
        return;
      }
      var that = this;
      this.$('.form-container').append(this.form.el);
      // Set the delays going to stop jumping pages
      _.delay(function() {
        that.setViewToReady();
      }, 400);
    },

    onCopy: function(event) {
      if (event) {
        event.preventDefault();
      }

      Origin.trigger('editorView:copy', this.model);
    },

    onCopyID: function(event) {
      if (event) {
        event.preventDefault();
      }

      Origin.trigger('editorView:copyID', this.model);
    },

    onCut: function(event) {
      if (event) {
        event.preventDefault();
      }

      Origin.trigger('editorView:cut', this);
    },

    capitalise: function(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    },

    onPaste: function(event) {
      event.preventDefault();
      event.stopPropagation();

      Origin.trigger('editorView:paste', this.model.get('_parentId'), $(event.target).data('sort-order'), $(event.target).data('paste-layout'));
    },

    pasteCancel: function(event) {
      event.preventDefault();

      Origin.trigger('editorView:pasteCancel', this.model);
    },

    hidePasteZones: function() {
      // Purposeful global selector here
      $('.paste-zone').addClass('display-none');
      $('.add-control').removeClass('display-none');
    },

    openContextMenu: function (e) {
      e.stopPropagation();
      e.preventDefault();

      Origin.trigger('contextMenu:open', this, e);
    },

    showPasteZones: function (type) {
      $('.paste-zone').addClass('display-none');
      $('.add-control').addClass('display-none');
      type && $('.paste-zone-' + type).removeClass('display-none');
    },

    showDropZones: function () {
      // Purposeful global selector here
      $('.paste-zone').addClass('display-none');
      // Hide the links within the dropzone
      $('.add-control').addClass('display-none');
      $('.paste-zone-'+ this.model.get('_type') + ' a').addClass('display-none');
      $('.paste-zone-'+ this.model.get('_type')).addClass('paste-zone-available').removeClass('display-none');
      this.$el.parent().children('.drop-only').removeClass('display-none');
    },

    hideDropZones: function() {
      // Purposeful global selectors here
      $('.paste-zone').addClass('display-none').removeClass('paste-zone-available');
      $('.add-control').removeClass('display-none');
      // Show the links within the dropzone again, incase copy is initiated
      $('.paste-zone a').removeClass('display-none');
      this.$el.parent().children('.drop-only').addClass('display-none')
    },

    save: function() {
      if(!this.form) {
        return;
      }
      var errors = this.form.validate();

      // MUST trigger as sidebar needs to know when the form has been resubmitted
      Origin.trigger('editorSidebar:showErrors', errors);

      if (errors) {
        var errorText =
          window.polyglot.t('app.validationfailedmessage') +
          "<br/><br/>" +
          this.buildErrorMessage(errors, '');

        // TODO remove when we've got a better solution
        this.onSaveError(window.polyglot.t('app.validationfailed'), errorText);

        return;
      }

      this.form.commit();
      this.model.pruneAttributes();

      var self = this;
      var attrs = this.getAttributesToSave();
      this.model.save(attrs, {
        patch: (attrs) ? true : false,
        error: _.bind(this.onSaveError, self),
        success: _.bind(this.onSaveSuccess, self)
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

    getAttributesToSave: function() {
      return null;
    },

    onSaveError: function(pTitle, pText) {
      var title = _.isString(pTitle) ? pTitle : window.polyglot.t('app.errordefaulttitle');
      var text = _.isString(pText) ? pText : window.polyglot.t('app.errorsave');

      Origin.Notify.alert({
        type: 'error',
        title: title,
        text: text
      });
      Origin.trigger('sidebar:resetButtons');
    },

    onSaveSuccess: function() {
      Origin.trigger('editingOverlay:views:hide');
      Origin.trigger('editor:refreshData', function() {
        Backbone.history.history.back();
        this.remove();
      }, this);
    }
  });

  return EditorOriginView;
});
