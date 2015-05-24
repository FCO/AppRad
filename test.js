var app = require("./index.js");

module.exports = {
	bla:	function(){return "bla"},

	_ble:	 function(){return "ble"},

	bli:	function(){return "bli"}
};

app.registerCommands();
console.log(app._cmds);
