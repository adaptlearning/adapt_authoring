define(function(require){
    var Handlebars = require('handlebars');

    var helpers = {
        lowerCase: function(text) {
            return text.toLowerCase();
        },
        numbers: function(index) {
            return index +1;
        },
        capitalise:  function(text) {
            return text.charAt(0).toUpperCase() + text.slice(1);
        },
        odd: function (index) {
            return (index +1) % 2 === 0  ? 'even' : 'odd';
        },
        formatDate: function(isoDate) {
            // 2014-02-17T17:00:34.196Z
            var date = new Date(isoDate);

            return date.toDateString();
        },
        if_value_equals: function(value, text, block) {
            if (value === text) {
                return block.fn(this);
            } else {
                return block.inverse();
            }
        },
        selected: function(option, value){
            if (option === value) {
                return ' selected';
            } else {
                return ''
            }
        },
        counterFromZero: function(n, block) {
            var sum = '';
            for (var i = 0; i <= n; ++i)
                sum += block.fn(i);
            return sum;
        },
        counterFromOne: function(n, block) {
            var sum = '';
            for (var i = 1; i <= n; ++i)
                sum += block.fn(i);
            return sum;
        },
        t: function(str, options) {
            for (var placeholder in options.hash) {
              options[placeholder] = options.hash[placeholder];
            }
            return (window.polyglot != undefined ? window.polyglot.t(str, options) : str);
        },
        stripHtml: function(html) {
            return new Handlebars.SafeString(html);
        },
        bytesToSize: function(bytes) {
            if (bytes == 0) return '0 B';

            var k = 1000,
             sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
             i = Math.floor(Math.log(bytes) / Math.log(k));

            return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
        }
    };

    for(var name in helpers) {
       if(helpers.hasOwnProperty(name)) {
             Handlebars.registerHelper(name, helpers[name]);
        }
    }

    return helpers;
});