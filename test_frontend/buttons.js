// buttons.js
var loginModule = require("./login");
casper.test.begin('Testing the buttons on the main page', 2, function suite(test) {
    loginModule.login();

    /*
    Clicks all the buttons that rearrange the projects to ensure they work
    */
    casper.then(function() {
	    casper.test.comment("Testing the buttons");
    });

    casper.then(function() {
	    this.click(".project-layout-list");
    });

    casper.then(function() {
	    this.wait(1000, function() {
	    	this.capture("./test_frontend/img/buttons/list.png");
	    });
    });

    casper.then(function() {
	    this.click(".project-layout-grid");
    });

    casper.then(function() {
	    this.wait(1000, function() {
	    	this.capture("./test_frontend/img/buttons/grid.png");
	    });
    });

    casper.then(function() {
	    this.click(".project-sort-asc");
    });

    casper.then(function() {
	    this.wait(1000, function() {
	    	this.capture("./test_frontend/img/buttons/ascending.png");
	    });
    });

    casper.then(function() {
	    this.click(".project-sort-desc");
    });

    casper.then(function() {
	    this.wait(1000, function() {
	    	this.capture("./test_frontend/img/buttons/descending.png");
	    });
    });

    casper.run(function() {
        test.done();
    }); 	
});

