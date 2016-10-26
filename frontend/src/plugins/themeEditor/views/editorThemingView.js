// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Backbone = require('backbone');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');
  var Handlebars = require('handlebars');
  var Helpers = require('coreJS/app/helpers');
  var Origin = require('coreJS/app/origin');
  var ThemeCollection = require('editorTheme/collections/editorThemeCollection');

  var PresetCollection = require('../collections/editorPresetCollection.js');
  var PresetEditView = require('./editorPresetEditView.js');
  var PresetModel = require('../models/editorPresetModel.js');

  var ThemingView = EditorOriginView.extend({
    tagName: 'div',
    className: 'theming',

    settings: {
      autoRender: false
    },

    events: {
      'change .theme select': 'onThemeChanged',
      'change .preset select': 'onPresetChanged',
      'click button.edit': 'showPresetEdit',
      'click button.reset': 'restoreDefaultSettings'
    },

    initialize: function() {
      Origin.trigger('location:title:update', { title: window.polyglot.t('app.themingtitle') });

      this.listenTo(this, 'dataReady', this.render);
      this.listenTo(Origin, 'editorThemingSidebar:views:save', this.saveData);
      this.listenTo(Origin, 'editorThemingSidebar:views:savePreset', this.onSavePresetClicked);

      this.listenTo(Origin, 'managePresets:edit', this.onEditPreset);
      this.listenTo(Origin, 'managePresets:delete', this.onDeletePreset);

      this.loadCollections();

      EditorOriginView.prototype.initialize.apply(this, arguments);
    },

    preRender: function() {
      this.$el.hide();
    },

    render: function() {
      EditorOriginView.prototype.render.apply(this, arguments);
      this.renderForm();
    },

    renderForm: function() {
      this.removeForm();

      var selectedTheme = this.getSelectedTheme();

      if(this.themeIsEditable(selectedTheme)) {
        this.$('.tile.preset').show();
        this.$('.buttons-container').show();

        this.form = Origin.scaffold.buildForm({
          model: selectedTheme,
          schemaType: selectedTheme.get('theme')
        });

        if(this.form) {
          this.$('.form-container').html(this.form.el);
          this.$('.empty-message').hide();
        } else {
          this.$('.empty-message').show();
        }

        this.$('.theme-customiser').show();
        Origin.trigger('theming:showPresetButton', true);

        var toRestore = Origin.editor.data.course.get('themeSettings') || this.getDefaultThemeSettings();
        this.restoreFormSettings(toRestore);
      } else {
        this.$('.tile.preset').hide();
        this.$('.buttons-container').hide();
      }
    },

    removeForm: function() {
      this.$('.form-container').empty();
      this.$('.theme-customiser').hide();

      this.form = null;

      Origin.trigger('theming:showPresetButton', false);
    },

    postRender: function() {
      this.updateSelects();
      this.setViewToReady();

      this.$el.show();
    },

    loadCollections: function() {
      this.themes = new ThemeCollection();
      this.listenTo(this.themes, 'sync', this.onCollectionReady);
      this.listenTo(this.themes, 'error', this.onError);
      this.themes.fetch();

      this.presets = new PresetCollection();
      this.listenTo(this.presets, 'sync', this.onCollectionReady);
      this.listenTo(this.presets, 'error', this.onError);
      this.presets.fetch();
    },

    updateSelects: function() {
      this.updateThemeSelect();
      this.updatePresetSelect();
    },

    updateThemeSelect: function() {
      var select = this.$('.theme select');
      var oldVal = select.val();
      // remove options first
      $('option', select).remove();
      // add 'no presets'
      select.append($('<option>', { value: "", disabled: 'disabled', selected: 'selected' }).text(window.polyglot.t('app.selectinstr')));
      // add options
      _.each(this.themes.models, function(item, index) {
        if(item.get('_isAvailableInEditor') === false) return;
        select.append($('<option>', { value: item.get('_id') }).text(item.get('displayName')));
      }, this);

      // disable if no options
      select.attr('disabled', this.themes.models.length === 0);

      // restore the previous value
      if(oldVal) return select.val(oldVal);

      // select current theme
      var selectedTheme = this.getSelectedTheme();
      if(selectedTheme) select.val(selectedTheme.get('_id'));
    },

    updatePresetSelect: function() {
      var theme = this.$('.theme select').val();
      var presets = this.presets.where({ parentTheme: theme });
      var select = this.$('.preset select');
      // remove options first
      $('option', select).remove();
      // add 'no presets'
      select.append($('<option>', { value: "", selected: 'selected' }).text(window.polyglot.t('app.nopresets')));
      // add options
      _.each(presets, function(item, index) {
        select.append($('<option>', { value: item.get('_id') }).text(item.get('displayName')));
      }, this);
      // disable delect, hide manage preset buttons if empty
      if(presets.length > 0) {
        // TODO check selected preset exists in db (in case deleted)
        var selectedPreset = this.getSelectedPreset();
        if(selectedPreset && selectedPreset.get('parentTheme') === theme) {
          select.val(selectedPreset.get('_id'));
        }
        select.attr('disabled', false);
        this.$('button.edit').show();
      } else {
        select.attr('disabled', true);
        this.$('button.edit').hide();
      }

      // TODO need to hide reset button if defaults selected
    },

    restoreFormSettings: function(toRestore) {
      if(!this.form || !this.form.el) return;

      for(var key in toRestore) {
        var view = this.form.fields[key];
        if(view.schema.fieldType === 'ColorPicker') {
          view.setValue(toRestore[key]);
        }
        else {
          view.editor.$el.val(toRestore[key].toString());
        }
      }
    },

    showPresetEdit: function(event) {
      event && event.preventDefault();
      var parentTheme = this.getSelectedTheme().get('_id');
      var pev = new PresetEditView({
        model: new Backbone.Model({ presets: new Backbone.Collection(this.presets.where({ parentTheme: parentTheme })) })
      });
      $('body').append(pev.el);
    },

    restoreDefaultSettings: function(event) {
      event && event.preventDefault();
      var self = this;
      Origin.Notify.confirm({
        type: 'warning',
        text: window.polyglot.t('app.restoredefaultstext'),
        callback: function(confirmed) {
          if(confirmed) {
            var preset = self.getSelectedPreset();
            var settings = (preset) ? preset.get('properties') : self.getDefaultThemeSettings();
            self.restoreFormSettings(settings);
          }
        }
      });
    },

    /**
    * Data persistence
    */

    // checks form for errors, returns boolean
    validateForm: function() {
      var selectedTheme = this.getSelectedTheme();
      var selectedPreset = this.getSelectedPreset();

      if (selectedTheme === undefined) {
        Origin.Notify.alert({
          type: 'error',
          text: window.polyglot.t('app.errornothemeselected')
        });
        return false;
      }
      return true;
    },

    savePreset: function(presetName) {
      // first, save the form data
      this.form.commit();

      var presetModel = new PresetModel({
        displayName: presetName,
        parentTheme: this.getSelectedTheme().get('_id'),
        properties: _.pick(this.form.model.attributes, Object.keys(this.form.model.get('properties')))
      });

      var self = this;
      presetModel.save(null, {
        error: function(model, response, options) {
          Origin.Notify.alert({ type: 'error', text: response });
        },
        success: function() {
          self.presets.add(presetModel);
          // HACK reorder things so this works without setTimeout later
          window.setTimeout(function() { self.$('.preset select').val(presetModel.get('_id')); }, 1);
        }
      });
    },

    saveData: function(event) {
      event && event.preventDefault();

      if(!this.validateForm()) {
        return Origin.trigger('sidebar:resetButtons');
      }

      this.postThemeData(function(){
        this.postPresetData(function() {
          this.postSettingsData(this.onSaveSuccess);
        });
      });
    },

    postThemeData: function(callback) {
      var selectedTheme = this.getSelectedTheme();
      var selectedThemeId = selectedTheme.get('_id');
      $.post('/api/theme/' + selectedThemeId + '/makeitso/' + this.model.get('_courseId'))
        .error(_.bind(this.onSaveError, this))
        .done(_.bind(callback, this));
    },

    postPresetData: function(callback) {
      var selectedPreset = this.getSelectedPreset(false);
      if(selectedPreset) {
        var selectedPresetId = selectedPreset.get('_id');
        $.post('/api/themepreset/' + selectedPresetId + '/makeitso/' + this.model.get('_courseId'))
        .error(_.bind(this.onSaveError, this))
        .done(_.bind(callback, this));
      } else {
        callback.apply(this);
      }
    },

    postSettingsData: function(callback) {
      if(this.form) {
        this.form.commit();
        var selectedTheme = this.getSelectedTheme();
        var settings = _.pick(selectedTheme.attributes, Object.keys(selectedTheme.get('properties')));
        Origin.editor.data.course.set('themeSettings', settings);
        Origin.editor.data.course.save(null, {
          error: _.bind(this.onSaveError, this),
          success: _.bind(callback, this)
        });
      } else {
        callback.apply(this);
      }
    },

    navigateBack: function(event) {
      event && event.preventDefault();
      Backbone.history.history.back();
      this.remove();
    },

    isDataLoaded: function() {
      return this.themes.ready === true && this.presets.ready === true;
    },

    getSelectedTheme: function() {
      var themeId = $('select#theme', this.$el).val();
      if(themeId) {
        return this.themes.findWhere({ '_id': themeId });
      } else {
        return this.themes.findWhere({ 'name': this.model.get('_theme') });
      }
    },

    // param used to only return the val() (and ignore model data)
    getSelectedPreset: function(includeCached) {
      var presetId = $('select#preset', this.$el).val();
      if(presetId) {
        return this.presets.findWhere({ '_id': presetId });
      } else if(includeCached !== false){
        var selectedTheme = this.getSelectedTheme();
        if(!selectedTheme) return;
        var parent = selectedTheme.get('_id');
        return this.presets.findWhere({ '_id': this.model.get('_themepreset'), parentTheme: parent });
      }
    },

    getDefaultThemeSettings: function() {
      var defaults = {};
      var props = this.getSelectedTheme().get('properties');
      for (var key in props) {
        if (props.hasOwnProperty(key)) {
          defaults[key] = props[key].default;
        }
      }
      return defaults;
    },

    themeIsEditable: function(theme) {
      // Dirty HACK, remove this when vanilla schema is fixed...
      if('adapt-contrib-vanilla' === theme.get('name')) {
        return false;
      }
      var props = theme && theme.get('properties');
      if(!props) {
        return false;
      }
      if(Object.keys(props).length === 1 && props.pluginLocations !== undefined) {
        return false;
      }
      return true;
    },


    /**
    * Event handling
    */

    onEditPreset: function(data) {
      var model = this.presets.findWhere({ displayName: data.oldValue });
      model.set('displayName', data.newValue);
      model.save();
    },

    onDeletePreset: function(preset) {
      this.presets.findWhere({ displayName: preset }).destroy();
    },

    onCollectionReady: function(collection) {
      if(collection === this.themes || collection === this.presets) {
        collection.ready = true;
        if(this.isDataLoaded()) this.trigger('dataReady');
      }
      // must just be a model
      else {
        this.updateSelects();
      }
    },

    onError: function(collection, response, options) {
      Origin.Notify.alert({
        type: 'error',
        text: response
      });
    },

    onThemeChanged: function(event) {
      this.updatePresetSelect();
      this.renderForm();
    },

    onPresetChanged: function(event) {
      var preset = this.presets.findWhere({ _id: $(event.currentTarget).val() });
      var settings = preset && preset.get('properties') || this.getDefaultThemeSettings();
      this.restoreFormSettings(settings);
    },

    onSavePresetClicked: function() {
      var self = this;
      Origin.Notify.alert({
        type: 'input',
        text: window.polyglot.t('app.presetinputtext'),
        closeOnConfirm: false,
        showCancelButton: true,
        callback: function() {
          var preset = self.presets.findWhere({ displayName: arguments[0] })
          if(preset) {
            swal.showInputError(window.polyglot.t('app.duplicatepreseterror'));
          } else {
            // watch out for injection attacks
            self.savePreset(Helpers.escapeText(arguments[0]));
            swal.close();
          }
        }
      });
    },

    onSaveError: function() {
      Origin.Notify.alert({
        type: 'error',
        text: window.polyglot.t('app.errorsave')
      });
      console.log('EditorThemingView.onSaveError:', arguments);

      this.navigateBack();
    },

    onSaveSuccess: function() {
      Origin.trigger('editingOverlay:views:hide');
      Origin.trigger('editor:refreshData', this.navigateBack, this);
    }
  }, {
    template: 'editorTheming'
  });

  return ThemingView;
});
