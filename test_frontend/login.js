// login.js
//opens page
exports.login = function() { 
    casper.start("http://localhost:3000", function() {
    	this.evaluate(function() {
	      document.querySelector('body').style.backgroundColor = "white";
	    });
        this.wait(1000, function(){});
        casper.test.comment("Login");
        this.test.assertTitle("Adapt Origin", "Adapt homepage title is the one expected");
    }).viewport(1366,768);

	casper.then(function() {    		
        this.capture("./test_frontend/img/login/loginImg.png");
    });
    
    //fills in fields and clicks button
    casper.then(function() {
		this.fillSelectors("form.forms", {
    	'input[id=login-input-username]' : 'email@email.com',
    	'input[id=login-input-password]' : 'password'
		});
    });
    casper.then(function() {
    	this.wait(1000, function(){
    		this.capture("./test_frontend/img/login/loginImg2.png");
    	});
    });
    casper.then(function() {
    	this.wait(1000, function(){
    		this.click("button[type=submit]");
    	});
		
    });

    casper.then(function() {
    	this.wait(1000, function(){
			this.capture("./test_frontend/img/login/loginImg3.png");
    	});
		this.test.assertExists("div[class=location-title-inner]", "Logged in");
    });

    return casper.then(function() {});
};
