// logout.js
var loginModule = require("./login");
//creates a new project
casper.test.begin('Logging Out', 4, function suite(test) {
    //runs the login module
    loginModule.login();

    casper.then(function() {
        this.wait(500, function() {});
        casper.test.comment("Logging out");
    });

    //click the logout button
    casper.then(function() {
        this.click("a[class='navigation-item navigation-user-logout']");
    });

    //check if the logout link exists
    casper.then(function() {
        test.assertExists('a[id="linkLogout"]', "Clicked the logout button, confirm screen exists");
    });

    casper.then(function() {
        this.capture("./test_frontend/img/logout/01-logout confirmation.png");
    });

    //click the logout button, then confirm you want to log out
    casper.then(function() {
        this.click("a[id='linkLogout']");
    });
    casper.then(function() {
        test.assertExists('input[id="login-input-username"]',
            "Clicked the confirm link, back at the login screen");
    });
    casper.then(function() {
        this.capture("./test_frontend/img/logout/02-back to login page.png");
    });

    casper.run(function() {
        test.done();
    }); 
});