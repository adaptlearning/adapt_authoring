// createProject.js
var loginModule = require("./login");
//creates a new project
casper.test.begin('Create Project', 5, function suite(test) {
    loginModule.login();
    casper.then(function() {
	    this.wait(500, function() {});
	    casper.test.comment("Creating the project");
    });

    //checks that the add project button exists, then clicks it
    casper.then(function() {
        test.assertExists("button[class='btn dashboard-sidebar-add-course']", "Add Project button exists");
        this.wait(1000, function() {
        	this.capture("./test_frontend/img/create/create1.png");
        });
    });
    casper.then(function() {
        this.click("button[class='btn dashboard-sidebar-add-course']");
    });


    casper.then(function() {
        test.assertExists('input[id="projectDetailTitle"]', "Found the add project page");
        this.wait(1000, function() {
        	this.capture("./test_frontend/img/create/create2.png");
        });
    });

    //testing to see if error message appears when no title is entered
    casper.then(function() {
        this.click("button[type=submit]");   
        casper.test.comment("Testing error message when no title is entered");   
    });
    casper.then(function() {
        this.test.assertSelectorHasText("#titleErrorMessage", "Please", "Error message appeared properly - no title given");    
        this.wait(1000, function() {
            this.capture("./test_frontend/img/create/create3.png");
        });
    });

    //fills in the form with valid information and submits it
    casper.then(function() {
        this.fillSelectors("form.forms", {
	    'input[id=projectDetailTitle]' : 'New Name',
	    'textarea[id=projectDetailDescription]' : 'New Description'
		});
    });
    casper.then(function() {
        this.wait(1000, function() {
        	this.capture("./test_frontend/img/create/create4.png");
        });
    });
    casper.then(function() {
        this.click("button[type=submit]");      
    });

    casper.then(function() {
        this.wait(1000, function() {
        	this.capture("./test_frontend/img/create/create5.png");
        });
    });

    casper.run(function() {
        test.done();
    }); 
});
