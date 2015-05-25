var movies = require("./module");

exports.command = "delmovie";

exports.desc = {
    params: "<imdb-id>",
    desc: "deletes a movie from the database",
    needed: "owner"
};

exports.exec = function () {
    if(!movies.isImdb(params[0])) {
        return paramError("delmovie <imdb-id>");
    }

    movies.del(params[0], function (error) {
        if (error) {
            return chanMsg("Sorry, but I couldn't delete your movie :(");
        }

        if(this.changes > 0) {
            return chanMsg("Movie deleted!");
        }

        return chanMsg("No such movie.");
    });
};

