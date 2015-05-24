function AppRad() {
	this._cmds		= {};
	this._cmdNameIndex	= 1;
	this._conf		= {};
	this._debug		= false;
}

AppRad.prototype = {
	nonCommandGlobalFunctions: [
		"assert",		"clearImmediate",	"clearInterval",
		"clearTimeout",		"decodeURI",		"decodeURIComponent",
		"encodeURI",		"encodeURIComponent",	"escape",
		"eval",			"events",		"isFinite",
		"isNaN",		"parseFloat",		"parseInt",
		"require",		"setImmediate",		"setInterval",
		"setTimeout",		"stream",		"unescape"
	],
	get setDebug()		{
		this._debug = true;
		return this;
	},

	cmd:			null,

	get command()		{
		return this.cmd;
	},

	set command(cmd)	{
		this.cmd = cmd;
	},

	commands:		function() {
		return Object.keys(this._cmds);
	},

	createCommandName:	function() {
		var newName = "cmd" + this._cmdNameIndex++;
		if(this.isCommand(new_name))
			return this.createCommandName()
		return newName;
	},

	loadConfig:		function() {
		var args = Array.prototype.slice.call(arguments);
		args.forEach(function(configFile){
		});
	},

	get config()		{
		return this._conf;
	},

	run:			function() {
		this._setup();
		//this._parseArgs(process.argv);
		this.execute(this.command);
	},

	get registerCommand()	{
		return this.register;
	},

	register:		function(name, func, help) {
		if(!(name in this._cmds)) {
			func = func || this.parentModule[name];

			if(!func)
				throw new Error("no func");

			if(!name)
				name = this.createCommandName();

			this._cmds[name] = {};
			if(func) this._cmds[name].func = func;
			if(help) this._cmds[name].help = help;
		}
	},

	registerCommands:	function() {
		var rules = [];
		if(arguments.length) {
			Array.prototype.slice.call(arguments)
				.forEach(function(rule) {
					if(typeof rule === "string") {
						this.register(rule);
					} else if(rule instanceof Object) {
						Object.keys(rule).forEach(function(key) {
							if(key[0] !== "-") {
								this.register(key, null, rule[key]);
							} else {
								var regex;
								switch(key) {
									case "-regex":
										rules.push(function(funcName){
											return funcName.match(rule[key]);
										});
										break;
									case "-nregex":
										rules.push(function(funcName){
											return !funcName.match(rule[key]);
										});
										break;
									case "-accept_suffix":
										rules.push(function(funcName){
											return (funcName.indexOf(rule[key]) + rule[key].length === funcName.length);
										});
										break;
									case "-ignore_suffix":
										rules.push(function(funcName){
											return !(funcName.indexOf(rule[key]) + rule[key].length === funcName.length);
										});
										break;
									case "-accept_preffix":
										rules.push(function(funcName){
											return (funcName.indexOf(rule[key]) === 0);
										});
										break;
									case "-ignore_preffix":
										rules.push(function(funcName){
											return !(funcName.indexOf(rule[key]) === 0);
										});
										break;
								}
							}
						});
					} else throw new Error("deu ruim");
				}.bind(this))
			;
		} else {
			rules = [function(funcName) {
				return funcName[0] != "_";
			}];
		}

		Object.getOwnPropertyNames(this.parentModule)
			.filter(function(funcName) {
				return this.parentModule[funcName] instanceof Function;
			}.bind(this))
			.filter(function(funcName) {
				return funcName[0].toLowerCase() === funcName[0];
			})
			.filter(function(funcName) {
				return this.nonCommandGlobalFunctions.indexOf(funcName) < 0;
			}.bind(this))
			.filter(function(funcName) {
				for(var i = 0; i < rules.length; i++) {
					if(rules[i](funcName)) return true;
				}
				return false;
			})
			.forEach(function(funcName) {
				this.register(funcName);
			}.bind(this))
		;
	},

	get unregisterCommand()	{
		return this.unregister;
	},

	unregister:		function(name) {
	},

	debug:			function() {
		if(this._debug) console.log.apply(console, arguments);
	},

	execute:		function() {
		var args = Array.prototype.slice.call(arguments);
		var cmd = args.shift();
		if(!this.isCommand(cmd)) throw new Error(cmd + " is not a command");
		return this._cmds[cmd].func.apply(this, args);
	},

	isCommand:		function(cmdName) {
		return cmdName in this._cmds;
	},

	/* control functions */

	_runControlFuncScript:	function() {
		Array.prototype.slice.call(arguments).forEach(function(func){
			if(!(func instanceof Array)) func = [func];
			this._runControlFunc.apply(this, func);
		}.bind(this));
	},

	_runControlFunc:	function() {
		var args = Array.prototype.slice.call(arguments);
		var name = args.shift();
		if(this.parentModule[name])
			return this.parentModule[name].apply(this, args);
		return this._controlFuncs[name].apply(this, args);
	},

	_controlFuncs:		{
		setup:		function() {
			console.log("control func setup");
		},

		teardown:	function() {
		},

		preProcess:	function() {
		},

		postProcess:	function() {
			if(this.output)
				console.log(this.output);
		}
	},

	/**/

	_setup:			function() {
		return this._runControlFunc("setup");
	},

	_parseCliArgs:		function(argv) {

	},

	get parentModule()	{
		if(this._parentModule)
			return this._parentModule;

		var _parent;
		if(module.parent)
			_parent = module.parent.exports;
		else
			_parent = global;

		if("loaded" in _parent && _parent.loaded)
			this._parentModule = _parent;

		return _parent;
	}
};

module.exports = new AppRad();
