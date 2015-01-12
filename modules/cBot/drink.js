var cbot = require('./module');

exports.command = "drink"; // the command

exports.desc = {
	params: "<mate:coffee:chocolate>", // parameters (shown in help)
	desc: "Delivers a drink of choice to you that cost tokens.", // command description (shown in help)
	needed: "" // needed permissions, can be an empty string, "allowed" or "owner" (used for help)
};

// to be executed on command
exports.exec = function() {

	if (typeof params[0] === 'undefined') return returnCosts();

	var 	returny,
			price;
			
	var drink = params[0];
	drink = drink.toLowerCase();
	
	switch (drink) {
	
		case "mate":
			price = cbot.matePrice;
			drink = "Mate";
			break;
		case "chocolate":
			price = cbot.chocoPrice;
			drink = "Chocolate";
			break;
		case "coffee":
			price = cbot.coffeePrice;
			drink = "Coffee";
			break;
		default:
			return chanMsg("Drink not available");	
	}
	
	
	cbot.getStats(nick, function (err, data) {
			if(err) console.log("[cBot.getStats - Error] " + err);
			else if (typeof data === 'undefined') return chanMsg("ERROR");
			else {
				returny = data.tokens;
				
				if (returny < price) return chanMsg("You do not have enough tokens. (You have "+returny+"!)");
				else {
					cbot.addTokens(nick, -1*price);
					cbot.addStat(nick, drink.toLowerCase());
					chanMsg("Here's your " + drink + ".");
				}
			}
	});
	

};


function returnCosts() {

	var 	coffeePrice = cbot.coffeePrice,
			chocoPrice = cbot.chocoPrice,
			matePrice = cbot.matePrice;
			
	return chanMsg("I'm offering: Coffee ("+coffeePrice+"T), Mate ("+matePrice+"T) and (Hot) Chocolate ("+chocoPrice+"T)");

}


/*
// "destructor"
exports.stop = function() {

};
*/