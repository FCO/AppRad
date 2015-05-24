var app = require("./index.js").setDebug;

module.exports = {
	bla:	function(){return "bla"},

	_ble:	 function(){return "ble"},

	bli:	function(){return "bli"}
};

app.registerCommands();
console.log(app._cmds);
//console.log("bla is command: %s", app.isCommand("bla"));
console.log(app.execute("bla"));
