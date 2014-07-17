// asset.js
var loginModule = require("./login");
//tests the asset manager
casper.test.begin('Test Asset Manager', 7, function suite(test) {
    loginModule.login();

    casper.then(function() {
	    this.wait(500, function() {});
	    test.assertExists("a[class='project-layout-list']", "Menu is there");
    });


    //checks if menu exists and opens it
    casper.then(function() {
        test.assertExists("a[class='navigation-item navigation-global-menu']", "Menu button at top left exists ");
    });
    casper.then(function() {
        this.click("a[class='navigation-item navigation-global-menu']");
    });
    casper.then(function() {
    	this.wait(1000, function() {
    		this.capture("./test_frontend/img/asset/01-submenu open.png");
    	});
    });

    //clicks on the asset manager button
    casper.then(function() {
		this.click("div.global-menu-item:nth-child(2) > a:nth-child(1)");
    });

    casper.then(function() {
    	this.wait(1000, function() {
    		this.capture("./test_frontend/img/asset/02-opened asset page.png");
    	});
    });

    casper.then(function() {
        casper.test.comment("Filter with no results");
    });
    //enters a value into the search box that doesn't match any of the files
    casper.then(function() {
        casper.evaluate(function() {
            document.querySelector('input[name="search"]').setAttribute("value","no results");
        });
        
    });
    casper.then(function() {
        this.click("button[type=submit]");
    });
    casper.then(function() {
        this.wait(1000, function() {
            this.capture("./test_frontend/img/asset/03-no results in filter.png");
        });
    });

    //checks for an error message being displayed on the page
    casper.then(function() {
        this.wait(1000, function() {
            test.assertSelectorHasText('.unit-40', 'No assets found');
        });
    });

    casper.then(function() {
        casper.test.comment("Adding an asset");
    });

    casper.then(function() {
    	casper.test.comment("Testing uploading");
    	test.assertExists(".asset-nav-tabs > ul:nth-child(1) > li:nth-child(2) > a:nth-child(1)", "Able to upload a new file");
    });

    //clicks on the "Upload new asset" tab
    casper.then(function() {
    	this.click(".asset-nav-tabs > ul:nth-child(1) > li:nth-child(2) > a:nth-child(1)");
    });

    casper.then(function() {
    	this.wait(2000);
	});

    //fill in the form
	casper.then(function() {
    	this.fill("form.asset-form", {
    	'file' : config.assetPath
		});
	});

    casper.then(function() {
        this.fill("form.asset-form", {
        'title' : 'testing',
        'description' : 'description'
        }, true);
    });

	casper.then(function() {
    	this.capture("./test_frontend/img/asset/04-uploading an image.png");
	});

    //submits the image
	casper.then(function() {
		this.click("button[type=submit]");
    });

    //clicks the "Filters" tab
    casper.then(function() {
       this.click(".asset-nav-tabs > ul:nth-child(1) > li:nth-child(1) > a:nth-child(1)") 
    });

    casper.then(function() {
        this.capture("./test_frontend/img/asset/05-back to filter tab.png");
    });

    casper.then(function() {
        casper.test.comment("Filter with results");
    });

    //inputs a name that should match one of the files
    casper.then(function() {
        casper.evaluate(function() {
            document.querySelector('input[name="search"]').setAttribute("value", "testing");
        });
        
    });

    casper.then(function() {
        this.wait(1000, function() {
            this.click("button[type=submit]");
        });
    });

    casper.then(function() {
        this.wait(1000, function() {
        this.capture("./test_frontend/img/asset/06-filter showing result.png");
        });
    });

    //checks to make sure the error text isn't on the page
    casper.then(function() {
        test.assertSelectorDoesntHaveText('.unit-40', 'No assets found');
    });

    casper.run(function() {
        test.done();
    }); 	
});
