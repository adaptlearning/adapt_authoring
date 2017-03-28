# Permissions

This module uses the users permissions statements to lock down the front-end views. This module can be accessed in three ways:

- Through the router
- Through the Origin.permissions object
- Through a Handlebars template helper

This module also takes into consideration the wild card statements ``"urn:x-adapt:{{tenantid}}/*"`` and ``"urn:x-adapt:*/*"``

## API

##### - Origin.permissions.addRoute(route, permissions)

This method adds a route to the permissions object that is checked when the Backbone Router tries to navigate. The route argument should be in the following format:

If the hash url is ``#/userManagement`` then the route should be ``"userManagement"``

The permissions argument is an array of permissions the user has to meet before being allowed to access this view. The permissions argument should be in the following format:

If the permission statement is ``"urn:x-adapt:{{tenantid}}/api/extensiontype/*"`` with a delete request then the permission array item should be ``"{{tenantid}}/extensiontype/*:delete"``

Permissions for views should be added on two events, ``'app:dataReady login:changed'`` due to the way the user can log out and log back in with different permissions:

```
Origin.on('app:dataReady login:changed', function() {

	var permissions = ["{{tenantid}}/extensiontype/*:update"];
	// This locks down the route #/pluginManagement to users who have the
	// permissions "urn:x-adapt:{{tenantid}}/api/extensiontype/*" and 
	// a request of "update"
	Origin.permissions.addRoute('pluginManagement', permissions);

});
```

##### - Origin.permissions.hasPermissions(permissionsArray)

This method checks against the permissionsArray object and the current users permissions to make sure the users permissions match all the permissions being passed in. This is mainly used to hide UI elements like the GlobalMenu items.

The permissions array format is the same as the permissions array passed in ``Origin.permissions.addRoute`` method.

```
Origin.on('app:dataReady login:changed', function() {

	var permissions = ["{{tenantid}}/extensiontype/*:update"];
	// Only add the global menu item if the user has the correct permissions
	if (Origin.permissions.hasPermissions(permissions)) {
		Origin.globalMenu.addItem(globalMenuObject);
	}

});
```

##### - Origin.permissions.checkRoute(route)

Used by the router to check the user has the correct permissions

##### - {{#ifHasPermissions "permissions"}} (Handlebars helper)

This helper can be used within views to hide certain UI elements like 'edit' or 'delete' buttons. This is like the default Handlebars #if helper and can be used with a ``{{else}}``. The permissions should be separated by a comma:

```
{{#ifHasPermissions "{{tenantid}}/extensiontype/*:delete, {{tenantid}}/componenttype/*:delete"}}
<button class="delete-button">
	Delete
</button>
{{else}}
<button class="view-button">
	View
</button>
{{/ifHasPermissions}}
```