// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var BackboneForms = require('backbone-forms');
  var Origin = require('core/origin');
  var AssetManagementModalView = require('modules/assetManagement/views/assetManagementModalView');
  var AssetCollection = require('modules/assetManagement/collections/assetCollection');
  var ContentCollection = require('core/collections/contentCollection');
  var CourseAssetModel = require('core/models/courseAssetModel');

  var ScaffoldAssetView = Backbone.Form.editors.Base.extend({
    tagName: 'div',
    events: {
      // triggered whenever something happens that affects the result of `this.getValue()`
      'change input': function() {
        this.toggleFieldAvailibility();
        this.trigger('change', this);
      },
      // triggered whenever an input in this editor becomes the `document.activeElement`
      'focus input': function() {
        this.trigger('focus', this);
      },
      // triggered whenever an input in this editor stops being the `document.activeElement`
      'blur input': function() {
        this.trigger('blur', this);
      },
      'click .scaffold-asset-picker': 'onAssetButtonClicked',
      'click .scaffold-asset-external': 'onExternalAssetButtonClicked',
      'click .scaffold-asset-clear': 'onClearButtonClicked',
      'click .scaffold-asset-external-input-save': 'onExternalAssetSaveClicked',
      'click .scaffold-asset-external-input-cancel': 'onExternalAssetCancelClicked',
      'click .scaffold-asset-clear-external': 'onExternalClearButtonClicked'
    },

    initialize: function(options) {
      this.listenTo(Origin, 'scaffold:assets:autofill', this.onAutofill);
      Backbone.Form.editors.Base.prototype.initialize.call(this, options);
    },

    onAutofill: function(courseAssetObject, value) {
      this.value = value;
      this.createCourseAsset(courseAssetObject);
    },

    render: function() {
      var template = Handlebars.templates[this.constructor.template];
      var templateData = {
        value: this.value,
        type: this.schema.fieldType.replace('Asset:', '')
      };
      // this delgate function is async, so does a re-render once the data is loaded
      var _renderDelegate = _.bind(function(assetId) {
        if(assetId) {
          templateData.url = '/api/asset/serve/' + assetId;
          templateData.thumbUrl = '/api/asset/thumb/' + assetId;
          this.$el.html(template(templateData));
        }
      }, this);
      // don't have asset ID, so query courseassets for matching URL && content ID
      this.fetchCourseAsset({
        _fieldName: this.value.split('/').pop(),
        _contentTypeId: Origin.scaffold.getCurrentModel().get('_id')
      }, function(error, collection) {
        if(error) {
          console.error(error);
          return _renderDelegate();
        }
        if(collection.length === 0) {
          return _renderDelegate();
        }
        _renderDelegate(collection.at(0).get('_assetId'));
      });
      // we do a first pass render here to satisfy code expecting us to return 'this'
      this.setValue(this.value);
      this.toggleFieldAvailibility();
      this.$el.html(template(templateData));
      return this;
    },

    getValue: function() {
      return this.value || '';
    },

    setValue: function(value) {
      this.value = value;
    },

    focus: function() {
      if (this.hasFocus) return;
      /**
      * makes input the `document.activeElement`, triggering this editor's
      * focus` event, and setting `this.hasFocus` to `true`.
      * See this.events above for more detail
      */
      this.$('input').focus();
    },

    blur: function() {
      if(this.hasFocus) this.$('input').blur();
    },

    toggleFieldAvailibility: function() {
      this.$('input').attr('disabled', this.getValue().length === 0);
    },

    checkValueHasChanged: function() {
      if ('heroImage' === this.key) {
        this.saveModel({ heroImage: this.getValue() });
        return;
      }
      var contentTypeId = Origin.scaffold.getCurrentModel().get('_id');
      var contentType = Origin.scaffold.getCurrentModel().get('_type');
      var fieldname = this.getValue() ? this.getValue().replace('course/assets/', '') : '';
      this.removeCourseAsset(contentTypeId, contentType, fieldname);
    },

    onExternalAssetButtonClicked: function(event) {
      event.preventDefault();
      this.$('.scaffold-asset-external-input').removeClass('display-none');
      this.$('.scaffold-asset-buttons').addClass('display-none');
    },

    onExternalAssetSaveClicked: function(event) {
      event.preventDefault();
      var inputValue = this.$('.scaffold-asset-external-input-field').val();

      if (inputValue.length === 0) { // nothing to save
        this.$('.scaffold-asset-external-input').addClass('display-none');
        this.$('.scaffold-asset-buttons').removeClass('display-none');
        return;
      }
      this.value = inputValue;
      this.saveModel();
    },

    onExternalAssetCancelClicked: function(event) {
      event.preventDefault();
      this.$('.scaffold-asset-external-input').addClass('display-none');
      this.$('.scaffold-asset-buttons').removeClass('display-none');
    },

    onAssetButtonClicked: function(event) {
      event.preventDefault();
      Origin.trigger('modal:open', AssetManagementModalView, {
        collection: new AssetCollection,
        assetType: this.schema.fieldType,
        onUpdate: function(data) {
          if (!data) {
            return;
          }
          if ('heroImage' === this.key) {
            this.setValue(data.assetId);
            this.saveModel({ heroImage: data.assetId });
            return;
          }
          // Setup courseasset
          var contentTypeId = Origin.scaffold.getCurrentModel().get('_id') || '';
          var contentType = Origin.scaffold.getCurrentModel().get('_type');
          var contentTypeParentId = Origin.scaffold.getCurrentModel().get('_parentId') || Origin.editor.data.course.get('_id');
          var fieldname = data.assetFilename;
          var assetId = data.assetId;
          var courseAssetObject = {
            contentTypeId: contentTypeId,
            contentType: contentType,
            contentTypeParentId: contentTypeParentId,
            fieldname: fieldname,
            assetId: assetId
          };
          // If the data is meant to autofill the rest of the graphic sizes
          // pass out an event instead - this is currently only used for the graphic component
          if (data._shouldAutofill) {
            Origin.trigger('scaffold:assets:autofill', courseAssetObject, data.assetLink);
            return;
          }
          this.value = data.assetLink;
          this.createCourseAsset(courseAssetObject);
        },
        onCancel: function(data) { }
      }, this);
    },

    onClearButtonClicked: function(event) {
      event.preventDefault();
      this.checkValueHasChanged();
      this.setValue('');
      this.toggleFieldAvailibility();
    },

    onExternalClearButtonClicked: function(event) {
      event.preventDefault();
      this.setValue('');
      this.saveModel();
      this.toggleFieldAvailibility();
    },

    fetchCourseAsset: function(searchCriteria, cb) {
      if(!searchCriteria._contentTypeId) {
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

    createCourseAsset: function(courseAssetObject) {
      (new CourseAssetModel()).save({
        _courseId : Origin.editor.data.course.get('_id'),
        _contentType : courseAssetObject.contentType,
        _contentTypeId : courseAssetObject.contentTypeId,
        _fieldName : courseAssetObject.fieldname,
        _assetId : courseAssetObject.assetId,
        _contentTypeParentId: courseAssetObject.contentTypeParentId
      }, {
        success: _.bind(function() {
          this.saveModel();
        }, this),
        error: function(error) {
          Origin.Notify.alert({
            type: 'error',
            text: Origin.l10n.t('app.errorsaveasset')
          });
        }
      });
    },

    removeCourseAsset: function(contentTypeId, contentType, fieldname) {
      this.fetchCourseAsset({
        _contentTypeId: contentTypeId,
        _contentType: contentType,
        _fieldName: fieldname
      }, _.bind(function(error, courseassets) {
        if(error) {
          return console.error(error);
        }
        if(courseassets.length === 0) {
          this.setValue('');
          this.saveModel();
          return;
        }
        // courseassets.destroy({
        //   success: _.bind(function(success) {
        //     this.saveModel();
        //   }, this),
        //   error: function(error) {
        //     console.error('Failed to destroy courseasset record', courseasset.get('_id'));
        //   }
        // });
      }, this));
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
        currentModel.unset('tags');
      }
      currentModel.save(attributesToSave, {
        patch: attributesToSave !== undefined,
        success: _.bind(function() {
          this.render();
          this.trigger('change', this);
        }, this),
        error: function() {
          Origin.Notify.alert({
            type: 'error',
            text: Origin.l10n.t('app.errorsaveasset')
          });
        }
      });
    }
  }, {
    template: "scaffoldAsset"
  });

  Origin.on('origin:dataReady', function() {
    // Add Image editor to the list of editors
    Origin.scaffold.addCustomField('Asset:image', ScaffoldAssetView);
    Origin.scaffold.addCustomField('Asset:audio', ScaffoldAssetView);
    Origin.scaffold.addCustomField('Asset:video', ScaffoldAssetView);
    Origin.scaffold.addCustomField('Asset:other', ScaffoldAssetView);
    Origin.scaffold.addCustomField('Asset', ScaffoldAssetView);
  });

  return ScaffoldAssetView;
});
