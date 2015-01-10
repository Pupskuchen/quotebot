var cbot = require('./module');

exports.command = "tokens"; // the command

exports.desc = {
	params: "none / <user>", // parameters (shown in help)
	desc: "Shows the tokens of yourself or <user>", // command description (shown in help)
	needed: "" // needed permissions, can be an empty string, "allowed" or "owner" (used for help)
};

// to be executed on command
exports.exec = function() {
	
	var returny;
	
	if (typeof params[0] !== 'undefined') {
	
		var paramnick = params[0];
		
		cbot.getStats(paramnick, function (err, data) {
			if(err) console.log("[cBot.getStats - Error] " + err);
			else if (typeof data === 'undefined') {
				return chanMsg("Sorry, no stats available for that user. (yet!)");
			}
			else {
				returny = data.tokens;
				return chanMsg (paramnick + " has " + returny + " token"+((returny == 1)? "":"s") +"!");
			}
			
			});
	}
	else {
		cbot.getStats(nick, function (err, data) {
			if(err) console.log("[cBot.getStats - Error] " + err);
			else if (typeof data === 'undefined') {
			
				returny = "redo";
				cbot.createUser(nick, function(err) {
					
					if(err) console.log(err);
					
					cbot.getStats(nick, function(err, data) {
					
						returny = data.tokens;
						return chanMsg ("You have " + returny + " token"+((returny == 1)? "":"s") +"!");
						
					});
				});
			}
			else {
					
				returny = data.tokens;
				return chanMsg ("You have " + returny + " token"+((returny == 1)? "":"s") +"!");
			}
			
			});
	}
};