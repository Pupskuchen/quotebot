exports.command = "time";

exports.desc = {
	params: "",
	desc: "shows current time (of the bot's system) and a unix timestamp",
	needed: ""
};

exports.exec = function() {
	var d = new Date();
	chanMsg('time: '+d.toUTCString()+" | unix timestamp: "+Math.round(Date.now()/1000));
};