// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');

  var ConfigModel = require('core/models/configModel');
  var ContentObjectModel = require('core/models/contentObjectModel');
  var ArticleModel = require('core/models/articleModel');
  var BlockModel = require('core/models/blockModel');
  var ComponentModel = require('core/models/componentModel');
  var ComponentTypeModel = require('core/models/componentTypeModel');
  var EditorOriginView = require('../../global/views/editorOriginView');
  var EditorCollection = require('../../global/collections/editorCollection');

  var EditorCourseEditView = EditorOriginView.extend({
    className: "course-edit",
    tagName: "div",

    preRender: function() {
      this.listenTo(Origin, 'projectEditSidebar:views:save', this.save);

      if (this.model.isNew()) {
        this.isNew = true;
        this.$el.addClass('project-detail-hide-hero');
        // Initialise the 'tags' property for a new course
        this.model.set('tags', []);
      } else {
        // Ensure that the latest config model is always up-to-date when entering this screen
        Origin.editor.data.config = new ConfigModel({_courseId: this.model.get('_id')});
      }
      // This next line is important for a proper PATCH request on saveProject()
      this.originalAttributes = _.clone(this.model.attributes);
    },

    getAttributesToSave: function() {
      // set tags
      var tags = [];
      _.each(this.model.get('tags'), function(item) {
        item._id && tags.push(item._id);
      });
      this.model.set('tags', tags);

      var changedAttributes = this.model.changedAttributes(this.originalAttributes);
      if(changedAttributes) {
        return _.pick(this.model.attributes, _.keys(changedAttributes));
      }

      return null;
    },

    onSaveSuccess: function(model, response, options) {
      if (this.isNew) {
        this.populateNewCourse(model, response, options);
      } else {
        EditorOriginView.prototype.onSaveSuccess.apply(this, arguments);
      }
    },

    // TODO not really  good enough to handle model save errors and other errors here
    onSaveError: function(model, response, options) {
      if(arguments.length == 2) {
        return EditorOriginView.prototype.onSaveError.apply(this, arguments);
      }

      var messageText = typeof response.responseJSON == 'object' && response.responseJSON.message;
      EditorOriginView.prototype.onSaveError.call(this, null, messageText);
    },

    /**
     * When a new course is created it gets populated with a page, article, block and blank component
     * so that it can be previewed immediately.
     * @param model
     * @param response
     * @param options
     */
    populateNewCourse: function(model, response, options) {
      var self = this;

      var contentObjectModel = new ContentObjectModel();
      contentObjectModel.save({
        title: 'Page Title',
        displayTitle: 'Page Title',
        _type: 'page',
        _courseId: model.get('_id'),
        _parentId: model.get('_id')
      },{
        error: _.bind(this.onSaveError, self),
        success: function() {
          var articleModel = new ArticleModel();
          articleModel.save({
            _courseId: model.get('_id'),
            _parentId: contentObjectModel.get('_id'),
            _type: 'article'
          }, {
            error: _.bind(self.onSaveError, self),
            success: function() {
              var blockModel = new BlockModel();
              blockModel.save({
                _courseId: model.get('_id'),
                _parentId: articleModel.get('_id'),
                _type: 'block',
                layoutOptions: [
                  {type: 'left', name: 'app.layoutleft', pasteZoneRenderOrder: 2},
                  {type: 'full', name: 'app.layoutfull', pasteZoneRenderOrder: 1},
                  {type: 'right', name: 'app.layoutright', pasteZoneRenderOrder: 3}
                ]
              }, {
                error: _.bind(self.onSaveError, self),
                success: function() {
                  // Store the component types
                  var componentTypes = new EditorCollection(null, {
                    model: ComponentTypeModel,
                    url: '/api/componenttype',
                    _type: 'componentTypes'
                  });

                  componentTypes.fetch({
                    error: _.bind(self.onSaveError, self),
                    success: function() {
                      var componentModel = new ComponentModel();
                      componentModel.save({
                        _courseId: model.get('_id'),
                        _parentId: blockModel.get('_id'),
                        body: Origin.l10n.t('app.projectcontentbody'),
                        _type: 'component',
                        _component: 'text',
                        _componentType: componentTypes.findWhere({component: 'text'}).attributes._id,
                        _layout: 'full'
                      }, {
                        error: _.bind(self.onSaveError, self),
                        success: function() {
                          Origin.router.navigate('#/editor/' + response._id + '/menu', {trigger: true});
                        }
                      });
                    }
                  });
                }
              })
            }
          })
        }
      });
    }

  }, {
    template: 'editorCourseEdit'
  });

  return EditorCourseEditView;
});
