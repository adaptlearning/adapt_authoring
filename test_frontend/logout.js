// logout.js
var loginModule = require("./login");
//creates a new project
casper.test.begin('Logging Out', 3, function suite(test) {
    //runs the login module
    loginModule.login();

    casper.then(function() {
        this.wait(500, function() {});
        casper.test.comment("Logging out");
    });

    //click the logout button
    casper.then(function() {
        this.click(".navigation-right > a.navigation-item.navigation-user-logout.btn.white-hollow");
    });

    //check if the logout link exists
    casper.then(function() {
      this.wait(2000, function(){
        test.assertExists(".login-input-username", "Clicked the logout button, confirm screen exists");
        });
    });

    casper.then(function() {
        this.capture("./test_frontend/img/logout/01-logout confirmation.png");
    });

    casper.run(function() {
        test.done();
    });
});
