// editCourse.js
var loginModule = require("./login");
var num;
var sections;
//tests the course editor
casper.test.begin('Test Course Editor', 11, function suite(test) {
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
        this.capture("./test_frontend/img/edit/01-on home page.png");
    });
    casper.then(function() {  
        this.click("li.project-list-item:nth-child("+num+") > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > a:nth-child(1)");
    });
    casper.then(function() {
        this.capture("./test_frontend/img/edit/02-submenu open.png");
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
        this.capture("./test_frontend/img/edit/03-main editor page open.png");
    });
    
    //clicks the button to add a section
    casper.then(function() {
        this.click(".editor-menu-layer-add-menu");
    });
    casper.then(function() {
        this.wait(1000, function() {
            sections = this.evaluate(function() { 
                return __utils__.findAll("div.editor-menu-item").length; 
            });
        });
    });
    casper.then(function() {
        this.wait(2000, function() {
            test.assertExists("div.editor-menu-item:nth-child("+(sections+2)+") > div:nth-child(1) > div:nth-child(3) > span:nth-child(1)", "Added a section");
            this.capture("./test_frontend/img/edit/04-section was added.png");
        });
    });                                                  

    //clicks the section to open it, then adds a page to that section 
    casper.then(function() {
        this.wait(1000, function() {
            this.click("div.editor-menu-item:nth-child("+(sections+2)+") > div:nth-child(1) > div:nth-child(3) > span:nth-child(1)");
        }); 
    });
    casper.then(function() {
        this.wait(1000, function() {
        test.assertExists("div.editor-menu-layer:nth-child(2) > div:nth-child(1) > div:nth-child(1) > button:nth-child(1)", "Opened the section");
            this.capture("./test_frontend/img/edit/05-section opened.png");
        });
    });
    casper.then(function() {
        this.wait(1000, function() {
            this.click("div.editor-menu-layer:nth-child(2) > div:nth-child(1) > div:nth-child(1) > button:nth-child(1)");
        }); 
    });
    casper.then(function() {
        this.wait(1000, function() {
            this.capture("./test_frontend/img/edit/06-page was added to section.png");
            test.assertExists("div.content-type-page:nth-child(3) > div:nth-child(1)", "Added a page");
        }); 
    });

    //opens the page
    casper.then(function() {
        this.wait(1000, function() {
            this.mouse.doubleclick("div.content-type-page:nth-child(3) > div:nth-child(1)");
        }); 
    });
    casper.then(function() {
        this.wait(1000, function() {
            this.capture("./test_frontend/img/edit/07-page opened.png");
            test.assertExists("a.btn", "Opened project page");
        }); 
    });

    //adds an article to the page, then a block to the article, then a component to the block
    casper.then(function() {
        this.click("a.btn");
    });
    casper.then(function() {
        this.wait(1000, function() {
            this.capture("./test_frontend/img/edit/08-article added to page.png");
            test.assertExists("div.page-article:nth-child(2) > div:nth-child(2) > div:nth-child(5) > a:nth-child(1)", "Added an article");
        }); 
    });
    casper.then(function() {
        this.click("div.page-article:nth-child(2) > div:nth-child(2) > div:nth-child(5) > a:nth-child(1)");
    });
    casper.then(function() {
        this.wait(1000, function() {
            this.capture("./test_frontend/img/edit/09-block added to article.png");
            test.assertExists("div.block:nth-child(2) > div:nth-child(2) > div:nth-child(5) > a:nth-child(1)", "Added a block");
        }); 
    });
    casper.then(function() {
        this.click("div.block:nth-child(2) > div:nth-child(2) > div:nth-child(5) > a:nth-child(1)");
    });
    casper.then(function() {
        this.wait(1000, function() {
            this.capture("./test_frontend/img/edit/10-component menu.png");
            test.assertExists("div.notify-popup-component-option:nth-child(6)", "Adding a component");
        });
    });

    //chooses which component to add: a blank, full width one
    casper.then(function() {
        this.wait(1000, function() {
            this.click("div.notify-popup-component-option:nth-child(6)");
        });
    });
    casper.then(function() {
        this.wait(1000, function() {
            this.click("div.notify-popup-layout-option:nth-child(2)");
        });
    });
    casper.then(function() {
        this.wait(1000, function() {
            this.capture("./test_frontend/img/edit/11-components are chosen.png");
        }); 
    });
    casper.then(function() {
        this.wait(1000, function() {
            this.click("a.notify-popup-button:nth-child(1)");
        });
    });
    casper.then(function() {
        this.wait(1000, function() {
            this.capture("./test_frontend/img/edit/12-component added to block.png");
        }); 
    });

    casper.run(function() {
        test.done();
    }); 	
});

