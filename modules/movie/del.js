var movies = require('./module');

exports.command = "delmovie";

exports.desc = {
    params: "<imdb-id>",
    desc: "deletes a movie from the database",
    needed: "owner"
};

exports.exec = function () {
    var imdbpatt = new RegExp("tt[0-9]{7}");

    if(!imdbpatt.test(params[0])) return paramError("delmovie <imdb-id>");

    movies.del(params[0], function (error) {
        if (error) {
            return chanMsg("Sorry, but I couldn't delete your movie :(");
        }

        if(this.changes > 0) return chanMsg("Movie deleted!");
        else return chanMsg("No such movie.");
    });
};

