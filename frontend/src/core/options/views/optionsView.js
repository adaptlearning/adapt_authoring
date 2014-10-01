define(function(require) {

	var Origin = require('coreJS/app/origin');
	var Backbone = require('backbone');

	var OptionsView = Backbone.View.extend({

		className: 'options',

		initialize: function() {
			this.listenTo(Origin, 'remove:views', this.remove);
			this.render();
		},

		events: {
			'click a': 'onOptionClicked'
		},

		render: function() {
		    var template = Handlebars.templates[this.constructor.template];
		    this.$el.html(template());
		    _.defer(_.bind(function() {
		    	this.postRender();
		    }, this));
		    return this;
		},

		postRender: function() {
			// First sort out the groups
			this.sortAndRenderGroups();
			// Add a defer to make sure the groups are rendered
			_.defer(_.bind(this.renderOptions, this));
		},

		sortAndRenderGroups: function() {
			// Find all possible groups
			var groups = this.collection.pluck('group');
			var availableGroups = _.uniq(groups);

			var template = Handlebars.templates['optionsGroup'];

			_.each(availableGroups, function(group) {
				this.$('.options-inner').append(template({group:group}));
			});
			
		},

		renderOptions: function() {

			var template = Handlebars.templates['optionsItem'];

			// Go through each item and check if it has a group
			// If it does - render into that group
			this.collection.each(function(item) {
				
				var itemGroup = item.get('group')
				var $parent = this.$('.options-inner');
				var data = item.toJSON();

				if (itemGroup) {
					$parent = this.$('.options-group-' + itemGroup);
				}
				$parent.append(template(data));

			}, this);

		},

		onOptionClicked: function(event) {
			event.preventDefault();

			var $selectedOption = $(event.currentTarget);
			var group = $selectedOption.attr('data-group');
			var callbackEvent = $selectedOption.attr('data-callback');

			// If this item is in a group toggle all group items to not selected
			if (group && !$selectedOption.hasClass('selected')) {

				this.$('.options-group-' + group + ' a').removeClass('selected');
				$selectedOption.addClass('selected');
				Origin.trigger(callbackEvent);
				
			} else {
			// How should we handle items not in groups? Should they be toggles?	
			}

		}

	}, {
		template: 'options'
	});

	return OptionsView;

});