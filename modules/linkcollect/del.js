var links = require('./module');

exports.command = "dellink";

exports.desc = {
  params: "<id|id-id>",
  desc: "tells you the amount of links in the database",
  needed: "owner"
};

exports.exec = function() {
  var callback = function(err) {
    if(!err && this.changes > 0) return chanMsg("link "+params[0]+" deleted");
    chanMsg("Nothing deleted.");
  };

  var r = new RegExp(/[0-9]+-[0-9]+/);
  if(params.length < 1 || (isNaN(params[0]) && !r.test(params[0]))) return paramError("del <id|id-id>");
  var id  = params[0];
  if(r.test(id)) {
    var id = id.split("-");
    if(id[0] > id[1]) {
      var x = id[0];
      id[0] = id[1];
      id[1] = x;
    }
    else if(id[0] == id[1]) id = id[0];
    else {
      links.del(id[0], id[1], callback)
      return;
    }
  }
  links.del(id, callback);
};