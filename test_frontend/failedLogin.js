//opens page
var fs = require('fs');
configFile = fs.read('./test_frontend/config.json');
config = JSON.parse(configFile);

casper.test.begin('Failing login test (no values)', 2, function suite(test) {
    casper.start("http://localhost:" + config.serverPort, function() {
        this.evaluate(function() {
          document.querySelector('body').style.backgroundColor = "white";
        });
        this.wait(1000, function(){});
        this.test.assertTitle("Adapt authoring tool", "Adapt login page title is the one expected");
    }).viewport(1366,768);

    //screenshot of the homepage before anything is entered
    casper.then(function() {
        this.capture("./test_frontend/img/failLogin/failNoInfo1.png");
    });

    //clicks login button without filling in any values
    casper.then(function() {
        this.wait(1000, function(){});
        this.click("button[type=submit]");
        casper.test.comment("Pressed the submit button without entering any values");
    });

    //takes a screenshot of the error message when submit is pressed
    casper.then(function() {
        this.capture("./test_frontend/img/failLogin/failNoInfo2.png");
    });

    //test output if the error message is there
    casper.then(function() {
        //this.test.assertSelectorDoesntHaveText("#loginErrorMessage", "");
        this.test.assertEval(function() {
            return __utils__.findOne('#loginErrorMessage').textContent !== '';
        }, "Error message appeared properly - no information provided");
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Failing login test (wrong values)', 2, function suite(test) {
  casper.start("http://localhost:" + config.serverPort, function() {
        this.evaluate(function() {
          document.querySelector('body').style.backgroundColor = "white";
        });
        this.wait(1000, function(){});
    this.test.assertTitle("Adapt authoring tool", "Adapt login page title is the one expected");
    }).viewport(1366,768);

    //screenshot of the homepage before anything is entered
    casper.then(function() {
        this.capture("./test_frontend/img/failLogin/failWrongInfo1.png");
    });

    //fill in the form with incorrect information
    casper.then(function() {
        this.fillSelectors("form.login-form", {
        'input[id=login-input-username]' : 'this is incorrect information',
        'input[id=login-input-password]' : 'pass'
        });
    });

    //clicks login button with incorrect values
    casper.then(function() {
        this.click("button[type=submit]");
        casper.test.comment("Entered incorrect values and pressed submit");
    });

    //test output if the error message is there
    //commented out because of bug
    casper.then(function() {
        //this.test.assertExists("loginErrorMessage", "Error message appeared properly - wrong information");
        this.wait(1000, function() {
            this.test.assertEval(function() {
                return __utils__.findOne('#loginErrorMessage').textContent !== '';
            }, "Error message appeared properly - wrong information");
        });
    });

    casper.then(function() {
        this.wait(2000, function() {
            this.capture("./test_frontend/img/failLogin/failWrongInfo2.png");
        });
    });

    casper.run(function() {
        test.done();
    });
});
