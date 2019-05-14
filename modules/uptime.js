exports.command = "uptime"; // the command

exports.desc = {
	params: "", // parameters (shown in help)
	desc: "shows uptime", // command description (shown in help)
	needed: "" // needed permissions, can be an empty string, "allowed" or "owner" (used for help)
};

// to be executed on command
exports.exec = function() {
	var t = process.uptime();
	var d = Math.floor(t / 86000);
	var h = Math.floor((t / 3600) % 24);
	var m = Math.floor((t / 60) % 60);
	var s = Math.floor(t % 60);
	chanMsg("I'm up " + d + "d " + h + "h " + m + "m " + s + "s.");
};

/*
// "destructor"
exports.stop = function() {

};
*/
