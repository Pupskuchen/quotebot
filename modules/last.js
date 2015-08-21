exports.command = "last";

exports.desc = {
	params: "",
	desc: "shows the newest quote",
	needed: ""
};


exports.exec = function() {
  db.serialize(function() {
    db.all("SELECT *, max(rowid) AS id FROM quotes LIMIT 1", function(err, row) {
      if(row.length < 1) return chanMsg("nothing found");
      row = row[0];
      var dt = new Date(row.added*1000);
      row.quote = unHighlight(row.quote);
      var q = row.quote.split("\n");
      chanMsg("quote #"+row.id+": \u00ab "+(q.length == 1 ? row.quote : q.join(" | "))+" \u00bb (added "+dt.toUTCString()+" by "+unHighlight(row.user)+" in "+(row.chan ? unHighlight(row.chan) : "pm")+")", true);
    });
  });
};