var fs = require('fs');

function copy (src, tgt) {
  var c = false;
  var cb = function (err) {
    if(err && !c) {
      error("backup", err);
      c != c;
    }
  };

  var read = fs.createReadStream(src);
  read.on('error', cb);
  if (c) return false;
  var write = fs.createWriteStream(tgt);
  write.on('error', cb);
  if(c) return false;
  read.pipe(write);
  
  return true;
}

function backup () {
  var dbDir = './db/',
      buDir = dbDir+'backup/';
  if(!fs.existsSync(buDir)) fs.mkdirSync(buDir);
  fs.readdir(dbDir, function (err, files) {
    if(err) return error("backup", err);
    files.forEach(function (file) {
      if(file.indexOf(".") == 0 || fs.lstatSync(dbDir+file).isDirectory()) return;
      copy(dbDir + file, buDir + file);
    });
  });
}

var b = setInterval(backup, c.backup_interval*60*1000);

exports.kill = function() {
  clearInterval(b);
}
