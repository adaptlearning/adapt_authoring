
// edit.js
var loginModule = require("./login");
var num;
//tests the course editor
casper.test.begin('Testing editing a course', 5, function suite(test) {
    loginModule.login();

    casper.then(function() {
    	casper.capture("./test_frontend/img/editInfo/01-on main page.png");
        //returns the amount of courses, is used to decide which one to edit- the last one
    	num = this.evaluate(function() { 
    		return __utils__.findAll("li.project-list-item").length; 
    	});
    });
    //checks if menu exists and opens it
    casper.then(function() {
        test.assertExists("a[class='open-context-icon open-context-course']", "Edit button exists");
    });
    casper.then(function() {
        this.click("li.project-list-item:nth-child("+num+") > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > a:nth-child(1)");
    });

    casper.then(function() {
    	test.assertExists("div.context-menu-item:nth-child(2) > a:nth-child(1) > div:nth-child(1) > h5:nth-child(1)","Submenu is open");
    	casper.capture("./test_frontend/img/editInfo/02-submenu open.png");
    });

    casper.then(function() {
        var x = require('casper').selectXPath;
		this.click(x('//h5[text()="Edit"]'));
    });

    casper.then(function() {
        this.wait(2000, function() {
            test.assertExists(".editor-common-sidebar-project","Project page is open");
        });
    });

    casper.then(function() {
        this.wait(2000, function() {
            casper.capture("./test_frontend/img/editInfo/03-editor page open.png");
            this.click(".editor-common-sidebar-project");
        });
    });

    casper.then(function() {
        this.wait(2000, function() {
            casper.capture("./test_frontend/img/editInfo/04-project settings page open.png");
        });
    });

    casper.then(function() {
        this.fillSelectors("form.forms", {
    	'input[id=projectDetailTitle]' : 'Edited',
    	'textArea[id=projectDetailDescription]' : 'EditedImage'
		});
    });

    casper.then(function() {
    	casper.capture("./test_frontend/img/editInfo/05-values edited.png");
    });

    casper.then(function() {
		this.click(".editor-project-edit-sidebar-save");
    });

    casper.then(function() {
        this.wait(1000, function() {
        this.click(".sidebar-breadcrumb-inner > a:nth-child(1)");
        });
    });

    casper.then(function() {
        casper.wait(1000, function() {
            this.capture("./test_frontend/img/editInfo/06-values saved.png");
        });
    });

    casper.run(function() {
        test.done();
    }); 
});