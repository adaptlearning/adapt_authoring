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
    masterTenantId = configuration.getConfig('masterTenantID'),
    previewKey = tenantId + '-' + courseId,
    root = path.join(configuration.serverRoot, Constants.Folders.Temp, masterTenantId, Constants.Folders.Framework, Constants.Folders.AllCourses, tenantId, courseId, Constants.Folders.Build);

  if (!user) {
    logger.log('warn', 'Preview: Unauthorised attempt to view course %s on tenant %s', courseId, tenantId);

    return next(new PreviewPermissionError());
  }

  var options = {
    root: root
  };

  if (file == Constants.Filenames.Main) {
    // Verify the session is configured to hold the course previews accessible for this user.
    if (!req.session.previews || Array.isArray(req.session.previews)) {
      req.session.previews = [];
    }

    // Compare the tenantId values
    if (tenantId !== user.tenant._id.toString() && tenantId !== masterTenantId) {
      logger.log('warn', 'Preview: User %s does not have permission to view course %s on tenant %s', user._id, courseId, tenantId);

      return next(new PreviewPermissionError());
    }

    if (tenantId == masterTenantId) {
      // Viewing a preview on master courses, so check that the course is shared
      // Store in the session that the user has access to this course.
      helpers.isMasterPreviewAccessible(courseId, user._id, function(err, hasPermission) {
        if (err) {
          logger.log('error', err);

          return next(new PreviewPermissionError());
        }

        if (!hasPermission) {
          // Remove this course from the cached sessions.
          var position = req.session.previews.indexOf(previewKey);

          if (position > -1) {
            req.session.previews.splice(position, 1);
          }

          logger.log('warn', 'Preview: User %s does not have permission to view course %s on tenant %s', user._id, courseId, tenantId);

          return next(new PreviewPermissionError());
        } else {
          req.session.previews.push(previewKey);

          res.sendFile(file, options, function(err) {
            if (err) {
              // Display the error to the user.
              return res.status(err.status || 500).end();
            }
          });
        }
      });
    } else {
      // When requesting the first page, check the user has access to this course.
      helpers.hasCoursePermission('*', user._id, tenantId, {_id: courseId}, function(err, hasPermission) {
        if (err) {
          logger.log('error', err);

          return next(new PreviewPermissionError());
        }

        if (!hasPermission) {
          // Remove this course from the cached sessions.
          var position = req.session.previews.indexOf(previewKey);

          if (position > -1) {
            req.session.previews.splice(position, 1);
          }

          logger.log('warn', 'Preview: User %s does not have permission to view course %s on tenant %s', user._id, courseId, tenantId);

          return next(new PreviewPermissionError());
        }

        // Store in the session that the user has access to this course.
        req.session.previews.push(previewKey);

        res.sendFile(file, options, function(err) {
          if (err) {
            // Display the error to the user.
            return res.status(err.status || 500).end();
          }
        });
      });
    }
  } else {
    // Verify that the user has appropriate access to the requested file.
    if (req.session.previews && req.session.previews.indexOf(previewKey) > -1) {
      res.sendFile(file, options, function(err) {
        if (err) {
          // Display the error to the user.
          // We don't want to clog the log with 404s, etc.
          return res.status(err.status || 500).end();
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
