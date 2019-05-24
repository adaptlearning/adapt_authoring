// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var FrameworkImportPluginHeadingView = require('./frameworkImportPluginHeadingView');
  var FrameworkImportPluginView = require('./frameworkImportPluginView');

  var FrameworkImportView = OriginView.extend({
    tagName: 'div',
    className: 'frameworkImport',
    createdCourseId: false,

    preRender: function() {
      Origin.trigger('location:title:update', { title: Origin.l10n.t('app.frameworkimporttitle') });
      this.listenTo(Origin, 'frameworkImport:showDetails', this.showDetails);
      this.listenTo(Origin, 'frameworkImport:completeImport', this.completeImport);
    },

    postRender: function() {
      // tagging
      this.$('#tags_control').tagsInput({
        autocomplete_url: 'api/autocomplete/tag',
        onAddTag: _.bind(this.onAddTag, this),
        onRemoveTag: _.bind(this.onRemoveTag, this),
        'minChars' : 3,
        'maxChars' : 30
      });
      this.setViewToReady();
    },

    isValid: function() {
      var uploadFile = this.$('.asset-file');
      var validated = true;
      var uploadFileErrormsg = $('.field-file').find('span.error');

      if (this.model.isNew() && !uploadFile.val()) {
        validated = false;
        $(uploadFile).addClass('input-error');
        $(uploadFileErrormsg).text(Origin.l10n.t('app.pleaseaddfile'));
      } else {
        $(uploadFile).removeClass('input-error');
        $(uploadFileErrormsg).text('');
      }
      return validated;
    },

    showDetails: function(sidebarView) {
      if(!this.isValid()) return;
      this.sidebarView = sidebarView;

      this.sidebarView.updateButton('.framework-import-sidebar-save-button', Origin.l10n.t('app.importing'));

      var tags = [];
      _.each(this.model.get('tags'), function (item) {
        item._id && tags.push(item._id);
      });
      this.$('#tags').val(tags);

      // submit form data
      this.$('form.frameworkImport').ajaxSubmit({

        uploadProgress: function(event, position, total, percentComplete) {
          $(".progress-container").css("visibility", "visible");
          var percentVal = percentComplete + '%';
          $(".progress-bar").css("width", percentVal);
          $('.progress-percent').html(percentVal);
        },

        error: _.bind(this.onAjaxError, this),
        success: _.bind(this.displayDetails, this)
      });

      return false;
    },

    displayDetails: function(data) {
      this.$('#import_upload').addClass('display-none');
      this.sidebarView.$('.framework-import-sidebar-save-button').removeClass('show-details');
      var $details = this.$('#import_details');
      var $framework_versions = $details.find('.framework-versions');
      var categoryMap = {
        'green': {
          summary: 'app.plugingreensummary',
          label: 'app.plugingreenlabel'
        },
        'amber': {
          summary: 'app.pluginambersummary',
          label: 'app.pluginamberlabel'
        },
        'red': {
          summary: 'app.pluginredsummary',
          label: 'app.pluginredlabel'
        }
      };

      if (_.isEmpty(data.pluginVersions.red)) {
        $('.framework-import-sidebar-save-button').addClass('save');
      } else {
        $('.framework-import-sidebar-save-button').remove();
      }

      // Framework versions panel
      if (data.frameworkVersions.imported !== data.frameworkVersions.installed) {
          $framework_versions.text(Origin.l10n.t('app.importframeworkversions', {
              importVersion: data.frameworkVersions.imported,
              installedVersion: data.frameworkVersions.installed
          }));
          $framework_versions.removeClass('display-none');
      }

      // Can/Cannot be imported summary
      this.displaySummary(data);

      // Plugin tables
      for (var category in data.pluginVersions) {
        if (category === 'white') continue;
        if (_.isEmpty(data.pluginVersions[category])) continue;

        var $category_display = $details.find('.plugin-list.' + category);
        $category_display.text(Origin.l10n.t(categoryMap[category].summary));
        $category_display.append(new FrameworkImportPluginHeadingView().$el);
        $category_display.removeClass('display-none');

        // Sort plugins alphabetically
        var pluginArray = Object.values(data.pluginVersions[category]);
          pluginArray = pluginArray.sort(function(a, b) {
            return a.displayName.localeCompare(b.displayName);
        });

        pluginArray.forEach(function(plugin) {
          plugin.status = Origin.l10n.t(categoryMap[category].label);
          $category_display.find('.frameworkImportPlugin-plugins').append(new FrameworkImportPluginView({ data: plugin }).$el);
        });
      }

      $details.removeClass('display-none');
    },

    displaySummary: function(data) {
      var $details = this.$('#import_details');
      var $summary_title = $details.find('.import-summary .title');
      var $summary_description = $details.find('.import-summary .description');
      this.sidebarView.resetButtons();

      if (!_.isEmpty(data.pluginVersions.red)) {
        $summary_title.addClass('red').text(Origin.l10n.t('app.coursecannotbeimported'));
        $summary_description.text(Origin.l10n.t('app.coursecannotbeimporteddesc'));
        return;
      }

      $summary_title.text(Origin.l10n.t('app.coursecanbeimported'));

      if (!_.isEmpty(data.pluginVersions.amber) || !_.isEmpty(data.pluginVersions.green)) {
        $summary_title.addClass('amber');
        $summary_description.text(Origin.l10n.t('app.coursecanbeimporteddesc'));
        if (!_.isEmpty(data.pluginVersions.green) && _.isEmpty(data.pluginVersions.amber)) {
          $summary_title.removeClass('amber').addClass('green');
        }
        return;
      }

      $summary_description.text(Origin.l10n.t('app.coursecanbeimportedwhitedesc'));
      return;
    },

    goBack: function() {
      Origin.router.navigateToHome();
    },

    onFormSubmitSuccess: function(data, importStatus, importXhr) {
      Origin.router.navigateToHome();
    },

    onAjaxError: function(data, status, error) {
      var resJson = data.responseJSON || {};
      var title = resJson.title || Origin.l10n.t('app.importerrortitle');
      var msg = resJson.body && resJson.body.replace(/\n/g, "<br />") || error;
      this.promptUser(title, msg, true);
      this.sidebarView.resetButtons();
    },

    promptUser: function(title, message, isError) {
      Origin.trigger('sidebar:resetButtons');
      Origin.Notify.alert({
        type: (!isError) ? 'success' : 'error',
        title: title,
        text: message
      });
    },

    onAddTag: function (tag) {
      var model = this.model;
      $.ajax({
        url: 'api/content/tag',
        method: 'POST',
        data: { title: tag }
      }).done(function (data) {
        if (data && data._id) {
          var tags = model.get('tags') || [];
          tags.push({ _id: data._id, title: data.title });
          model.set({ tags: tags });
        }
      });
    },

    onRemoveTag: function (tag) {
      var tags = [];
      _.each(this.model.get('tags'), function (item) {
        if (item.title !== tag) {
          tags.push(item);
        }
      });
      this.model.set({ tags: tags });
    },

    completeImport: function() {
      this.$('form.frameworkImportDetails').ajaxSubmit({
        error: _.bind(this.onAjaxError, this),
        success: _.bind(this.onFormSubmitSuccess, this)
      });
    }
  }, {
    template: 'frameworkImport'
  });

  return FrameworkImportView;
});
