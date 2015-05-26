var app = require("./index.js").setDebug;

module.exports = {
	bla:		function(){return "bla"},

	_ble:	 	function(){return "ble"}
			.Register("notBle", "help message"),

	bli:		function(){return "bli"}
			.Help("Custom help message"),

	//invalid:	function(){return "invalid"},
};

//app.registerCommands();
//console.log(app._cmds);
//console.log("bla is command: %s", app.isCommand("bla"));
//console.log(app.execute("bla"));
//console.log("parent: ", app.parentModule);


app.runOnCli();
