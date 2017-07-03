// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

    var Backbone = require('backbone');
    var BackboneForms = require('backbone-forms');
    var Origin = require('core/origin');

    var ScaffoldBooleanView = Backbone.Form.editors.Select.extend({

        getValue: function() {
            if (this.$el.val() === 'true' || this.$el.val() === 'True') {
                return true;
            } else {
                return false;
            }
        },

        setValue: function(value) {
            if ((typeof value == 'undefined' || value == null) && typeof this.schema.default !== 'undefined') {
                value = this.schema.default;
            }
            this.$('option[value="' + value + '"]').attr("selected", "selected");
        },

        _arrayToHtml: function(array) {
            var html = $();

            //Generate HTML
            _.each(array, function(option) {
                if (_.isObject(option)) {
                    if (option.group) {
                        var optgroup = $("<optgroup>")
                            .attr("label",option.group)
                            .html( this._getOptionsHtml(option.options) );
                        html = html.add(optgroup);
                    } else {
                        var val = (option.val || option.val === 0) ? option.val : '';
                        html = html.add( $('<option value=' + val + '>').val(val).text(option.label) );
                    }
                } else {
                    html = html.add( $('<option value=' + option + '>').text(option) );
                }
            }, this);

            return html;
        }

    });

    Origin.on('origin:dataReady', function() {
        // Add Image editor to the list of editors
        Origin.scaffold.addCustomField('Boolean', ScaffoldBooleanView)  
    })
    

    return ScaffoldBooleanView;

})