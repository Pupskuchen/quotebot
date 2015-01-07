var DB = 'db/links.db';

var fs       = require('fs'),
    dbexists = fs.existsSync(DB) ? true : false,
    sqlite   = require('sqlite3')
    ldb      = new sqlite.Database(DB);

if (!dbexists) {
  log("linkcollect", "creating database");
  ldb.serialize(function() {
    ldb.run("CREATE TABLE IF NOT EXISTS links (user VARCHAR(32), added BIGINT, url TEXT UNIQUE, desc VARCHAR(100))");
  });
}

exports.validURL = function (url) {
  return url.match(/^(ht|f)tps?:\/\/[a-z0-9-\.]+\.[a-z]{2,4}\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?$/);
};

exports.format = function (link, short) {
  var d = new Date(link.added*1000);
  return "#"+link.id+": "+link.url+" | desc: "+link.desc+(short ? "" : " | added "+d.toUTCString()+" by "+link.user);
};

exports.add = function (nick, link, desc, callback) {
  ldb.serialize(function () {
    ldb.run("INSERT INTO links (user, added, url, desc) VALUES ($user, $added, $link, $desc)", {
      $user: nick,
      $added: Math.round(Date.now()/1000),
      $link: link,
      $desc: desc 
    }, callback);
  });
};

exports.find = function (pattern, callback) {
  ldb.serialize(function () {
    ldb.all("SELECT rowid as id, * FROM links WHERE url LIKE ?1 OR url LIKE ?2 OR url LIKE ?3 OR url LIKE ?4 OR \
                                      desc LIKE ?1 OR desc LIKE ?2 OR desc LIKE ?3 OR desc LIKE ?4", {
      1: "%"+pattern+"%",
      2: "%"+pattern,
      3: pattern+"%",
      4: pattern
    }, callback);
  });
};

exports.get = function (id, callback) {
  ldb.serialize(function () {
    var d = id ? ldb.prepare("SELECT rowid as id, * FROM links WHERE id = ?1", id) : ldb.prepare("SELECT rowid as id, * FROM links ORDER BY RANDOM() LIMIT 1");
    d.get(callback);
  });
};

exports.count = function (callback) {
  ldb.serialize(function () {
    ldb.get("SELECT COUNT(rowid) as amount FROM links", callback);
  });
};

exports.del = function (id, to, callback) {
  if(typeof to === "function") callback = to;
  var range = (to && typeof to != "function") ? true : false,
      sql   = range ? "DELETE FROM links WHERE rowid BETWEEN ? AND ?" : "DELETE FROM links WHERE rowid = ?",
      par   = range ? [id, to] : id;
  ldb.serialize(function () {
    ldb.run(sql, par, callback);
  });
};