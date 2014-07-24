var API = {
	LMSInitialize: function() {
		this.data = {};
		this.data["cmi.core.lesson_status"] = "not attempted";
		this.data["cmi.suspend_data"] = "";
		return "true";
	},
	LMSFinish: function() {
		return "true";
	},
	LMSGetValue: function(key) {
		console.log('LMSGetValue("' + key + '") - ' + this.data[key]);
		return this.data[key];
	},
	LMSSetValue: function(key, value) {
		console.log('LMSSetValue("' + key + '") - ' + value);
		this.data[key] = value;
		return "true";
	},
	LMSCommit: function() {
		return "true";
	},
	LMSGetLastError: function() {
		return 0;
	},
	LMSGetErrorString: function() {
		return "Fake error string.";
	},
	LMSGetDiagnostic: function() {
		return "Fake diagnostic information."
	}
}