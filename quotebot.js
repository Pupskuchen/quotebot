var coffea = require('coffea'), sqlite = require('sqlite3'), c = require('./qBot');
var fs = require('fs'), exists = true;
if(!fs.existsSync('quotes.db')) {
	exists = false;
}
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

if(c.client.pass != "") client.pass(c.client.pass);
client.nick(c.client.nick);
client.user(c.client.user, c.client.real);

client.on('motd', function(motd) {
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
				if(e.message.charAt(0) === c.commandchar[i]) parseCommand(null, e.user, e.message.substr(c.commandchar[i].length));
			}
		} else {
			if(e.message.charAt(0) === c.commandchar) parseCommand(null, e.user, e.message.substr(c.commandchar.length));
		}
		parseCommand(null, e.user, e.message);
	}
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
	"count": {desc: {params: "[<users|quotes>]", desc: "echoes amount of configured users and/or quotes in database"}},
	"about": {desc: {params: "", desc: ""}},
	"modules": {desc: {params: "", desc: "list all loaded modules"}},
	"help": {desc: {params: "[<module>]", desc: "show this."}},
	"add": {desc: {params: "<quote>", desc: "add quote $quote", needed: "allowed"}},
	"del": {desc: {params: "<id>", desc: "delete quote $id", needed: "owner"}},
	"reload": {desc: {params: "", desc: "reload configuration", needed: "owner"}},
	"quit": {desc: {params: "[<msg>]", desc: "quit (with msg as quitmsg, if given)", needed: "owner"}}
};

function execCommand(chan, user, cmd, allowed, owner) {
	var nick = user.getNick();
	cmd = cmd.split(" ");
	var params = cmd.splice(1, cmd.length);
	var stringparam = params.join(" ");
	cmd = cmd[0];
	var pm = !chan ? true : false;

	permissionError =	function() {chanMsg("You don't have permissions for this command.")};
	paramError = function(usage) {chanMsg("Usage: "+usage)};
	chanMsg = function(msg, noNick) {
		if(!pm) client.send(chan, noNick ? msg : nick+": "+msg)
		else userMsg(msg);
	};
	userMsg = function(msg) {client.send(user, msg)};
	
	help = function(l, gcmds) {
		if(l in gcmds) {
			if(gcmds[l].desc.needed) {
				if(gcmds[l].desc.needed == "allowed" && allowed) userMsg(l+" "+gcmds[l].desc.params+" - "+gcmds[l].desc.desc);
				else if(gcmds[l].desc.needed == "owner" && owner) userMsg(l+" "+gcmds[l].desc.params+" - "+gcmds[l].desc.desc);
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
				userMsg("use !help <command> for detailed help");
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
				var d;
				if(params.length > 0 && !isNaN(params[0])) d = db.prepare("SELECT *, rowid AS id FROM quotes WHERE id = ?", params[0]);
				else d = db.prepare("SELECT *, rowid AS id FROM quotes ORDER BY RANDOM() LIMIT 1");
				d.get(function(err, row) {
					if(typeof row === "undefined") {
						chanMsg("nothing found");
						return;
					}
					var dt = new Date(row.added*1000);
					chanMsg("quote #"+row.id+": \u00ab "+row.quote+" \u00bb (added "+dt.toUTCString()+" by "+row.user+" in "+row.chan+")", true);
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
							userMsg("#"+el.id+" (by "+el.user+"): \u00ab "+el.quote+" \u00bb");
						});
				});
			});
			return;
		case "add":
			if(allowed) {
				if(stringparam.length < 1) return paramError("add <quote>");
				db.serialize(function() {
					db.run("INSERT INTO quotes (user, added, chan, quote) VALUES($user, $added, $chan, $quote)", {
						$user: nick,
						$added: Math.round(Date.now()/1000),
						$chan: chan,
						$quote: stringparam
					}, function(err) {
						if(!err) chanMsg("Quote #"+this.lastID+" saved.");
					});
				});
				return;
			} else return permissionError();
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
				if(params.length > 0) client.quit(params.join(" "));
				else client.quit("quotebot has to go now :c");
			} else return permissionError();
	}

	if(cmd in modules) {
		return modules[cmd].exec(client, chan, user, params, allowed, owner, db);
	}

	chanMsg("Unknown command.");
}

// =============================================

function reload() {
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
}

function loadModules() {
	modules = {};
	if(c.modules.length > 0) {
		for(var i = 0; i < c.modules.length; i++) {
			log("info", "loading module "+c.modules[i]+"...");
			var mod = require('./modules/'+c.modules[i]);
			modules[mod.command] = mod;
		}
	}
}

// =============================================

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