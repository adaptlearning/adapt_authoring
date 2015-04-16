// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

    var Backbone = require('backbone');
    var BackboneForms = require('backboneForms');
    var Origin = require('coreJS/app/origin');
    var AssetManagementModalView = require('coreJS/assetManagement/views/assetManagementModalView');
    var AssetCollection = require('coreJS/assetManagement/collections/assetCollection');
    var EditorCourseAssetModel = require('editorCourse/models/editorCourseAssetModel');

    var ScaffoldAssetView = Backbone.Form.editors.Base.extend({

        tagName: 'div',

        events: {
            'change input': function() {
                // The 'change' event should be triggered whenever something happens
                // that affects the result of `this.getValue()`.
                this.toggleFieldAvailibility();
                //this.checkValueHasChanged();
                this.trigger('change', this);
            },
            'focus input': function() {
                // The 'focus' event should be triggered whenever an input within
                // this editor becomes the `document.activeElement`.
                this.trigger('focus', this);
                // This call automatically sets `this.hasFocus` to `true`.
            },
            'blur input': function() {
                // The 'blur' event should be triggered whenever an input within
                // this editor stops being the `document.activeElement`.
                this.trigger('blur', this);
                // This call automatically sets `this.hasFocus` to `false`.
            },
            'click .scaffold-asset-picker': 'onAssetButtonClicked',
            'click .scaffold-asset-clear': 'onClearButtonClicked'

        },

        initialize: function(options) {
            // Call parent constructor
            Backbone.Form.editors.Base.prototype.initialize.call(this, options);
            
        },

        render: function() {
            this.$el.append(Handlebars.templates[this.constructor.template]());
            this.setValue(this.value);
            // Should see if the field contains anything on render
            // if so disable it
            this.toggleFieldAvailibility();

            return this;
        },

        getValue: function() {
            return this.$('input').val();
        },

        setValue: function(value) {
            this.$('input').val(value);
        },

        focus: function() {
            if (this.hasFocus) return;

            // This method call should result in an input within this edior
            // becoming the `document.activeElement`.
            // This, in turn, should result in this editor's `focus` event
            // being triggered, setting `this.hasFocus` to `true`.
            // See above for more detail.
            this.$('input').focus();
        },

        blur: function() {
            if (!this.hasFocus) return;

            this.$('input').blur();
        },

        toggleFieldAvailibility: function() {
            if (this.getValue().length === 0) {
                this.$('input').attr('disabled', false);
                this.$('.scaffold-asset-clear').addClass('display-none');
            } else {
                this.$('.scaffold-asset-clear').removeClass('display-none');
                this.$('input').attr('disabled', true);
            }
        },

        checkValueHasChanged: function() {
            var contentTypeId = Origin.scaffold.getCurrentModel().get('_id');
            var contentType = Origin.scaffold.getCurrentModel().get('_type');
            var fieldname = (this.value) ? this.value.replace('course/assets/', '') : '';
            this.removeCourseAsset(contentTypeId, contentType, fieldname);
            this.value = this.getValue();
        },

        onAssetButtonClicked: function(event) {
            event.preventDefault();
            Origin.trigger('modal:open', AssetManagementModalView, {
                collection: new AssetCollection,
                assetType: this.schema.fieldType,
                onUpdate: function(data) {
                    if (data) {

                        if ('heroImage' === this.key){
                            this.setValue(data.assetId);
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
                        }



                        this.createCourseAsset(courseAssetObject, function() {
                                this.setValue(data.assetLink);
                            this.toggleFieldAvailibility();
                        }, this);

                    }
                },
                onCancel: function(data) {
                    console.log('cancelled', data);
                }
            }, this);
        },

        onClearButtonClicked: function(event) {
            event.preventDefault();
            this.setValue('');
            this.toggleFieldAvailibility();
            this.checkValueHasChanged();
        },

        findAsset: function (contentTypeId, contentType, fieldname) {
            var asset = Origin.editor.data.courseAssets.findWhere({
                _contentTypeId: contentTypeId,
                _contentType: contentType,
                _fieldName: fieldname
            });
            return asset ? asset : false;
        },

        createCourseAsset: function (courseAssetObject, callback, context) {

            var courseAsset = new EditorCourseAssetModel();
            courseAsset.save({
                _courseId : Origin.editor.data.course.get('_id'),
                _contentType : courseAssetObject.contentType,
                _contentTypeId : courseAssetObject.contentTypeId,
                _fieldName : courseAssetObject.fieldname,
                _assetId : courseAssetObject.assetId,
                _contentTypeParentId: courseAssetObject.contentTypeParentId
            },{
                error: function(error) {
                    alert('An error occurred doing the save');
                }, 
                success: function() {
                    Origin.editor.data.courseAssets.fetch({
                        reset:true, 
                        success: function() {
                            callback.apply(context);
                        }
                    });
                }
            });
            
        },

        removeCourseAsset: function (contentTypeId, contentType, fieldname) {
            var courseAsset = this.findAsset(contentTypeId, contentType, fieldname);
            if (courseAsset) {
                courseAsset.destroy({
                    success: function(success) {
                        Origin.editor.data.courseAssets.fetch({reset:true});
                    },
                    error: function(error) {
                        console.log('error', error);
                    }
                });
            }
        }
    }, {
        template: "scaffoldAsset"
    });

    Origin.on('app:dataReady', function() {
        // Add Image editor to the list of editors
        Origin.scaffold.addCustomField('Asset:image', ScaffoldAssetView);
        Origin.scaffold.addCustomField('Asset:audio', ScaffoldAssetView);
        Origin.scaffold.addCustomField('Asset:video', ScaffoldAssetView);
        Origin.scaffold.addCustomField('Asset:other', ScaffoldAssetView);
    })
    

    return ScaffoldAssetView;

})