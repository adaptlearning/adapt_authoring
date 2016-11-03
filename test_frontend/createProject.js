// createProject.js
var loginModule = require("./login");
//creates a new project
casper.test.begin('Create Course', 4, function suite(test) {
    loginModule.login();
    casper.then(function() {
	    this.wait(500, function() {});
	    casper.test.comment("Creating the course");
    });

    //checks that the add course button exists, then clicks it
    casper.then(function() {
        test.assertExists("button[class='dashboard-sidebar-add-course action-primary']", "Add new course button exists");
        this.wait(1000, function() {
          this.capture("./test_frontend/img/create/01-on home page.png");
        });
    });
    casper.then(function() {
        this.click("button[class='dashboard-sidebar-add-course action-primary']");
    });

    casper.then(function() {
        test.assertExists(".course-edit-inner", "Found the add project page");
        this.wait(1000, function() {
        	this.capture("./test_frontend/img/create/02-create project page.png");
        });
    });

    //fills in the form with valid information and submits it
  casper.then(function() {
        this.fill("form", {
	    'title' : config.createCourseName,
		});});

    casper.then(function() {
        this.wait(1000, function() {
        	this.capture("./test_frontend/img/create/04-values filled in.png");
        });
    });
    casper.then(function() {
        this.click(".editor-project-edit-sidebar-save-inner");
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
