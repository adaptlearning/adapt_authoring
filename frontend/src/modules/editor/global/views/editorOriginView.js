// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var Helpers = require('core/helpers');

  var EditorOriginView = OriginView.extend({
    events: {
      'click .paste-cancel': 'onPasteCancel',
      'click .field-object .legend': 'onFieldObjectClicked'
    },

    initialize: function(options) {
      // Set form on view
      if (options && options.form) {
        this.form = options.form;
        this.filters = [];
      }
      OriginView.prototype.initialize.apply(this, arguments);

      this.listenTo(Origin, {
        'sidebarFieldsetFilter:filterForm': this.filterForm,
        'editorView:pasteCancel': this.hidePasteZones
      });
    },

    render: function() {
      OriginView.prototype.render.apply(this, arguments);
      if(this.model) {
        this.$el.attr('data-id', this.model.get('_id'));
      }
      return this;
    },

    postRender: function() {
      if (!this.form) {
        return this.setViewToReady();
      }
      this.$('.form-container').append(this.form.el);
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
        $('.form-container > form > div > fieldset').removeClass('display-none');
      } else {
        $('.form-container > form > div > fieldset').addClass('display-none');
        _.each(this.filters, function(filter) {
          $('.fieldset-' + Helpers.lowerCase(filter)).removeClass('display-none');
        });
      }
    },

    showPasteZones: function(type) {
      $('.paste-zone').addClass('display-none');
      $('.add-control').addClass('display-none');
      if(type) $('.paste-zone-' + type).removeClass('display-none').addClass('show');
    },

    hidePasteZones: function() {
      $('.paste-zone').removeClass('show');
      // FIXME timeout for animation
      setTimeout(function() { $('.paste-zone').addClass('display-none'); }, 300);
      $('.add-control').removeClass('display-none');
    },

    showDropZones: function (supportedLayout) {
      $('.paste-zone').addClass('display-none');
      $('.add-control').addClass('display-none');
      $('.paste-zone-'+ this.model.get('_type') + ' a').addClass('display-none');
      // Components may be restricted to either full or half width so
      // make sure only the appropriate paste zones are displayed
      var type = this.model.get('_type');
      var pasteZoneSelector = '.paste-zone-'+ type;
      var $pasteZones;

      if (type === 'component') {
        $pasteZones = $();
        if (supportedLayout.full) {
          $pasteZones = $pasteZones.add('.paste-zone-component-full');
        }
        if (supportedLayout.half) {
          $pasteZones = $pasteZones.add('.paste-zone-component-left, .paste-zone-component-right');
        }
      } else {
        $pasteZones = $(pasteZoneSelector);
      }

      $(pasteZoneSelector + ' a').addClass('display-none');

      $pasteZones
        .addClass('paste-zone-available')
        .removeClass('display-none');

      this.$el.parent()
        .children('.drop-only')
        .removeClass('display-none');
    },

    hideDropZones: function() {
      $('.paste-zone')
        .addClass('display-none')
        .removeClass('paste-zone-available');

      $('.add-control').removeClass('display-none');
      $('.paste-zone a').removeClass('display-none');

      this.$el.parent()
        .children('.drop-only')
        .addClass('display-none');
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
          Origin.l10n.t('app.validationfailedmessage') + "<br/><br/>" +
          this.buildErrorMessage(errors, '');

        // TODO remove when we've got a better solution
        this.onSaveError(Origin.l10n.t('app.validationfailed'), errorText);

        return;
      }

      this.form.commit();
      this.model.pruneAttributes();

      var attrs = this.getAttributesToSave();
      this.model.save(attrs, {
        patch: (attrs) ? true : false,
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

    getAttributesToSave: function() {
      return null;
    },

    /**
    * Event handling
    */

    openContextMenu: function (e) {
      if(e) {
        e.stopPropagation();
        e.preventDefault();
      }
      Origin.trigger('contextMenu:open', this, e);
    },

    onFieldObjectClicked: function(event) {
      $(event.currentTarget)
        .closest('.field-object')
        .children('.collapsed')
        .first()
        .toggleClass('expanded');
    },

    onCopy: function(e) {
      e && e.preventDefault();
      Origin.trigger('editorView:copy', this.model);
    },

    onCopyID: function(e) {
      e && e.preventDefault();
      Origin.trigger('editorView:copyID', this.model);
    },

    onPaste: function(e) {
      if(e) {
        e.stopPropagation();
        e.preventDefault();
      }
      Origin.trigger('editorView:paste', this.model.get('_parentId'), $(event.target).data('sort-order'), $(event.target).data('paste-layout'));
    },

    onPasteCancel: function(e) {
      e && e.preventDefault();
      Origin.trigger('editorView:pasteCancel', this.model);
    },

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
  });

  return EditorOriginView;
});
