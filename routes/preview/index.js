const express = require('express');
const path = require('path');
const util = require('util');

const configuration = require('../../lib/configuration');
const Constants = require('../../lib/outputmanager').Constants;
const helpers = require('../../lib/helpers');
const logger = require('../../lib/logger');
const usermanager = require('../../lib/usermanager');

const server = module.exports = express();

server.set('views', __dirname);
server.set('view engine', 'hbs');

function PreviewPermissionError(message, httpCode) {
  this.message = message || "Permission denied";
  this.http_code = httpCode || 401;
}
util.inherits(PreviewPermissionError, Error);

server.get('/preview/:tenant/:course/*', (req, res, next) => {
  const courseId = req.params.course;
  const tenantId = req.params.tenant;
  const user = usermanager.getCurrentUser();
  const file = req.params[0] || Constants.Filenames.Main;
  const masterTenantId = configuration.getConfig('masterTenantID');
  const previewKey = `${tenantId}-${courseId}`;

  if (!user) {
    return onAuthError();
  }
  (file === Constants.Filenames.Main) ? handleIndexFile() : handleNonIndexFile();

  function onAuthError() {
    logger.log('warn', `Preview: user '${user._id}' does not have permission to view course '${courseId}' on tenant '${tenantId}'`);
    next(new PreviewPermissionError());
  }

  function sendFile(filename) {
    res.sendFile(filename, {
      root: path.join(configuration.serverRoot, Constants.Folders.Temp, masterTenantId, Constants.Folders.Framework, Constants.Folders.AllCourses, tenantId, courseId, Constants.Folders.Build)
    }, error => {
      if(error) res.status(error.status || 500).end();
    });
  }

  function handleIndexFile() {
    // Verify the session is configured to hold the course previews accessible for this user.
    if (!req.session.previews || !Array.isArray(req.session.previews)) {
      req.session.previews = [];
    }
    if (tenantId !== user.tenant._id.toString() && tenantId !== masterTenantId) {
      return onAuthError();
    }
    helpers.hasCoursePermission('*', user._id, tenantId, { _id: courseId }, (error, hasPermission) => {
      if(error) {
        logger.log('error', error);
        next(new PreviewPermissionError());
      }
      if(!hasPermission) { // Remove this course from the cached sessions.
        const position = req.session.previews.indexOf(previewKey);
        if (position > -1) req.session.previews.splice(position, 1);
        return onAuthError();
      }
      req.session.previews.push(previewKey);
      return sendFile(file);
    });
  }

  function handleNonIndexFile() {
    // only allow if preview has been whitelisted
    if (!req.session.previews || !req.session.previews.includes(previewKey)) {
      return res.status(404).end();
    }
    sendFile(file);
  }
});
