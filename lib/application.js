/**
 * Module depencies
 */

var express = require('express');

 /**
  * Module exports
  */

  exports = module.exports = createApp;

  /**
   * Creates the core application
   *
   * @return (Function)
   * @api public
   */

   function createApp() {
       var app = express();
       console.log('App starting to listen on port 3000!'); // @TODO remove this line
       app.listen(3000); // @TODO configure this port away
       return app;
   }
