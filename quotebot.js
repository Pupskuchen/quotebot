var DB = 'db/quotes.db';

var sqlite = require('sqlite3'),
    c      = require('./qBot'),
    fs     = require('fs'),
    exists = fs.existsSync(DB) ? true : false,
    db     = new sqlite.Database(DB),
    client = require('coffea')(prepareClient());

var modules  = {},
    topMod   = [],
    eModules = [];

if(!exists)
db.serialize(function() {
	db.run("CREATE TABLE IF NOT EXISTS quotes (user VARCHAR(32), added BIGINT, chan VARCHAR(32), quote TEXT)");
});

log("info", "starting quotebot");
loadModules();
log("info", "connecting to "+c.server.host+":"+c.server.port+" using SSL: "+(c.server.ssl ? "YES" : "NO"))

client.on('motd', function(motd) {
	log("info", "connected to "+client.getServerInfo().servername);
	if(c.server.chans && c.server.chans.length > 0) {
		log('info', 'joining channel'+(c.server.chans.length > 1 ? 's' : '')+': '+c.server.chans);
		client.join(c.server.chans);
	}
});

client.on('kick', function(e) {
	if(c.kick_autorejoin) client.join(e.channel.getName());
});

client.on('message', function(e) {
	if(!e.isAction) {
		if(Object.prototype.toString.call(c.commandchar) === '[object Array]') {
			for(var i = 0; i < c.commandchar.length; i++) {
				if(e.message.charAt(0) === c.commandchar[i]) parseCommand(e.channel.getName(), e.user, e.message.substr(c.commandchar[i].length));
			}
		} else {
			if(e.message.charAt(0) === c.commandchar) parseCommand(e.channel.getName(), e.user, e.message.substr(c.commandchar.length));
		}
	}
});

client.on('privatemessage', function(e) {
	if(!e.isAction) {
		if(Object.prototype.toString.call(c.commandchar) === '[object Array]') {
			for(var i = 0; i < c.commandchar.length; i++) {
				if(e.message.charAt(0) === c.commandchar[i]) return parseCommand(null, e.user, e.message.substr(c.commandchar[i].length));
			}
		} else {
			if(e.message.charAt(0) === c.commandchar) return parseCommand(null, e.user, e.message.substr(c.commandchar.length));
		}
		parseCommand(null, e.user, e.message);
	}
});

client.on('quit', function(e) {
	if(e.user.getNick() in longquotes) delete longquotes[e.user.getNick()];
});

// =============================================

function parseCommand(chan, user, msg) {
	var re = new RegExp("[\\s\\"+c.commandchar.join('\\')+"]", "g");
	if(msg.replace(re, "") === "") return;
	user.whois(function(err, data) {
		var reggedUser = data.account != null ? true : false;
		reggedUser = reggedUser && (c.allowbyaccount ? true : (c.allowed.indexOf(data.account) != -1));
		execCommand(chan, user, msg, reggedUser, c.allowed.indexOf(data.account) == 0 ? true : false);
	});
}

var cmds = {
	"find": {desc: {params: "<string>", desc: "find quote(s) containing the given string"}},
	"q": {desc: {params: "[<id>]", desc: "show random quote or quote with given id"}},
	"count": {desc: {params: "[users|quotes]", desc: "echoes amount of configured users and/or quotes in database"}},
	"about": {desc: {params: "", desc: ""}},
	"modules": {desc: {params: "", desc: "list all loaded modules"}},
	"help": {desc: {params: "[<module>]", desc: "show this."}},
	"add": {desc: {params: "<quote>|long", desc: "add quote $quote or quote with multiple lines", needed: "allowed"}},
	"del": {desc: {params: "<id>", desc: "delete quote $id", needed: "owner"}},
	"reload": {desc: {params: "", desc: "reload configuration", needed: "owner"}},
	"quit": {desc: {params: "[<msg>]", desc: "quit (with msg as quitmsg, if given)", needed: "owner"}}
};
var longquotes = {};

function execCommand(chan, user, cmd, allowed, owner) {
	nick = user.getNick();
	cmd = cmd.replace(/^\s+|\s+$/g,'');
	raw = cmd;
	cmd = cmd.split(" ");
	params = cmd.splice(1, cmd.length);
	stringparam = params.join(" ");
	paramparams = params.splice(1, params.length);
	paramstringparam = paramparams.join(" ");
	cmd = cmd[0].toLowerCase();
	pm = !chan ? true : false;

	permissionError =	function() {chanMsg("You don't have permissions for this command.")};
	paramError = function(usage) {chanMsg("Usage: "+usage)};
	chanMsg = function(msg, noNick, cchan) {
		msg = colorize(msg);
		if(!pm || cchan) client.send((cchan ? cchan : chan), noNick ? msg : nick+": "+msg)
		else userMsg(msg);
	};
	userMsg = function(msg) {client.send(user, colorize(msg))};

	help = function(l, gcmds) {
		if(l in gcmds) {
			if(gcmds[l].desc.needed) {
				if(gcmds[l].desc.needed == "allowed" && allowed) userMsg(l+""+(gcmds[l].desc.params != "" ? " "+gcmds[l].desc.params+" " : "")+"- "+gcmds[l].desc.desc);
				else if(gcmds[l].desc.needed == "owner" && owner) userMsg(l+""+(gcmds[l].desc.params != "" ? " "+gcmds[l].desc.params+" " : "")+"- "+gcmds[l].desc.desc);
				else permissionError();
			} else {
				userMsg(l+(gcmds[l].desc.params ? gcmds[l].desc.params : "")+" - "+gcmds[l].desc.desc);
			}
			return true;
		}
		return false;
	};

	listCommands = function(gcmds) {
		var list = [[], [], []]
		for(key in gcmds) {
			if(typeof gcmds[key].desc.needed === "undefined" || gcmds[key].desc.needed == "") list[0].push(key);
			else {
				if(gcmds[key].desc.needed == "allowed") {
					if(allowed) list[1].push(key);
				} else {
					if(allowed && owner) list[2].push(key);
				}
			}
		}
		return list;
	};

	removeTimestamp = function(msg) {
		return msg.replace(/\[([0-9]{2}:?){2,3}\](\ +)?/g, '');
	};

	endLongQuote = function() {
		var q = longquotes[nick];
		delete longquotes[nick];
		if(q.length < 1)	return chanMsg("No input given, therefore nothing saved.");
		execCommand(chan, user, "add "+q.join("\n"), allowed, owner);
	};
	
	if(pm && nick in longquotes) {
		if(cmd === "end") endLongQuote();
		else if(cmd === "cancel" || cmd === "abort") {
			delete longquotes[nick];
			chanMsg("Cancelled long quote");
		}
		else {
			if(removeTimestamp(raw).replace(/[^0-9a-zA-Z]/g, '').length < 5) return userMsg("ignored: a line has to be at least 5 characters long. continuing...");
			longquotes[nick].push(removeTimestamp(raw));
			if(longquotes[nick].length >= 10) {
				userMsg("the maximum of ten lines has been reached.");
				endLongQuote();
			}
		}
		return;
	}

	switch(cmd) {
		case "help":
			if(params.length > 0) {
				var l = params[0];
				if(!help(l, cmds) && !help(l, modules)) chanMsg("That command doesn't exist.");
			} else {
				var list = [], alist = [], olist = [];
				var l = listCommands(cmds);
				list.merge(l[0]);
				alist.merge(l[1]);
				olist.merge(l[2]);
				l = listCommands(modules);
				list.merge(l[0]);
				alist.merge(l[1]);
				olist.merge(l[2]);
				userMsg("commands: "+list.join(", "));
				if(allowed) userMsg("for allowed users: "+alist.join(", "));
				if(allowed && owner) userMsg("for owner: "+olist.join(", "));
				userMsg("use {B}help <command>{R} for detailed help");
			}
			return;
		case "info":
		case "about":
			return userMsg("I'm quotebot, made by pupskuchen\nvisit https://github.com/Pupskuchen/quotebot for more information");
		case "modules":
			if(c.modules.length > 0) return chanMsg("currently running modules: "+c.modules.join(", "));
			else return chanMsg("no mods loaded");
		case "q":
			db.serialize(function() {
				var d, r = new RegExp(/[0-9]+/);
				if(params.length > 0 && !isNaN(params[0]) && r.test(params[0])) d = db.prepare("SELECT *, rowid AS id FROM quotes WHERE id = ?", params[0]);
				else d = db.prepare("SELECT *, rowid AS id FROM quotes ORDER BY RANDOM() LIMIT 1");
				d.get(function(err, row) {
					if(typeof row === "undefined") return chanMsg("nothing found");
					var dt = new Date(row.added*1000);
					var q = row.quote.split("\n");
					chanMsg("quote #"+row.id+": \u00ab "+(q.length == 1 ? row.quote : q.join(" | "))+" \u00bb (added "+dt.toUTCString()+" by "+insert(row.user, "\u200b", 1)+" in "+(row.chan ? insert(row.chan, "\u200b", 2) : "pm")+")", true);
				});
				d.finalize();
			});
			return;
		case "count":
			if(params.length > 0 && params[0] == "users") return chanMsg("I have "+c.allowed.length+" allowed user"+(c.allowed.length === 1 ? "" : "s")+"."+(c.allowbyaccount ? " But any logged in user can create quotes." : ""));
			db.serialize(function() {
				db.all("SELECT rowid FROM quotes", function(err, rows) {
					var count = rows.length;
					if(params.length > 0 && params[0] == "quotes") {
						chanMsg("I have "+count+" quote"+(count === 1 ? "" : "s")+" in my database.");
					} else {
						chanMsg("I have "+count+" quote"+(count === 1 ? "" : "s")+" and "+c.allowed.length+" allowed user"+(c.allowed.length === 1 ? "" : "s")+"."+(c.allowbyaccount ? " But any logged in user can create quotes." : ""));
					}
				});
			});
			return;
		case "find":
			if(stringparam.length < 3) return paramError("find <string> (string must at least have 3 characters)");
			db.serialize(function() {
				db.all("SELECT rowid AS id, quote, user FROM quotes WHERE quote LIKE ?1 OR quote LIKE ?2 OR quote LIKE ?3 OR quote = ?4", {
						1: "%"+stringparam+"%",
						2: "%"+stringparam,
						3: stringparam+"%",
						4: stringparam
					}, function(err, rows) {
						if(!rows || rows.length < 1) return chanMsg("nothing found");
/*						if(rows.length == 1) {
							var el = rows[0];
							el.quote = el.quote.split("\n");
							chanMsg("#"+el.id+" (by "+el.user+"): \u00ab "+(el.quote.length > 30 ? el.quote.join(" | ").substr(0,30)+"..." : el.quote.join(" | "))+" \u00bb", true);
							return;
						}
*/						if(rows.length > 70) return chanMsg("found too many ("+rows.length+") quotes. be more specific.");
						var ids = [];
						rows.forEach(function(el) {
							ids.push(el.id);
						});
						chanMsg(ids.length+" quote"+(ids.length == 1 ? "" : "s")+" matching your search pattern: "+ids.join(", "));
						//userMsg("I found "+rows.length+" quote"+(rows.length == 1 ? "" : "s")+" matching your pattern.");
						if(rows.length <= 3)
						rows.forEach(function(el, i, arr) {
							el.quote = el.quote.split("\n");
							chanMsg("#"+el.id+" (by "+el.user+"): \u00ab "+(el.quote.length > 30 ? el.quote.join(" | ").substr(0,30)+"..." : el.quote.join(" | "))+" \u00bb");
						});
				});
			});
			return;
		case "add":
			if(allowed) {
				var string = removeTimestamp(stringparam).replace(/[^0-9a-zA-Z]/g, '');
				if(string === "long") {
					longquotes[nick] = [];
					userMsg("Waiting for your input. You can enter multiple lines. To end the quote, enter END (in a new line).");
					return;
				}
				if(string.length < 3) return paramError("add <quote> (at least 5 characters)");
				db.serialize(function() {
					db.run("INSERT INTO quotes (user, added, chan, quote) VALUES($user, $added, $chan, $quote)", {
						$user: nick,
						$added: Math.round(Date.now()/1000),
						$chan: chan,
						$quote: removeTimestamp(stringparam)
					}, function(err) {
						if(!err) chanMsg("Quote #"+this.lastID+" saved.");
					});
				});
				return;
			} else return permissionError();
		case "end":
			if(!allowed)  return permissionError();
			if(nick in longquotes) {
				endLongQuote();
			} else chanMsg("u stupid (you haven't started any long quotes)");
			return;
		case "del":
			if(allowed && owner) {
				var r = new RegExp(/[0-9]+-[0-9]+/);
				if(params.length < 1 || (isNaN(params[0]) && !r.test(params[0]))) return paramError("del <id|id-id>");
				db.serialize(function() {
					var s, par = [];
					if(r.test(params[0])) {
						var p = params[0].split("-");
						if(p[0] < p[1]) {
							s = "DELETE FROM quotes WHERE rowid >= ? AND rowid <= ?";
							par = [p[0], p[1]];
						} else return paramError("del <id-id> (first id must obviously be smaller than second id)");
					} else {
						s = "DELETE FROM quotes WHERE rowid = ?";
						par = params[0];
					}
					db.run(s, par, function(err) {
						if(!err && this.changes > 0) {
							chanMsg("Quote #"+params[0]+" deleted.");
						} else chanMsg("Nothing deleted.");
					});
				});
				return;
			} else return permissionError();
		case "reload":
			if(allowed && owner) {
				chanMsg("Reloading...");
				reload();
				return;
			} else return permissionError();
		case "quit":
			if(allowed && owner) {
				db.close();
				if(params.length > 0) client.quit(stringparam);
				else client.quit("quotebot has to go now :c");
			} else return permissionError();
	}

	if(cmd in modules) {
		if(modules[cmd].desc.needed === "owner" && (!owner || !allowed)) return permissionError();
		else if(modules[cmd].desc.needed === "allowed" && (!allowed && !owner)) return permissionError();

		modules[cmd].chanMsg = chanMsg;
		modules[cmd].permissionError = permissionError;
		modules[cmd].paramError = paramError;
		modules[cmd].userMsg = userMsg;
		modules[cmd].chan = chan;
		modules[cmd].user = user;
		modules[cmd].nick = nick;
		modules[cmd].params = params;
		modules[cmd].allowed = allowed;
		modules[cmd].owner = owner;
		modules[cmd].pm = pm;
		modules[cmd].raw = raw;
		modules[cmd].stringparam = stringparam;
		modules[cmd].paramparams = paramparams;
		modules[cmd].paramstringparam = paramstringparam;
		return modules[cmd].exec();
	}

	chanMsg("Unknown command.");
}

// =============================================

function reload() {
	unloadModules();
	log("info", "reloading configuration...");
	delete require.cache[require.resolve('./qBot')];
	try {
		c = JSON.parse(fs.readFileSync('./qBot.json', 'utf8'));
	} catch (e) {
		chanMsg("you have an error in your config, falling back to previous config");
	}
	loadModules();

	client.me.whois(function (err, data) {
		var bchans = data.channels ? Object.keys(data.channels) : [];
		bchans.forEach(function (el) {
			if(c.server.chans.indexOf(el) == -1) client.part(el, 'I shall not be here.');
		});
		c.server.chans.forEach(function (el) {
			if(bchans.indexOf(el) == -1) client.join(el);
		});
	});

	setClientInfo();
}

function unloadModules() {
	for(mod in modules) {
		if(modules[mod].stop != null) modules[mod].stop();
	}

	var unload = function (target) {
		delete require.cache[require.resolve(target)];
	};

	Object.keys(modules).forEach(function (mod) {
		unload(modules[mod].modpath);
	});
	topMod.forEach(function (mod) {
		unload(mod[0]);
		if(mod[1])
		mod[1].forEach(function (subdep) {
			unload(mod[0]+"/"+subdep);
		});
	});
	eModules.forEach(function (mod) {
		if(mod.kill) mod.kill();
		unload(mod.modpath);
	});
}

function loadModules() {
	modules  = {};
	topMod   = [];
	eModules = [];

	var addVars = function (mod) {
		mod.log = this.log = log;
		mod.error = this.error = error;
		mod.client = this.client = client;
		mod.db = this.db = db;
		mod.c = this.c = c;
		mod.insert = this.insert = insert;
	};

	addVars({}); // we need this for the variables to work with other modules (idk why)

	var prepareMod = function (path) {
			var mod = require(path);
			mod.modpath = path;
			addVars(mod);
			if(mod.command) {
				modules[mod.command] = mod;
			} else {
				eModules.push(mod);
			}
	};

	if(c.modules && c.modules.length > 0) {
		log("info", "loading "+c.modules.length+" module"+(c.modules.length == 1 ? "" : "s"));
		for(var i = 0; i < c.modules.length; i++) {
			log("info", "loading module "+c.modules[i]+"...");
			var path = './modules/'+c.modules[i];
			if(fs.existsSync(path) && fs.lstatSync(path).isDirectory()) {
				var req = require(path);
				topMod.push([path, req.subdeps ? req.subdeps : null]);
				var submod = req.components;
				if(!submod || submod.length < 1) continue;
				submod.forEach(function (mod) {
					log("info", "- loading "+c.modules[i]+"/"+mod+"...")
					prepareMod(path+'/'+mod);
				});
				continue;
			}
			prepareMod(path);
		}
		log("info", "all modules loaded")
	}
}

function setClientInfo() {
	if(c.client.pass != "") client.pass(c.client.pass);
	client.nick(c.client.nick);
	client.user(c.client.user, c.client.real);
}

function prepareClient() {
	var conf = {
		host: c.server.host,
		port: c.server.port,
		ssl: c.server.ssl,
		nick: c.client.nick,
		username: c.client.user,
		realname: c.client.real,
		pass: c.client.pass,
		ssl_allow_invalid: c.server.allow_invalid_ssl
	}
	if(c.client.nickserv) {
		conf.nickserv = {
			username: c.client.nickserv.user ? c.client.nickserv.user : c.client.nick,
			password: c.client.nickserv.pass
		}
	}
	return conf;
}

// =============================================

function colorize (msg) {
	var codes = {
		'B':    '\u0002',
		'R':    '\u000f',
		'U':    '\u001f',
		'REV':  '\u0016',

		'FF':   '\u000300',
		'00':   '\u000301',
		'DB':   '\u000302',
		'DG':   '\u000303',
		'LR':   '\u000304',
		'DR':   '\u000305',
		'M':    '\u000306',
		'O':    '\u000307',
		'Y':    '\u000308',
		'LG':   '\u000309',
		'C':    '\u000310',
		'LC':   '\u000311',
		'LB':   '\u000312',
		'LM':   '\u000313',
		'G':    '\u000314',
		'LG':   '\u000315'
	};

	for (code in codes) {
		msg = msg.replace(new RegExp("\\{" + code + "\\}", "g"), codes[code]);
	}
	return msg;
}

function log(type, message) {
	if(c.log) console.log("["+type+"] "+message);
}
function error(type, message) {
	console.error("["+type+"] "+message);
}

function insert(str, ins, pos) {
	return [str.slice(0,pos), ins, str.slice(pos)].join('');
}

Array.prototype.equals = function(arr) {
	if(!arr) return false;
	if(this.length != arr.length) return false;
	for(var i = 0, l = this.length; i < l; i++) {
		if(this[i] instanceof Array && array[i] instanceof Array) {
			if(!this[i].equals(array[i])) return false;
		} else if(this[i] != array[i]) return false;
	}
	return true;
}

Array.prototype.merge = function(arr) {
	var b = this.concat(arr);
	this.length = 0;
	this.push.apply(this, b);
}