// editCourse.js
var loginModule = require("./login");
var num;
var sections;
//tests the course editor
casper.test.begin('Test Course Editor', 6, function suite(test) {
    loginModule.login();
    casper.then(function() {
        //stores the number of projects in a variable to be used later
        num = this.evaluate(function() { 
            return __utils__.findAll("li.project-list-item").length; 
        });
	    this.wait(500, function() {});
        casper.test.comment("Project settings");
    });

    //checks if menu exists and opens it, then clicks the "Edit" option
    casper.then(function() {
        test.assertExists("a[class='open-context-icon open-context-course']", "Edit button exists");
    });
    casper.then(function() {
        this.capture("./test_frontend/img/editEx/01-on home page.png");
    });
    casper.then(function() {  
        this.click("li.project-list-item:nth-child("+num+") > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > a:nth-child(1)");
    });
    casper.then(function() {
        this.capture("./test_frontend/img/editEx/02-submenu open.png");
    });
    casper.then(function() {
        var x = require('casper').selectXPath;
		this.click(x('//h5[text()="Edit"]'));
        this.wait(1000);
    });

    casper.then(function() {
        test.assertExists("div[class='editor-menu-layer-controls units-row']", "Got into the edit window");
    });

    casper.then(function() {
        this.capture("./test_frontend/img/editEx/03-on editor page.png");
    });

    casper.then(function() {
        this.click("button[class='editor-common-sidebar-extensions btn']");
    });

    casper.then(function() {
        this.wait(1000, function() {
            this.capture("./test_frontend/img/editEx/04-opened extensions page.png");
        });
    });

    casper.then(function() {
        this.click("#checkbox-1");
    });

    casper.then(function() {
        this.wait(1000, function() {
            this.capture("./test_frontend/img/editEx/05-chose one extension to add.png");
        });
    });

    casper.then(function() {
        test.assertExists(".editor-extensions-edit-sidebar-save", "At the manage extensions page");
    })

    casper.then(function() {
        this.click(".editor-extensions-edit-sidebar-save");
    });

    casper.then(function() {
        this.wait(1000, function() {
            this.capture("./test_frontend/img/editEx/06-confirmation message for extensions.png");
        });
    });

    casper.then(function() {
        this.click("a.notify-popup-button:nth-child(1)");
    });

    casper.then(function() {
        this.wait(1000, function() {
            this.click("button[class='editor-common-sidebar-extensions btn']");
        });
    });

    casper.then(function() {
        this.wait(1000, function() {
            this.capture("./test_frontend/img/editEx/07-shows enabled extension.png");
        });
    });

    casper.then(function() {
        test.assertExists(".btn-red", "An extension has been added");
    })

    casper.then(function() {
        this.click(".btn-red");
    });

    casper.then(function() {
        this.wait(1000, function() {
            this.capture("./test_frontend/img/editEx/08-confirmation message for removing extension.png");
        });
    });

    casper.then(function() {
        this.click("a.notify-popup-button:nth-child(1)");
    });

    casper.then(function() {
        this.wait(1000, function() {
            this.capture("./test_frontend/img/editEx/09-extension removed.png");
        });
    });

    casper.run(function() {
        test.done();
    }); 
});