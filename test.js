var app = require("./index.js").setDebug;

module.exports = {
	bla:		function(){return "bla"},

	_ble:	 	function(){return "ble"}
			.Register("notBle", "help message"),

	bli:		function(num, str){console.log("num: %d; str: %s", num, str); return [num, str]}
			.Help("Custom help message")
			.Map(function(run) {
				return run(42, "bla" in this.options ? this.options.bla : "no bla");
			})
	,
	blo:		function(num, str){return [num, str]}
			.Map(42, function(){return "bla" in this.options ? this.options.bla : "another bla"})

	//invalid:	function(){return "invalid"},
};

//console.log("bli: %s", module.exports.bli);

//app.registerCommands();
//console.log(app._cmds);
//console.log("bla is command: %s", app.isCommand("bla"));
//console.log(app.execute("bla"));
//console.log("parent: ", app.parentModule);


app.runOnCli();
