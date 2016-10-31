// delete.js
var loginModule = require("./login");
var num;
//tests the course editor
casper.test.begin('Testing deleting a course', 2, function suite(test) {
    loginModule.login();
    casper.then(function() {
        this.wait(500, function() {});

    });

    casper.then(function() {
    	casper.test.comment("Testing delete on the last project");
        //stores the number of projects in a variable to be used later
        num = this.evaluate(function() {
            return __utils__.findAll("li.project-list-item").length;
        });
    });

    casper.then(function() {
    	this.capture("./test_frontend/img/delete/01-on home page.png");
    });

    //click on the delete button on the project numbered "num", which is the last project
    casper.then(function() {
        this.click(".app-inner > div.dashboard > div > ul > li:nth-child("+num+") > div > div.project-header > div > div > div > a.course-delete.editor-delete-course-element > i");
    });

    // casper.then(function() {
    // 	this.capture("./test_frontend/img/delete/02-submenu open.png");
    //     this.wait(1000, function() {
    // 	   test.assertExists("div.context-menu-item:nth-child(3) > a:nth-child(1) > div:nth-child(1) > h5:nth-child(1)", "Submenu is open");
    //     });
    // });
    // //clicks the delete option
    // casper.then(function() {
    //     this.click("div.context-menu-item:nth-child(3) > a:nth-child(1) > div:nth-child(1) > h5:nth-child(1)");
    // });

    casper.then(function() {
      this.wait(2000, function () {
      this.click(".sweet-alert.showSweetAlert.visible > div.sa-button-container > div > button")
      this.wait(1000, function () {
        this.capture("./test_frontend/img/delete/03-project was deleted.png");
      });
    });
    });
    //confirms the delete because it uses a confirm box
    casper.setFilter("page.confirm", function(msg) {
	    return true;
	});

    casper.run(function() {
        test.done();
    });
});
