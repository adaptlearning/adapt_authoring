
// copy.js
var loginModule = require("./login");
var num;
//tests the course editor
casper.test.begin('Testing copying a course', 3, function suite(test) {
    loginModule.login();
    casper.then(function() {
	    this.wait(500, function() {});

    });

    casper.then(function() {
    	casper.test.comment("Testing copy");
    });

    casper.then(function() {
    	casper.capture("./test_frontend/img/copy/01-on home page.png");
    });

    //checks if menu exists and opens it
    casper.then(function() {
        test.assertExists("a[class='open-context-icon open-context-course']", "Edit button exists");
    });

    casper.then(function() {
        this.click("a[class='open-context-icon open-context-course']");
        casper.capture("./test_frontend/img/copy/02-submenu open.png");
        this.click('.context-menu-item:nth-child(3) > a.context-menu-item-open');
        this.wait(2000, function() {
        casper.capture("./test_frontend/img/copy/copy_page_opened.png");
      });

    });

    casper.run(function() {
        test.done();
    });
});
