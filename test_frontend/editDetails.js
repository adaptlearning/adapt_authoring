
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
    //checks if menu exists
    casper.then(function() {
        test.assertExists("a[class='open-context-icon open-context-course']", "Edit button exists");
    });
  //opens the menu
    casper.then(function() {
        this.click("a[class='open-context-icon open-context-course']");
        this.wait(2000, function(){
        casper.capture("./test_frontend/img/editInfo/02-submenu open.png");
    });
   });
    //selects edit course.
    casper.then(function() {
    	test.assertExists('.context-menu-item > a.context-menu-item-open',"Submenu is open");

    });

    casper.then(function() {
		this.click(".context-menu-item:nth-child(1) > a.context-menu-item-open");
      this.wait(2000, function(){
        this.capture("./test_frontend/img/editInfo/03-editor page open.png");
        });
    });

    casper.then(function() {
          test.assertExists(".course-edit-inner", "Landed on the edit details page");
    });

    casper.then(function() {
        this.fill("form", {
    	'title' : 'Edited course title'

		  });
    });

    casper.then(function() {
      this.wait(2000, function(){
    	casper.capture("./test_frontend/img/editInfo/05-values edited.png");
      });
    });

    //now add an asset as a 'hero image'

    casper.then(function(){

      this.click(".scaffold-asset-buttons > button.btn.secondary.scaffold-asset-picker");
      this.wait(2000, function(){
        this.capture("./test_frontend/img/editInfo/06-on-asset-page.png");
        this.click(".asset-management-assets-container-inner > div > div > div.asset-management-list-item:nth-child(1) > div > div.asset-management-list-item-image");
        this.click(".model-popup-toolbar-buttons > button.modal-popup-done");
        });
      });

    casper.then(function() {
		this.click(".editor-project-edit-sidebar-save");
    });


  //verify that the image shows on the front of the course in the dashboard.
    casper.then(function() {
        casper.wait(1000, function() {
            this.capture("./test_frontend/img/editInfo/07-values saved.png");
        });
    });

    casper.run(function() {
        test.done();
    });
});
