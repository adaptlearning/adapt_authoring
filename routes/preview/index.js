var express = require('express');
var path = require('path');
var fs = require('fs');
var server = module.exports = express();
var configuration = require('../../lib/configuration');
var Constants = require('../../lib/outputmanager').Constants;
var usermanager = require('../../lib/usermanager');
var helpers = require('../../lib/helpers');
var logger = require('../../lib/logger');
var methodOverride = require('method-override');
var util = require('util');

server.use(methodOverride());
server.set('views', __dirname);
server.set('view engine', 'hbs');

function PreviewPermissionError(message, httpCode) {
  this.message = message || "Permission denied";
  this.http_code = httpCode || 401;
}

util.inherits(PreviewPermissionError, Error);

server.get('/preview/:tenant/:course/*', function (req, res, next) {
  var courseId = req.params.course,
    tenantId = req.params.tenant,
    user = usermanager.getCurrentUser(),
    file = req.params[0] || Constants.Filenames.Main,
    root = path.join(configuration.serverRoot, Constants.Folders.Temp, configuration.getConfig('masterTenantID'), Constants.Folders.Framework, Constants.Folders.AllCourses, tenantId, courseId, Constants.Folders.Build);
    
  if (!user) {
    logger.log('warn', 'Preview: Unauthorised attempt to view course %s on tenant %s', courseId, tenantId);
    
    return next(new PreviewPermissionError());
  }
  
  var options = {
    root: root
  };
  
  if (file == Constants.Filenames.Main) {
    // Compare the tenantId values
    if (tenantId !== user.tenant._id.toString()) {
      logger.log('warn', 'Preview: User %s does not have permission to view course %s on tenant %s', user._id, courseId, tenantId);
      
      return next(new PreviewPermissionError());
    }    

    // When requesting the first page, check the user has access to this course.
    helpers.hasCoursePermission('*', user._id, tenantId, {_id: courseId}, function(err, hasPermission) {
      if (err) {
        logger.log('error', err);
        
        return next(new PreviewPermissionError());
      }
      
      // Verify the session is configured to hold the course previews accessible for this user.
      if (!req.session.previews || Array.isArray(req.session.previews)) {
        req.session.previews = [];
      }
      
      if (!hasPermission) {
        // Remove this course from the cached sessions.
        var position = req.session.previews.indexOf(courseId);
        
        if (position > -1) {
          req.session.previews.splice(position, 1);  
        }
        
        logger.log('warn', 'Preview: User %s does not have permission to view course %s on tenant %s', user._id, courseId, tenantId);

        return next(new PreviewPermissionError());
      }
      
      // Store in the session that the user has access to this course.
      req.session.previews.push(courseId);
      
      res.sendFile(file, options, function(err) {
        if (err) {
          // Display the error to the user.
          res.status(err.status).end();
        }
      });
    });
  } else {
    // Verify that the user has appropriate access to the requested file.
    if (req.session.previews && req.session.previews.indexOf(courseId) > -1) {
      res.sendFile(file, options, function(err) {
        if (err) {
          // Display the error to the user.
          // We don't want to clog the log with 404s, etc.
          res.status(err.status).end();
        }
      });
    } else {
      return res.status(404).end();
    }
  }
});

function errorHandler(err, req, res, next) {
  var httpCode = err.http_code || 500;
  res.status(httpCode);
  res.render('error', {http_code: httpCode, error: err});
}

server.use(errorHandler);