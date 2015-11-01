exports.command = "say"; // the command

exports.desc = {
	params: "<string>", // parameters (shown in help)
	desc: "says whatever you want it to say", // command description (shown in help)
	needed: "allowed" // needed permissions, can be an empty string, "allowed" or "owner" (used for help)
};

exports.exec = function() {
	if (params.length < 1) return chanMsg("u stupid");
	if (pm && params[0].charAt(0) == "#" && paramstringparam.length < 1) return userMsg('no.');
	if (pm && params[0].charAt(0) == "#") chanMsg(paramstringparam, true, params[0]);
	else chanMsg(stringparam, true);
};
