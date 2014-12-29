var coffea = require('coffea'), sqlite = require('sqlite3'), c = require('./qBot');
var fs = require('fs');
var exists = fs.existsSync('quotes.db') ? true : false;
var db = new sqlite.Database('quotes.db');
var stream;
var modules = {};

if(!exists)
db.serialize(function() {
	db.run("CREATE TABLE IF NOT EXISTS quotes (user VARCHAR(32), added BIGINT, chan VARCHAR(32), quote TEXT)");
});

log("info", "starting quotebot");
loadModules();
log("info", "connecting to "+c.server.host+":"+c.server.port+" using SSL: "+(c.server.ssl ? "YES" : "NO"))

if(c.server.ssl) {
	var tls = require('tls');
	stream = tls.connect(c.server.port, c.server.host, {
		rejectUnauthorized: !c.server.sslconf.allowSelfSigned
	}, function() {
		if(stream.authorized || stream.authorizationError === 'DEPTH_ZERO_SELF_SIGNED_CERT' || stream.authorizationError === 'CERT_HAS_EXPIRED' || stream.authorizationError === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
			if(stream.authorizationError === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
				log('ssl-info', 'server is using self signed certificate');
			}
			if(stream.authorizationError === 'CERT_HAS_EXPIRED') {
				log('ssl-info', "connecting to server with expired certificate");
			}
		} else {
			error('ssl-error', stream.authorizationError);
		}
	});
} else {
	var net = require('net');
	stream = net.connect({
		port: c.server.port,
		host: c.server.host
	});
}

var client = coffea(stream);

setClientInfo();

client.on('motd', function(motd) {
	log("info", "connected to "+client.getServerInfo().servername);
	if(c.client.nickserv != "") client.send("NickServ", "IDENTIFY "+c.client.nickserv);
	log('info', 'joining channel'+(c.server.chans.length > 1 ? 's' : '')+': '+c.server.chans);
	client.join(c.server.chans);
});

client.on('kick', function(e) {
	client.join(e.channel.getName());
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
	"quit": {desc: {params: "[<msg>]", desc: "quit (with msg as quitmsg, if given)", needed: "owner"}},
	"tag": {desc: {params: "<quote|user> <tag>", desc: "tag a quote or user"}, needed: "allowed"},
	"deltag": {desc: {params: "<quote|user> <tag>", desc: "remove a tag of a quote or user"}, needed: "owner"}
};
var longquotes = {};

function execCommand(chan, user, cmd, allowed, owner) {
	nick = user.getNick();
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
				userMsg(l+" "+(gcmds[l].desc.params ? gcmds[l].desc.params+" " : "")+"- "+gcmds[l].desc.desc);
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
			return userMsg("I'm quotebot, made by pupskuchen\nvisit <link> for more information");
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
		case "tag":
			return chanMsg("this is WIP");
			chanMsg(""+params);
			if(params.length < 2) return paramError(cmds.tag.desc.params);
			var d, r = new RegExp(/[0-9]+/);
			if(!isNaN(params[0]) && r.test(params[0])) {
				
			} else {
			
			}
			return;
		case "deltag":
			return chanMsg("this is WIP");
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
				db.all("SELECT rowid AS id, quote, user FROM quotes WHERE quote LIKE ?1 OR quote LIKE ?2 OR quote LIKE ?3 OR quote = ?4 OR \
								user LIKE ?1 OR user LIKE ?2 OR user LIKE ?3 OR user = ?4 LIMIT 15", {
						1: "%"+stringparam+"%",
						2: "%"+stringparam,
						3: stringparam+"%",
						4: stringparam
					}, function(err, rows) {
						if(rows.length < 1) return chanMsg("nothing found");
						userMsg("I found "+rows.length+" quote"+(rows.length == 1 ? "" : "s")+" matching your pattern.");
						rows.forEach(function(el, i, arr) {
							el.quote = el.quote.split("\n");
							userMsg("#"+el.id+" (by "+el.user+"): \u00ab "+(el.quote.length > 30 ? el.quote.join(" | ").substr(0,30)+"..." : el.quote.join(" | "))+" \u00bb");
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
				if(params.length < 1 && isNaN(params[0]) && !r.test(params[0])) return paramError("del <id|id-id>");
				db.serialize(function() {
					var s, par = [];
					if(params.length > 0 && r.test(params[0])) {
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
/*		modules[cmd].info = {
			"chanMsg": chanMsg,
			"permissionError": permissionError,
			"paramError": paramError,
			"userMsg": userMsg,
			"chan": chan,
			"user": user,
			"nick": nick,
			"params": params,
			"allowed": allowed,
			"owner": owner,
			"pm": pm,
			"raw": raw,
			"paramparams": paramparams,
			"paramstringparam": paramstringparam
		};*/
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
	c = require('./qBot');
	loadModules();

	client.me.whois(function(err, data) {
		var bchans = Object.keys(data.channels);
		c.server.chans.forEach(function(el, i, arr) {
			if(bchans.indexOf(el) == -1) client.join(el);
		});
		bchans.forEach(function(el,i,arr) {
			if(c.server.chans.indexOf(el) == -1) client.part(el, 'I shall not be here.');
		});
	});

	setClientInfo();
}

function unloadModules() {
	for(mod in modules) {
		if(modules[mod].stop != null) modules[mod].stop();
	}
	for(var i = 0; i < c.modules.length; i++) {
		delete require.cache[require.resolve('./modules/'+c.modules[i])];
	}
}

function loadModules() {
	modules = {};
	if(c.modules.length > 0) {
		for(var i = 0; i < c.modules.length; i++) {
			log("info", "loading module "+c.modules[i]+"...");
			var mod = require('./modules/'+c.modules[i]);
			modules[mod.command] = mod;
			modules[mod.command].log = this.log = log;
			modules[mod.command].error = this.error = error;
			modules[mod.command].client = this.client = client;
			modules[mod.command].db = this.db = db;
			modules[mod.command].c = this.c = c;
		}
	}
}

function setClientInfo() {
	if(c.client.pass != "") client.pass(c.client.pass);
	client.nick(c.client.nick);
	client.user(c.client.user, c.client.real);
}

// =============================================

function colorize(msg) { // Thanks to maddin for this :3
	var codes = {
		bold: '\u0002',
		reset: '\u000f',
		underline: '\u001f',
		reverse: '\u0016',

		white: '\u000300',
		black: '\u000301',
		dark_blue: '\u000302',
		dark_green: '\u000303',
		light_red: '\u000304',
		dark_red: '\u000305',
		magenta: '\u000306',
		orange: '\u000307',
		yellow: '\u000308',
		light_green: '\u000309',
		cyan: '\u000310',
		light_cyan: '\u000311',
		light_blue: '\u000312',
		light_magenta: '\u000313',
		gray: '\u000314',
		light_gray: '\u000315'
	};

	msg = msg.replace(/\{B\}/g, codes.bold);
	msg = msg.replace(/\{R\}/g, codes.reset);
	msg = msg.replace(/\{U\}/g, codes.underline);
	msg = msg.replace(/\{REV\}/g, codes.reverse);
	msg = msg.replace(/\{FF\}/g, codes.whies);
	msg = msg.replace(/\{00\}/g, codes.black);
	msg = msg.replace(/\{DB\}/g, codes.dark_blue);
	msg = msg.replace(/\{DG\}/g, codes.dark_green);
	msg = msg.replace(/\{LR\}/g, codes.light_red);
	msg = msg.replace(/\{DR\}/g, codes.dark_red);
	msg = msg.replace(/\{M\}/g, codes.magenta);
	msg = msg.replace(/\{O\}/g, codes.orange);
	msg = msg.replace(/\{Y\}/g, codes.yellow);
	msg = msg.replace(/\{LG\}/g, codes.light_green);
	msg = msg.replace(/\{C\}/g, codes.cyan);
	msg = msg.replace(/\{LC\}/g, codes.light_cyan);
	msg = msg.replace(/\{LB\}/g, codes.light_blue);
	msg = msg.replace(/\{LM\}/g, codes.light_magenta);
	msg = msg.replace(/\{G\}/g, codes.gray);
	msg = msg.replace(/\{LG\}/g, codes.light_gray);
	return msg;
}

function log(type, message) {
	if(c.log) console.log("["+type+"] "+message);
}
function error(type, message) {
	console.error("["+type+"] "+message);
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

function insert(str, ins, pos) {
	return [str.slice(0,pos), ins, str.slice(pos)].join('');
}