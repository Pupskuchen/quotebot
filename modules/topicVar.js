exports.command = "tvar";

exports.desc = {
	params: "<var> [<value>]",
	desc: "sets topic variable $var to $value or returns its value",
	needed: ""
};

var self = this;
c.tvar_allowedModes = c.tvar_allowedModes || "%@~";

exports.exec = function() {
	if(isAllowed()) {
		if(paramstringparam.length < 1 && params.length < 1) return paramError("tvar <var> <value>");
		var chan = this.chan;
		var topic = client.getChannel(chan).getTopic().topic;
		var regex = /\s+([a-zA-Z0-9-äöüÄÖÜß. ]+):\s+([\wäüöÄÜÖß|\d]+)/g;
		var match = regex.exec(topic);
		var vars = {};
		while(match != null) {
			vars[match[1]] = match[2];
			match = regex.exec(topic);
		}
		if(stringparam in vars) return chanMsg(stringparam+" = "+vars[stringparam]);
		else if(params[0] !== "unset" && paramstringparam.length < 1) {
			if(params[0] in vars) return chanMsg(params[0]+" = "+vars[params[0]]);
			else return chanMsg("no such topic variable");
		}
		else {
			if(params[0] === "unset") {
				if(paramstringparam.length < 1) return paramError("tvar unset <var>");
				else if(!(paramstringparam in vars)) return chanMsg("no such topic variable");
				var reg = new RegExp("[\\s\\\|]+"+paramstringparam+":\\s+"+vars[paramstringparam], "g");
				client.topic(chan, topic.replace(reg, ''));
				return;
			}
			if(params[0] in vars) {
				paramstringparam = paramstringparam.replace(/[^\wäüöÄÜÖß|\d]/g, '');
				client.topic(chan, topic.replace(params[0]+": "+vars[params[0]], params[0]+": "+paramstringparam));
			} else {
				client.topic(chan, topic + ' | '+params[0]+': '+paramstringparam);
			}
		}
	} else return permissionError();
};

function isAllowed() {
	for(var i = 0; i < c.tvar_allowedModes.length; i++) {
		if(self.user.channels[self.chan].indexOf(c.tvar_allowedModes[i]) != -1) return true;
	}
	return false;
}