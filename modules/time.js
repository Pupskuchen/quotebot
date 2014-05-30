exports.command = "time";

exports.desc = {
	params: "",
	desc: "shows current time (of the bot's system) and a unix timestamp",
	needed: ""
};

exports.exec = function(bot, chan, user, params, allowed, owner, db) {
	var d = new Date();
	bot.send(chan, user.getNick()+': time: '+d.toUTCString()+" | unix timestamp: "+Math.round(Date.now()/1000));
};