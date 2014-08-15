/*
* Takes provided URL passed as argument and make screenshots of this page with several viewport sizes.
* These viewport sizes are arbitrary, taken from iPhone & iPad specs, modify the array as needed
*
* Usage:
* $ casperjs screenshots.js http://example.com
*/

var casper = require("casper").create();
var filepath;
var smallScreen;
var mediumScreen;
var largeScreen;
var screenshotUrl = 'http://google.com/';

if (casper.cli.args.length < 1) {
  casper
    .echo("Usage: $ casperjs screenshots.js http://example.com")
    .exit(1)
  ;
} else {
  screenshotUrl = casper.cli.args[0];
  filepath = casper.cli.args[1];
  smallScreen = casper.cli.args[2];
  mediumScreen = casper.cli.args[3];
  largeScreen = casper.cli.args[4];
}

var viewports = [
      {
        'name': 'small',
        'viewport': {width: 200, height: 222}
      },
      {
        'name': 'medium',
        'viewport': {width: mediumScreen, height: mediumScreen/1.25}
      },
      {
        'name': 'large',
        'viewport': {width: largeScreen, height: largeScreen/1.25}
      }
    ];

casper.start(screenshotUrl, function() {
  this.echo('Current location is ' + this.getCurrentUrl(), 'info');
}).zoom(0.4);

casper.each(viewports, function(casper, viewport) {
  this.then(function() {
    this.viewport(viewport.viewport.width, viewport.viewport.height);
  });
  this.thenOpen(screenshotUrl, function() {
    this.wait(5000);
  });
  this.then(function() {
    this.echo('Screenshot for ' + viewport.name, 'info');
    var l = 0;
    var w = 300;
    if (viewport.name == 'large') {
      l = 315;
    }
    if (viewport.name == 'medium') {
      l = 220;
    }
    if (viewport.name == 'small') {
      w = 200;
    }
    this.capture("../../../" + filepath + viewport.name + '.png', {
      top: 0,
      left: l,
      width: w,
      height: 222
    });
  });
});

casper.run();

function pad(number) {
  var r = String(number);
  if ( r.length === 1 ) {
    r = '0' + r;
  }
  return r;
}
