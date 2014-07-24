// login.js

//opens page
exports.login = function() { 
    var fs = require('fs');
    configFile = fs.read('./test_frontend/config.json');
    config = JSON.parse(configFile);
   
    casper.start("http://localhost:"+config.serverPort, function() {
    	this.evaluate(function() {
	      document.querySelector('body').style.backgroundColor = "white";
	    });
        this.wait(1000, function(){});
        casper.test.comment("Login");
        this.test.assertTitle("Adapt Origin", "Adapt homepage title is the one expected");
    }).viewport(1366,768);

	casper.then(function() {    		
        this.capture("./test_frontend/img/login/01-login page.png");
    });
    
    //fills in fields and clicks button
    casper.then(function() {
		this.fillSelectors("form.forms", {
    	'input[id=login-input-username]' : config.username,
    	'input[id=login-input-password]' : config.password
		});
    });
    casper.then(function() {
    	this.wait(1000, function(){
    		this.capture("./test_frontend/img/login/02-correct information entered.png");
    	});
    });
    casper.then(function() {
    	this.wait(1000, function(){
    		this.click("button[type=submit]");
    	});
		
    });

    casper.then(function() {
    	this.wait(1000, function(){
			this.capture("./test_frontend/img/login/03-proceeded to main page.png");
    	});
		this.test.assertExists("div[class=location-title-inner]", "Logged in");
    });

    return casper.then(function() {});
};
