var cbot = require('./module');

exports.command = "give"; // the command

exports.desc = {
	params: "<user> <amount>", // parameters (shown in help)
	desc: "Gives <user> <amount> tokens from your stash.", // command description (shown in help)
	needed: "" // needed permissions, can be an empty string, "allowed" or "owner" (used for help)
};

// to be executed on command
exports.exec = function() {

	var paramnick = params[0];
	var amount = Math.round(parseInt(paramstringparam));

	if (isItValid(paramnick, amount)) {
		
		cbot.getStats(nick, function (err, data) {
			if(err) console.log("[cBot.getStats - Error] " + err);
			else if (typeof data === 'undefined') {
				cbot.createUser(nick, function(err) {
					if(err) console.log(err);
					return chanMsg ("Sorry, you dont have enough tokens. (You have 0!)");
				});
			}
			else {
			
				

				cbot.getStats(paramnick, function (err, data) {
					if(err) console.log("[cBot.getStats - Error] " + err);
					else if (typeof data === 'undefined') {
						return chanMsg("Sorry, no stats available for that user. (yet!)");
					}
					else {
					
						var tokens = Math.round(data.tokens);
					
						if (paramnick === nick) return chanMsg("You cant give yourself tokens!");
						else if (amount <= 0) return chanMsg("You cant give negative/zero amounts of tokens!");
						else if (amount > tokens) return chanMsg("You do not have enough tokens for that. You have "+ tokens +" token"+((tokens == 1)? "":"s") +".");
					
						cbot.addTokens(paramnick, amount);
						cbot.addTokens(nick, -1*amount);
					
						return chanMsg("I gave "+amount+" token"+((amount == 1)? "":"s") +" to "+ paramnick +". ("+ (tokens-amount) +" left!)");
			}
			
			});
				
				
			}
			
			});
	} else {
	
		return chanMsg("Wrong syntax.");
	
	}

};

function isItValid(paramnick, amount) {

	if (paramnick === 'undefined') return false;
	else if (amount === 'undefined') return false;
	else if (isNaN(parseInt(amount))) return false;
	else return true;

}

/*
// "destructor"
exports.stop = function() {

};
*/