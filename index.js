function AppRad() {
	Function.prototype.Help = function(help){
		this.help = help;
		return this;
	};

	var app = this;
	Function.prototype.Register = function(name, help) {
		app.register(name, this, help);
		return this;
	};

	Function.prototype.Map = function() {
		var func = this;
		var mapFunc;
		var args = Array.prototype.slice.call(arguments);
		if(args.length === 1 && args[0] instanceof Function)
			mapFunc = args.shift();
		else {
			mapFunc = function(run) {
				return run.apply(null, args.map(function(item){
					return item instanceof Function
						? item.call(app)
						: item
				}));
			};
		}
		this.mapper = function() {
			return mapFunc.call(app, func);
		};
		return this;
	};

	this._cmds		= {};
	this._cmdNameIndex	= 1;
	this._conf		= {};
	this._debug		= false;
	this._stash		= {};
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
	default_help_msg:	"",
	get stash()		{
		return this._stash;
	},
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

	get commands()		{
		return Object.getOwnPropertyNames(this._cmds);
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

	runOnCli:			function() {
		if(this.parentModule.parent == null)
			return this.run.apply(this, arguments);
	},

	run:			function() {
		this._runControlFunc("setup");
		var args		= this._parseCliArgs(process.argv.slice(2));
		this.options		= args.options;
		this.args		= args.args;
		this.cmd		= this.args[0];
		this.output		= this.execute.apply(this, this.args);
		this._runControlFunc("postProcess");
	},

	get registerCommand()	{
		return this.register;
	},

	register:		function(name, func, help) {
		//console.log("register(%s, %s, %s)", name, func, help);
		if(!(name in this._cmds)) {
			func = func || this.parentModuleExports[name];

			if(!func)
				throw new Error("no func");

			if(!name)
				name = this.createCommandName();

			this._cmds[name] = {};
			if(func) this._cmds[name] = func;
			if(help) this._cmds[name].help = help;
		}
		return this._cmds[name];
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

		Object.getOwnPropertyNames(this.parentModuleExports)
			.filter(function(funcName) {
				return this.parentModuleExports[funcName] instanceof Function;
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

		this.register("help", function() {
			var help = "Usage: " + process.argv[1] + " command [arguments]\n\n"
				+ "Available Commands:\n";

			this.commands.filter(function(cmd){
				return !this._cmds[cmd].skipHelp;
			}.bind(this)).forEach(function(cmd) {
				help += "\t" + cmd + ":\t\t" + this._getHelpMsgForCmd(cmd) + "\n";
			}.bind(this));

			return help;
		}, "Shows this help message.");

		this.register("default", function() {
			return this.execute("help");
		}).skipHelp = true;

		this.register("invalid", function() {
			return this.execute("default");
		}).skipHelp = true;
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
		if(!cmd) cmd = "default";
		else if(!this.isCommand(cmd)) cmd = "invalid";
		if(!this._cmds[cmd]) throw new Error("Func '" + cmd + "' doesn't exists");
		return (this._cmds[cmd].mapper || this._cmds[cmd]).apply(this, args);
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
		if(this.parentModuleExports[name])
			return this.parentModuleExports[name].apply(this, args);
		return this._controlFuncs[name].apply(this, args);
	},

	_controlFuncs:		{
		setup:		function() {
			this.registerCommands();
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

	_getHelpMsgForCmd:	function(cmd) {
		if(this._cmds[cmd])
			return this._cmds[cmd].help || this.default_help_msg;
	},

	_parseCliArgs:		function(argv) {
		var options = {};
		var args = [];
		for(var i = 0; i < argv.length; i++){
			if(argv[i] === "--") {
				args.push.apply(args, argv.slice(i));
				break;
			} else if(argv[i].substr(0, 2) === "--") {
				var opt = argv[i].replace(/^--/, "").split("=");
				if(opt[1] !== undefined)
					options[opt[0]] = opt[1];
				else
					if(argv[opt[0]] === undefined)
						options[opt[0]] = true;
					else if(argv[opt[0]] === true)
						options[opt[0]] = 2;
				options[opt[0]] = opt[1] !== undefined ? opt[1] : true;
				if(opt[1] === undefined && opt[0].substr(0, 3) === "no-")
					options[opt[0].replace(/^no-/, "")] = false;
			} else if(argv[i].substr(0, 1) === "-") {
				argv[i].substr(1).split("").forEach(function(letter){
					options[letter] = true;
				});
			} else {
				args.push(argv[i]);
			}
		}
		return {args: args, options: options}
	},

	get parentModule()	{
		if(this._parentModule)
			return this._parentModule;

		var _parent = module.parent;

		if("loaded" in _parent && _parent.loaded)
			this._parentModule = _parent;

		return _parent;
	},

	get parentModuleExports()	{
		var _parent;
		if(module.parent)
			_parent = this.parentModule.exports;
		else
			_parent = global;

		return _parent;
	}
};

module.exports = new AppRad();
