// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

	var Backbone = require('backbone');
	var Origin = require('coreJS/app/origin');
	var EditorOriginView = require('editorGlobal/views/editorOriginView');
	var EditorComponentModel = require('editorPage/models/editorComponentModel');
	var EditorComponentView = require('editorPage/views/editorComponentView');

	var EditorComponentListItemView = EditorOriginView.extend({

		tagName: 'div',

		className: 'editor-component-list-item',

		events: {
			'click': 'onItemClicked',
			'click div.editor-component-list-item-overlay-inner > a': 'onButtonClicked'
		},

		preRender: function(options) {
			this.listenTo(Origin, 'editorComponentListView:removeSubviews', this.remove);
			this.listenTo(Origin, 'editorComponentListItemView:deselect', this.deselectItem);
			this.listenTo(Origin, 'editorComponentListView:searchKeyup', this.onSearchValueChanged);
			this.model.set({
				'availablePositions': options.availablePositions
			});
			this._parentId = options._parentId;
			this.$parentElement = options.$parentElement;
			this.parentView = options.parentView;
			this.searchTerms = options.searchTerms;
		},

		postRender: function() {
			if (this.model.get('_isAvailableInEditor') == false) {
				this.$el.addClass('restricted');
			}

		},

		onItemClicked: function(event) {
			event.preventDefault();

			Origin.trigger('editorComponentListItemView:deselect')
			this.$el.addClass('selected');
			this.$('.editor-component-list-item-overlay')
				.removeClass('display-none');
		},

		deselectItem: function() {
			$('.editor-component-list-item').removeClass('selected');
			this.$('.editor-component-list-item-overlay')
				.addClass('display-none');
		},

		onSearchValueChanged: function(searchValue) {
			if (this.searchTerms.indexOf(searchValue.toLowerCase()) > -1 || searchValue.length === 0) {
				this.$el.removeClass('display-none');
			} else {
				this.$el.addClass('display-none');
			}
		},

		onButtonClicked: function(event) {
			event.preventDefault();

			this.addComponent(event.currentTarget.getAttribute('data-position'));
		},

		addComponent: function(layout) {

			Origin.trigger('editorComponentListView:remove');

			var componentName = this.model.get('name');

			var componentType = _.find(Origin.editor.data.componentTypes.models, function(type){
				return type.get('name') == componentName;
			});

			var newComponentModel = new EditorComponentModel({
				title: window.polyglot.t('app.placeholdernewcomponent'),
				displayTitle: window.polyglot.t('app.placeholdernewcomponent'),
				body: '',
				_parentId: this._parentId,
				_courseId: Origin.editor.data.course.get('_id'),
				_type: 'component',
				_componentType: componentType.get('_id'),
				_componentTypeDisplayName: componentType.get('displayName'),
				_component: componentType.get('component'),
				_layout: layout,
				version: componentType.get('version')
			});

			var newComponentView = new EditorComponentView({model: newComponentModel}).$el.addClass('syncing');
			this.$parentElement
        .find('.page-components')
        .append(newComponentView);

			newComponentModel.save(null, {
    		error: function() {
    			$('html').css('overflow-y', '');
					Origin.Notify.alert({
						type: 'error',
						text: window.polyglot.t('app.erroraddingcomponent')
					});
      	},
      	success: _.bind(function() {
          Origin.editor.data.components.add(newComponentModel);
          this.parentView.evaluateComponents(this.parentView.toggleAddComponentsButton);
          // Re-render the block
          this.parentView.reRender();
          newComponentView.addClass('synced');
          $('html').css('overflow-y', '');
          $.scrollTo(newComponentView.$el);
      	}, this)
      });
		}

	}, {
		template: 'editorComponentListItem'
	});

	return EditorComponentListItemView;

})
