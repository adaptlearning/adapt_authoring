// editConfig.js
var loginModule = require("./login");
var num;
var sections;
//tests the course editor
casper.test.begin('Test Course Editor - Configuration', 5, function suite(test) {
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
        this.capture("./test_frontend/img/editConfig/01-on home page.png");
    });
    casper.then(function() {  
        this.click("li.project-list-item:nth-child("+num+") > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > a:nth-child(1)");
    });
    casper.then(function() {
        this.capture("./test_frontend/img/editConfig/02-submenu open.png");
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
        this.capture("./test_frontend/img/editConfig/03-on main editor page.png");
    });

    casper.then(function() {
        this.click(".editor-common-sidebar-config");
    });
    casper.then(function() {
        this.wait(1000, function() {
            this.capture("./test_frontend/img/editConfig/04-configuration page opened.png");
        }); 
    });

    casper.then(function() {
        this.test.assertExists("#config-defaultLanguage", "On configuration page");
    });


    //changes values on the configuration page and saves them
    casper.then(function() {
        this.fillSelectors("form.forms", {
        'input[id=config-defaultLanguage]' : 'fr',
        'input[id=config-questionWeight]' : '3',
        'input[id=config-drawerduration]' : '600'
        });
    });
    casper.then(function() {
        casper.evaluate(function() {
            document.querySelector('#config-accessibilityenabled').selectedIndex = 1;
            document.querySelector('#config-accessibilitylegacy').selectedIndex = 1;
            document.querySelector('#config-drawershoweasing').selectedIndex = 3;
            document.querySelector('#config-drawerhideeasing').selectedIndex = 4;
        });
    });
    casper.then(function() {
        this.wait(1000, function() {
            this.capture("./test_frontend/img/editConfig/05-configuration values edited.png");
        });
    });
    casper.then(function() {
        this.click("button[class='btn editor-config-edit-sidebar-save']");
    });

    casper.then(function() {
        this.wait(1000, function() {
            this.capture("./test_frontend/img/editConfig/06-configuration saved and back to main page.png");
        });
    });

    casper.run(function() {
        test.done();
    });     
});
