define([
    'core/origin',
], function(Origin) {
    'use strict';

    Origin.on('origin:sessionStarted login:changed', function() {
        if (!Origin.sessionModel.get('isAuthenticated')) return;
        
        var nameSpace = Origin.sessionModel.get('id');

        if (localStorage.getItem(nameSpace) === null) {
            // setup local storage
            localStorage.setItem(nameSpace, "{}");
        }

        restoreSession();
    });


    function restoreSession() {
        var data = LocalStorage.getAll();
        if (!data) return;

        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                Origin.sessionModel.set(key, data[key]);
            }
        }
    }

    var LocalStorage = {

        get: function(key) {
            var data = this.getAll();
            if (data[key]) return data[key];
            return false;
        },
        
        getAll: function() {
            var nameSpace = Origin.sessionModel.get('id');
            var data = JSON.parse(localStorage.getItem(nameSpace));
            return data;
        },

        set: function(key, value) {
            var nameSpace = Origin.sessionModel.get('id');
            var data = JSON.parse(localStorage.getItem(nameSpace)) || {};
            data[key] = value;
            localStorage.setItem(nameSpace, JSON.stringify(data));
        },

        drop: function() {
            var nameSpace = Origin.sessionModel.get('id');
            localStorage.removeItem(nameSpace);
        }

    };

    Origin.localStorage = LocalStorage

});