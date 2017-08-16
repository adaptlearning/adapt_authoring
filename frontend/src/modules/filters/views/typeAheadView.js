// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

	var Origin = require('core/origin');
	var Typeahead = require('typeahead');

	var TypeAheadView = Backbone.View.extend({

		className: 'filters-typeahead',

		initialize: function(options) {
			this.options = options;
			this.listenTo(Origin, 'remove:views', this.removeFilter);
			this.preRender();
			this.render();
		},

		events: {
			'keyup #typeahead-input': 'onInputKeyup'
		},

		preRender: function() {},

		render: function() {

			var template = Handlebars.templates['typeAhead'];
			this.$el.html(template(this.options));

			_.defer(_.bind(function() {
				this.postRender();
			}, this));

			return this;

		},

		postRender: function() {
			var that = this;
			// Create a new suggestion engine
			var bloodHound = new Bloodhound({
				datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
  				queryTokenizer: Bloodhound.tokenizers.whitespace,
				prefetch: this.options.url
				
			});

			bloodHound.initialize();
 
 			// Add typeahead
			this.$('#typeahead-filter .typeahead').typeahead(null, {
				hint: true,
				displayKey: this.options.displayKey,
				source: bloodHound.ttAdapter()
			});

			// Left in just in case we need it
			this.$('#typeahead-filter .typeahead').on('typeahead:selected', _.bind(function(event, filterObject) {
				this.isSelected = true;
				this.onFilterUpdated(event, filterObject);
			}, this));
			this.$('#typeahead-filter .typeahead').on('typeahead:cursorchanged', _.bind(this.onFilterSearched, this));

			this.$('#typeahead-filter .typeahead').on('typeahead:autocompleted', _.bind(this.onFilterUpdated, this));

		},

		onFilterUpdated: function(event, filterObject) {
			this.filterObject = filterObject;
			Origin.trigger('filters:typeAhead', filterObject);
		},

		onFilterSearched: function(event, filterObject) {
			this.filterObject = filterObject;
		},

		removeFilter: function() {
			this.$('#typeahead-filter .typeahead').typeahead('destroy');
			this.remove();
		},

		onInputKeyup: function(event) {

			var inputValue = $(event.currentTarget).val();

			if (inputValue.length === 0) {
				Origin.trigger('filters:typeAhead', undefined);
			} else if (event.keyCode === 13) {
				if (!this.isSelected) {
					Origin.trigger('filters:typeAhead', this.filterObject);
				}
			}
			this.isSelected = false;

		}

	});

	return TypeAheadView;

});