define([
  'core/origin',
  'backbone-forms',
  'core/helpers',
  'core/models/courseAssetModel',
  'core/collections/contentCollection',
  'modules/assetManagement/views/assetManagementModalView',
  'modules/assetManagement/collections/assetCollection'
], function(Origin, BackboneForms, Helpers, CourseAssetModel, ContentCollection, AssetManagementModalView, AssetCollection) {

  var ScaffoldAssetView = Backbone.Form.editors.Base.extend({

    events: {
      'change input': function() { this.trigger('change', this); },
      'focus input': function() { this.trigger('focus', this); },
      'blur input': function() { this.trigger('blur', this); },
      'click .scaffold-asset-picker': 'onAssetButtonClicked',
      'click .scaffold-asset-clear': 'onClearButtonClicked',
      'click .scaffold-asset-external': 'onExternalAssetButtonClicked',
      'click .scaffold-asset-external-input-save': 'onExternalAssetSaveClicked',
      'click .scaffold-asset-external-input-cancel': 'onExternalAssetCancelClicked',
    },

    initialize: function(options) {
      this.listenTo(Origin, 'scaffold:assets:autofill', this.onAutofill);

      Backbone.Form.editors.Base.prototype.initialize.call(this, options);
    },

    render: function() {
      if (!Helpers.isAssetExternal(this.value)) {
        // don't have asset ID, so query courseassets for matching URL && content ID
        this.fetchCourseAsset({
          _fieldName: this.value.split('/').pop()
        }, function(error, collection) {
          if (error) return console.error(error);

          if (collection.length) {
            // re-render once data is loaded
            this.renderData(collection.at(0).get('_assetId'));
          }
        }.bind(this));
      }

      this.setValue(this.value);
      this.renderData();

      return this;
    },

    renderData: function(id) {
      var inputType = this.schema.inputType;
      var dataUrl = Helpers.isAssetExternal(this.value) ? this.value : '';

      this.$el.html(Handlebars.templates[this.constructor.template]({
        value: this.value,
        type: inputType.media || inputType.replace('Asset:', ''),
        url: id ? '/api/asset/serve/' + id : dataUrl,
        thumbUrl: id ? '/api/asset/thumb/' + id : dataUrl
      }));
    },

    checkValueHasChanged: function() {
      var value = this.getValue();

      if (this.key === 'heroImage') return this.saveModel({ heroImage: value });
      if (Helpers.isAssetExternal(value)) return this.saveModel();

      var model = Origin.scaffold.getCurrentModel();
      var contentTypeId = model.get('_id');
      var contentType = model.get('_type');
      var fieldname = value.replace('course/assets/', '');

      this.removeCourseAsset(contentTypeId, contentType, fieldname);
    },

    createCourseAsset: function(courseAssetObject) {
      (new CourseAssetModel()).save({
        _courseId : Origin.editor.data.course.get('_id'),
        _contentType : courseAssetObject.contentType,
        _contentTypeId : courseAssetObject.contentTypeId,
        _fieldName : courseAssetObject.fieldname,
        _assetId : courseAssetObject.assetId,
        _contentTypeParentId: courseAssetObject.contentTypeParentId
      }, {
        success: function() {
          this.saveModel();
        }.bind(this),
        error: function(error) {
          Origin.Notify.alert({
            type: 'error',
            text: Origin.l10n.t('app.errorsaveasset')
          });
        }
      });
    },

    fetchCourseAsset: function(searchCriteria, cb) {
      if (!searchCriteria._contentTypeId) {
        searchCriteria._contentTypeParentId = Origin.editor.data.course.get('_id');
      }

      (new ContentCollection(null, { _type: 'courseasset' })).fetch({
        data: searchCriteria,
        success: function(collection) {
          cb(null, collection);
        },
        error: function(model, response) {
          cb('Failed to fetch data for', model.get('filename') + ':', response.statusText);
        }
      });
    },

    removeCourseAsset: function(contentTypeId, contentType, fieldname) {
      this.fetchCourseAsset({
        _contentTypeId: contentTypeId,
        _contentType: contentType,
        _fieldName: fieldname
      }, function(error, courseassets) {
        if (error) return console.error(error);

        if (!courseassets.length) {
          this.setValue('');
          this.saveModel();
          return;
        }

        var listModels = courseassets.models ? courseassets.models.slice() : courseassets.slice();
        var listModel = listModels[0];

        if (!listModel) return;

        listModel.destroy({
          success: this.saveModel(),
          error: function() {
            console.error('Failed to destroy courseasset record', listModel.get('_id'));
            return;
          }
        });
      }.bind(this));
    },

    saveModel: function(attributesToSave) {
      var isUsingAlternativeModel = false;
      var currentModel = Origin.scaffold.getCurrentModel();
      var alternativeModel = Origin.scaffold.getAlternativeModel();
      var alternativeAttribute = Origin.scaffold.getAlternativeAttribute();

      // Check if alternative model should be used
      if (alternativeModel) {
        currentModel = alternativeModel;
        isUsingAlternativeModel = true;
      }

      // run schema validation
      Origin.scaffold.getCurrentForm().commit({ validate: false });

      // Check if alternative attribute should be used
      if (alternativeAttribute) {
        attributesToSave[alternativeAttribute] = Origin.scaffold.getCurrentModel().attributes;
      }

      if (!attributesToSave) {
        currentModel.pruneAttributes();
      }

      currentModel.save(attributesToSave, {
        patch: attributesToSave !== undefined,
        success: function() {
          this.render();
          this.trigger('change', this);
        }.bind(this),
        error: function() {
          Origin.Notify.alert({
            type: 'error',
            text: Origin.l10n.t('app.errorsaveasset')
          });
        }
      });
    },

    /**
    * Event handling
    */

    focus: function() {
      if (!this.hasFocus) {
        this.$('input').focus();
      }
    },

    blur: function() {
      if (this.hasFocus) {
        this.$('input').blur();
      }
    },

    onAssetButtonClicked: function(event) {
      event.preventDefault();

      Origin.trigger('modal:open', AssetManagementModalView, {
        collection: new AssetCollection,
        assetType: this.schema.inputType,
        _shouldShowScrollbar: false,
        onUpdate: function(data) {
          if (!data) return;

          if (this.key === 'heroImage') {
            this.setValue(data.assetId);
            this.saveModel({ heroImage: data.assetId });
            return;
          }

          var model = Origin.scaffold.getCurrentModel();

          var courseAssetObject = {
            contentTypeId: model.get('_id') || '',
            contentType: model.get('_type') || model._type,
            contentTypeParentId: model.get('_parentId') || Origin.editor.data.course.get('_id'),
            fieldname: data.assetFilename,
            assetId: data.assetId
          };

          // all ScaffoldAssetViews listen to the autofill event, so we trigger
          // that rather than call code directly
          if (data._shouldAutofill) {
            Origin.trigger('scaffold:assets:autofill', courseAssetObject, data.assetLink);
            return;
          }

          this.setValue(data.assetLink);
          this.createCourseAsset(courseAssetObject);
        }
      }, this);
    },

    onClearButtonClicked: function(event) {
      event.preventDefault();

      this.checkValueHasChanged();
      this.setValue('');
    },

    onAutofill: function(courseAssetObject, value) {
      this.setValue(value);
      this.createCourseAsset(courseAssetObject);
    },

    onExternalAssetButtonClicked: function(event) {
      event.preventDefault();

      this.toggleExternalAssetField(true);
    },

    onExternalAssetSaveClicked: function(event) {
      event.preventDefault();

      var inputValue = this.$('.scaffold-asset-external-input-field').val();

      if (!inputValue.length) return this.toggleExternalAssetField(false);

      this.setValue(inputValue);
      this.saveModel();
    },

    onExternalAssetCancelClicked: function(event) {
      event.preventDefault();

      this.toggleExternalAssetField(false);
    },

    toggleExternalAssetField: function(shouldShow) {
      this.$('.scaffold-asset-external-input').toggleClass('display-none', !shouldShow);
      this.$('.scaffold-asset-buttons').toggleClass('display-none', shouldShow);
    }

  }, { template: 'scaffoldAsset' });

  Origin.on('origin:dataReady', function() {
    Origin.scaffold.addCustomField('Asset:image', ScaffoldAssetView);
    Origin.scaffold.addCustomField('Asset:audio', ScaffoldAssetView);
    Origin.scaffold.addCustomField('Asset:video', ScaffoldAssetView);
    Origin.scaffold.addCustomField('Asset:other', ScaffoldAssetView);
    Origin.scaffold.addCustomField('Asset', ScaffoldAssetView);
  });

  return ScaffoldAssetView;

});
