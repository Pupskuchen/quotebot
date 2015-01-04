var DATABASE = 'movies.db';

var fs      = require('fs'), dbexists = fs.existsSync(DATABASE) ? true : false;
var util    = require('util'),
    sqlite  = require('sqlite3'),
    moment  = require('moment'),
    omdb    = require('omdb'),
    db      = new sqlite.Database(DATABASE);

require('moment-duration-format');

if (!dbexists) {
    db.serialize(function() {
        db.run("CREATE TABLE IF NOT EXISTS movies (user VARCHAR(32), added BIGINT, title VARCHAR(32), year SMALLINT, runtime INT, type VARCHAR(32), genres VARCHAR(128), imdb_id VARCHAR(64), imdb_rating SMALLINT, user_rating SMALLINT)");
        db.run("CREATE TABLE IF NOT EXISTS votes (user VARCHAR(32), added BIGINT, movie INT, rating SMALLINT)");
    });
}

exports.isString = function (string) {
    return typeof string == 'string' || string instanceof String;
}

exports.add = function (title, user, callback) {
    if(title.length < 3) {
        return callback(true);
    }

    insert = function (error, movie) {
        if (error || !movie) {
            return callback(error || true);
        }

        db.serialize(function() {
            db.run("INSERT INTO movies (user, added, title, year, runtime, type, genres, imdb_id, imdb_rating) \
                VALUES ($user, $added, $title, $year, $runtime, $type, $genres, $imdbId, $imdbRating)", {
                $user:          user,
                $added:         Math.round(Date.now()/1000),
                $title:         movie.title,
                $year:          movie.year,
                $runtime:       movie.runtime,
                $type:          movie.type,
                $genres:        movie.genres.join(", "),
                $imdbId:        movie.imdb.id,
                $imdbRating:    movie.imdb.rating,
            }, callback(false, movie.title));
        });
    }

    var imdbpatt = new RegExp("tt[0-9]{7}");

    if(imdbpatt.test(title)) omdb.get({ imdb: title }, true, insert);
    else omdb.get({ title: title }, true, insert);
};

exports.list = function (page, callback) {
    page = page || 1;
    var limit = 5,
        offset = (page - 1) * limit;

    db.serialize(function() {
        db.all("SELECT *, rowid as id FROM movies ORDER BY user_rating, imdb_rating DESC LIMIT " + offset + ", " + limit, callback)
    });
};

exports.get = function (title, callback) {
    db.serialize(function () {
        db.get("SELECT *, rowid as id FROM movies WHERE title = $title", {
            $title: title
        }, callback);
    });
};

exports.find = function (term, limit, callback) {
    limit = limit || 5;

    db.serialize(function () {
        var query = "SELECT *, rowid as id FROM movies WHERE title LIKE ?1 OR title LIKE ?2 OR title LIKE ?3 OR title = ?4 OR \
            year = ?4 OR \
            genres LIKE ?1 OR genres LIKE ?2 OR genres LIKE ?3 OR genres = ?4 LIMIT " + limit,
            method = (limit == 1 ? 'get' : 'all');

        db[method](query, {
            1: "%" + term + "%",
            2: "%" + term,
            3: term + "%",
            4: term
        }, callback);
    });
};

exports.rate = exports.vote = function (movie, user, rating, callback) {
    var process = function (movie) {
        var movieId = movie.id;

        db.serialize(function () {
            db.get("SELECT COUNT(*) as count FROM votes WHERE movie = $movie AND user = $user", {
                $user:      user,
                $movie:     movieId
            }, function (error, data) {
                console.log(error);
                console.log(data);
                if (error || data.count > 0) {
                    console.log(error);
                    console.log(data);
                    return callback(true);
                }

                db.run("UPDATE movies SET user_rating = " + (!movie.user_rating ? rating : "((user_rating + " + rating + ") / 2)") + " WHERE rowid = $movie", {
                    $movie: movieId
                });

                db.run("INSERT INTO votes (user, added, movie, rating) VALUES ($user, $added, $movie, $rating)", {
                    $user:      user,
                    $added:     Math.round(Date.now()/1000),
                    $movie:     movieId,
                    $rating:    rating
                }, callback);
            });
        });
    };

    if (rating < 0 || rating > 10) {
        return callback(true);
    }

    var movieId = null;

    this.find(movie, 1, function (error, data) {
        if (error || !data) {
            return callback(true);
        }

        process(data);
    });
};

exports.formatRuntime = function (runtime) {
    return moment.duration(parseInt(runtime), "minutes").format("h [hr(s)], m [min]");
};

exports.formatImdbUrl = function (imdbId) {
    return "http://www.imdb.com/title/" + imdbId;
};

exports.format = function (movie) {
    return util.format("{B}%s:{R} {B}Genres:{R} %s, {B}Runtime:{R} %s, {B}Released:{R} %d, {B}IMDB-Rating:{R} %d, {B}IRC-Rating:{R} %d (added by %s, %s) - %s",
        movie.title,
        movie.genres,
        this.formatRuntime(movie.runtime),
        movie.year,
        movie.imdb_rating || 0.0, movie.user_rating || 0.0,
        movie.user, new Date(movie.added*1000).toUTCString(),
        this.formatImdbUrl(movie.imdb_id)
    );
};

exports.db = db; // for raw queries
exports.omdb = omdb; // for raw api access

