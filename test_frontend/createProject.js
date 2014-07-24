// createProject.js
var loginModule = require("./login");
//creates a new project
casper.test.begin('Create Course', 5, function suite(test) {
    loginModule.login();
    casper.then(function() {
	    this.wait(500, function() {});
	    casper.test.comment("Creating the course");
    });

    //checks that the add course button exists, then clicks it
    casper.then(function() {
        test.assertExists("button[class='btn dashboard-sidebar-add-course']", "Add new course button exists");
        this.wait(1000, function() {
        	this.capture("./test_frontend/img/create/01-on home page.png");
        });
    });
    casper.then(function() {
        this.click("button[class='btn dashboard-sidebar-add-course']");
    });


    casper.then(function() {
        test.assertExists('input[id="projectDetailTitle"]', "Found the add project page");
        this.wait(1000, function() {
        	this.capture("./test_frontend/img/create/02-create project page.png");
        });
    });

    //testing to see if error message appears when no title is entered
    casper.then(function() {
        this.click(".editor-project-edit-sidebar-save");   
        casper.test.comment("Testing error message when no title is entered");   
    });
    casper.then(function() {
        this.test.assertEval(function() {
            return __utils__.findOne('#titleErrorMessage').textContent !== '';
        }, "Error message appeared properly - no title given");
        //this.test.assertSelectorHasText("#titleErrorMessage", "Please", "Error message appeared properly - no title given");    
        this.wait(1000, function() {
            this.capture("./test_frontend/img/create/03-error report working.png");
        });
    });

    //fills in the form with valid information and submits it
    casper.then(function() {
        this.fillSelectors("form.forms", {
	    'input[id=projectDetailTitle]' : config.createCourseName,
	    'textarea[id=projectDetailDescription]' : config.createCourseDescription
		});
    });
    casper.then(function() {
        this.wait(1000, function() {
        	this.capture("./test_frontend/img/create/04-values filled in.png");
        });
    });
    casper.then(function() {
        this.click(".editor-project-edit-sidebar-save");      
    });

    casper.then(function() {
        this.wait(1000, function() {
        	this.capture("./test_frontend/img/create/05-project was created.png");
        });
    });

    casper.run(function() {
        test.done();
    }); 
});
