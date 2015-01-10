var DATABASE = "./db/cBot.db";

var	fs      = require('fs'), 
		dbexists = fs.existsSync(DATABASE) ? true : false;
var	sqlite  = require('sqlite3'),
		db = new sqlite.Database(DATABASE);
		
var 	botWhitelist,
		tokenTimeout = 60,
		coffeePrice = 3,
		chocoPrice = 1,
		matePrice = 2;



/*

	COMMANDS:
			- ,cbot
			- ,tokens
			- ,tokens <user>
			- ,drink coffee/mate/chocolate
			- ,give <user> <amount>
			- ,stats
			- ,stats <user>

*/	
		
if (!dbexists) {
	console.log(dbexists);
    db.serialize(function() {
		db.run("CREATE TABLE IF NOT EXISTS users (nick varchar(255) NOT NULL, tokens int(11) NOT NULL, chatlines int(11) NOT NULL, laststamp int(255))");
        db.run("CREATE TABLE IF NOT EXISTS stats (userid int(11) NOT NULL, coffee int(11) NOT NULL, mate int(11) NOT NULL, chocolate int(11) NOT NULL)");
		db.run("CREATE TABLE IF NOT EXISTS botlist (nick varchar(255) NOT NULL)");
    });
}



client.on('message', function(e) {
	
	var thisnick = e.user.getNick();
	
	exports.getStats(thisnick, function(err, data) {
		if(err) console.log("[cBot.Message - Error] " + err);
		else if (typeof data === 'undefined') {
			exports.createUser(thisnick, function(err) {
					if(err) console.log(err);
			});
		}
		else {
	
			var lastStamp = data.laststamp;
			var chatLines = data.chatlines;
			var tokens = data.tokens;
			
			if (Math.round(new Date()/1000) >= (lastStamp + tokenTimeout)) {
				
				if ((chatLines+1) >= 10) {
				
					exports.changeTokens(thisnick, (tokens+1), true);
				
				} else {
				
					exports.changeChatlines(thisnick, (chatLines+1));
				
				}
			
			}
			
		}
	});
	

});

exports.createUser = function(user, callback) {
	
	db.serialize(function() {
		db.run("INSERT INTO users (nick, tokens, chatlines, laststamp) VALUES ($nick, $tokens, $chatlines, $laststamp)", {
			$nick: user,
			$tokens: 0,
			$chatlines: 0,
			$laststamp: Math.round(new Date()/1000)
		}, function (err) {
			if(err) console.log(err);
		});
		
		db.run("INSERT INTO stats (userid, coffee, mate, chocolate) VALUES ((SELECT rowid FROM users where nick = $nick), $c, $m, $ch)", {
			$nick: user,
			$c: 0,
			$m: 0,
			$ch: 0
		}, function (err) {
			if(err) console.log("[CREATEUSER] " + err);
		}, callback);
	});

	
};

exports.changeTokens = function(user, tokens, reset) {
	db.serialize(function() {
		db.run("UPDATE users SET tokens = $tokens, " + ((typeof reset === "undefined") ? "" : " chatlines = 0, ") + "laststamp = $laststamp WHERE nick = $nick", {
			$nick: user,
			$tokens: tokens,
			$laststamp: Math.round(new Date()/1000)
		});
	});
};

exports.addStat = function(user, drink) {

	db.serialize(function() {
	
		switch (drink) {
			case "coffee":
				db.run("UPDATE stats SET coffee = (coffee+ 1) WHERE stats.userid = (SELECT rowid FROM users where nick = $nick)", {
				$nick : user});
				break;
			case "mate":
				db.run("UPDATE stats SET mate = (mate+ 1) WHERE stats.userid = (SELECT rowid FROM users where nick = $nick)", {
				$nick : user});
				break;
			case "chocolate":
				db.run("UPDATE stats SET chocolate = (chocolate+ 1) WHERE stats.userid = (SELECT rowid FROM users where nick = $nick)", {
				$nick : user});
				break;
		}
	
	});

};

exports.addTokens = function(user, value) {

	db.serialize(function() {
		db.run("UPDATE users SET tokens = (tokens + $value), laststamp = $laststamp WHERE nick = $nick", {
			$nick: user,
			$value: value,
			$laststamp: Math.round(new Date()/1000)
		});
	});
};

exports.changeChatlines = function(user, value) {

	db.serialize(function() {
		db.run("UPDATE users SET chatlines = $chatlines, laststamp = $laststamp WHERE nick = $nick", {
			$nick: user,
			$chatlines: value,
			$laststamp: Math.round(new Date()/1000)
		});
	});
};

exports.getStats = function(user, callback) {
	
		db.serialize(function() {
		db.get("SELECT * FROM stats, users WHERE stats.userid = users.rowid AND users.nick = $nick", {
			$nick: user
			}, callback);
		});

};

exports.isBot = function(user) {

	botWhitelist.forEach(function(i) {
	
		if (user === i) return true;
	
	});
	
	return false;

};

exports.db = db;
exports.coffeePrice = coffeePrice;
exports.chocoPrice = chocoPrice;
exports.matePrice = matePrice;