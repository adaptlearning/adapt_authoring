// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

	var Handlebars = require('handlebars');
	var Origin = require('coreJS/app/origin');
	var operations = ["create", "read", "update", "delete"];
	var separators = ["/", ":"];
	var PermissionsView = require('coreJS/app/views/permissionsView');

	var routes = [];

	var Permissions = {
		// This method should return true or false
		// based upon if the user has the correct permissions
		hasPermissions: function(permissionsArray) {
			// First check for any wildcards '*'
			var sessionModelPermissions = Origin.sessionModel.get('permissions');
			var hasWildCard = false;
			var tenantWildCards = [];

			_.each(sessionModelPermissions, function(permission) {
				// Find out if the first character is a wild card
				if (permission.charAt(0) === '*') {
					return hasWildCard = true;
				}

				// Find out if theres any {{tenantid}}/*
				var splitPermission = splitString(permission)
				
				if (splitPermission[1].charAt(0) === '*') {
					var tenantWildCard = splitPermission[splitPermission.length - 1];
					tenantWildCards.push(tenantWildCard);
				}
				

			});

			// If the user has the ultimate wildcard just return true
			if (hasWildCard) {
				return true;
			}

			// These are used to compare the permissions length coming in
			// and the allowed permissions
			var permissionsLength = permissionsArray.length;
			var allowedPermissionsLength = 0;
			

			_.each(permissionsArray, function(permissionItem) {
				
				var splitPermissionItem = splitString(permissionItem);
				// Check if the user has a tenantWildCard matching the operation - :create || :retrieve etc
				if (_.contains(tenantWildCards, splitPermissionItem[splitPermissionItem.length-1])) {
					allowedPermissionsLength ++;
					return;
				}

				// Check if the user has a match 
				// - this is currently a straight string comparision
				if (_.contains(sessionModelPermissions, permissionItem)) {
					allowedPermissionsLength ++;
				}

			});

			// If the all the permissions coming in match the allowed length
			// then allow this user the permission
			if (allowedPermissionsLength === permissionsLength) {
				return true;
			}

			return false;
			
		},

		hasSuperPermissions:function(){
			var sessionModelPermissions = Origin.sessionModel.get('permissions');
			var hasWildCard = false;

			_.each(sessionModelPermissions, function(permission) {
				// Find out if the first character is a wild card
				if (permission.charAt(0) === '*') {
					return hasWildCard = true;
				}
			});

			if (hasWildCard) {
				return true;
			}else{
				return false;
			}

		},

		hasTenantAdminPermission:function(){
			var sessionModelPermissions = Origin.sessionModel.get('permissions');
			var hasTenantWildCard = false;

			_.each(sessionModelPermissions, function(permission) {
				// Find out if theres any {{tenantid}}/*:delete
				var splitPermission = splitString(permission)

				if (splitPermission[1].charAt(0) === '*') {
					var permission = splitPermission[splitPermission.length - 1];
					if(permission == 'delete'){
						return hasTenantWildCard = true;
					}
				}
			});

			if (hasTenantWildCard) {
				return true;
			}else{
				return false;
			}
		},

		addRoute: function(route, permissions) {
			if (_.isString(route) && _.isArray(permissions)) {
				// Push the route and permissions to the routes array
				var routeObject = {
					route: route,
					permissions: permissions
				};

				routes.push(routeObject);

			} else {
				console.log('Please consult the documentation on adding permissions to a route');
			}
		},

		checkRoute: function(route) {
			// Find the route
			var routeObject = _.findWhere(routes, {route: route});
			// If no route is avialable the pass back true
			if (!routeObject) {
				return true;
			}

			// If there is a route - check against the users permissions
			if (this.hasPermissions(routeObject.permissions)) {
				return true;
			} else {
				return false;
			}

		},

		showNoPermissionPage: function() {
			Origin.trigger('sidebar:sidebarContainer:hide');
			Origin.trigger('location:title:hide');
			return $('.app-inner').empty().append(new PermissionsView().$el);
		}
	};

	function splitString(string) {
		return string.split(new RegExp(separators.join('|'), 'g'));
	}

	Origin.permissions = Permissions;

});