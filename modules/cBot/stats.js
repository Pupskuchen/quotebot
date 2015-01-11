var cbot = require('./module');

exports.command = "stats"; // the command

exports.desc = {
	params: "none / <user>", // parameters (shown in help)
	desc: "Shows the stats of yourself or <user>", // command description (shown in help)
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
					
				returny = {
					mate: data.mate,
					chocolate: data.chocolate,
					coffee: data.coffee};
					
				return returnDatShit(returny, paramnick);
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
					
						returny = {
							mate: data.mate,
							chocolate: data.chocolate,
							coffee: data.coffee};
							return returnDatShit(returny);
					});
				});
			}
			else {
					
				returny = {
					mate: data.mate,
					chocolate: data.chocolate,
					coffee: data.coffee};
					
				return returnDatShit(returny);
			}
			
			});
	}
};

function returnDatShit(returny, usr) {
	
	var	coffeeStat = returny.coffee,
			chocoStat = returny.chocolate,
			mateStat = returny.mate,
			chatLineStat = returny.chatlines,
			statTotal = coffeeStat + chocoStat + mateStat;
		
	console.log(returny);
		
	return chanMsg ((typeof usr === "undefined" ? "You" : usr) +" drank "+ coffeeStat +" coffee" + (coffeeStat == 1 ? "" : "s") + ", "+ chocoStat +" hot chocolate" + (chocoStat == 1 ? "" : "s") + " and " + mateStat + " mate" + (mateStat == 1 ? "" : "s") + ", which are in total " + statTotal + " drink" + (statTotal == 1 ? "" : "s") + ".");

}