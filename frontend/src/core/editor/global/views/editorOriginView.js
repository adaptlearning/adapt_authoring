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
    }

  });

  return EditorOriginView;

});
