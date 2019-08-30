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
      this.listenTo(Origin, {
        'frameworkImport:showDetails': this.showDetails,
        'frameworkImport:completeImport': this.completeImport
      });
    },

    postRender: function() {
      // tagging
      this.$('#tags_control').tagsInput({
        autocomplete_url: 'api/autocomplete/tag',
        onAddTag: this.onAddTag.bind(this),
        onRemoveTag: this.onRemoveTag.bind(this),
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

        error: this.onAjaxError.bind(this),
        success: this.displayDetails.bind(this)
      });

      return false;
    },

    displayDetails: function(data) {
      this.$('#import_upload').addClass('display-none');
      this.sidebarView.$('.framework-import-sidebar-save-button').removeClass('show-details');
      var $details = this.$('#import_details');
      var $frameworkVersions = $details.find('.framework-versions');

      if (_.isEmpty(data.pluginVersions.red)  && !data.frameworkVersions.downgrade) {
        $('.framework-import-sidebar-save-button').addClass('save');
      } else {
        $('.framework-import-sidebar-save-button').remove();
      }

      // Framework versions panel
      if ((data.frameworkVersions.imported !== data.frameworkVersions.installed) && !data.frameworkVersions.downgrade) {
        $frameworkVersions.html(Origin.l10n.t('app.importframeworkversions', {
          importVersion: data.frameworkVersions.imported,
          installedVersion: data.frameworkVersions.installed
        })).removeClass('display-none');
      }

      // Can/Cannot be imported summary
      this.displaySummary(data);

      // Plugin list
      this.displayPluginList(data);

      $details.removeClass('display-none');
    },

    displaySummary: function(data) {
      var $details = this.$('#import_details');
      var $summaryTitle = $details.find('.import-summary .title');
      var $summaryDescription = $details.find('.import-summary .description');
      this.sidebarView.resetButtons();

      $summaryTitle.addClass('red').text(Origin.l10n.t('app.coursecannotbeimported'));

      if (!_.isEmpty(data.pluginVersions.red)) {
        $summaryDescription.text(Origin.l10n.t('app.coursecannotbeimporteddesc'));
        return;
      }

      if (data.frameworkVersions.downgrade) {
        $summaryDescription.text(Origin.l10n.t('app.coursecannotbeimporteddowngradedesc'));
        return;
      }

      $summaryTitle.removeClass('red').text(Origin.l10n.t('app.coursecanbeimported'));

      var greenExists = !(_.isEmpty(data.pluginVersions['green-install']) && _.isEmpty(data.pluginVersions['green-update']));
      if (_.isEmpty(data.pluginVersions.amber) && !greenExists) {
        $summaryDescription.text(Origin.l10n.t('app.coursecanbeimportedwhitedesc'));
        return;
      }

      $summaryTitle.addClass('amber');
      $summaryDescription.text(Origin.l10n.t('app.coursecanbeimporteddesc'));
      if (greenExists && _.isEmpty(data.pluginVersions.amber)) {
        $summaryTitle.removeClass('amber').addClass('green');
      }
    },

    displayPluginList: function(data) {
      var $pluginList = this.$('#import_details').find('.plugin-list');
      var categoryMap = {
        'green-install': {
          label: 'app.plugingreeninstalllabel'
        },
        'green-update': {
          label: 'app.plugingreenupdatelabel'
        },
        'amber': {
          label: 'app.pluginamberlabel'
        },
        'red': {
          label: 'app.pluginredlabel'
        }
      };
      var categories = ['red', 'amber', 'green-update', 'green-install'];

      $pluginList.append(new FrameworkImportPluginHeadingView().$el);

      for (var i = 0, j = categories.length; i < j; i++) {
        var categoryData = data.pluginVersions[categories[i]];
        if (categories[i] === 'white') continue;
        if (_.isEmpty(categoryData)) continue;

        // Sort plugins alphabetically
        var pluginArray = Object.keys(categoryData).map(function(e) {
          return categoryData[e]
        });
        pluginArray = pluginArray.sort(function(a, b) {
          return a.displayName.localeCompare(b.displayName);
        });

        pluginArray.forEach(function(plugin) {
          plugin.status = Origin.l10n.t(categoryMap[categories[i]].label);
          plugin.category = categories[i];
          $pluginList.find('.frameworkImportPlugin-plugins').append(new FrameworkImportPluginView({ data: plugin }).$el);
        });

        $pluginList.removeClass('display-none');
        $pluginList.find('.key-field.'+ categories[i]).removeClass('display-none');
      }
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
      this.sidebarView.updateButton('.framework-import-sidebar-save-button', Origin.l10n.t('app.importing'));

      this.$('form.frameworkImportDetails').ajaxSubmit({
        error: this.onAjaxError.bind(this),
        success: this.onFormSubmitSuccess.bind(this)
      });
    }
  }, {
    template: 'frameworkImport'
  });

  return FrameworkImportView;
});
