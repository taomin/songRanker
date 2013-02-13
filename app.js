
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    user = require('./routes/user'),
    http = require('http'),
    path = require('path'),
    fs = require('fs'),
    hbs = require('express-hbs'),
    passport = require('passport'),
    dbmodel = require('./dbmodel.js'),
    partials = require('./partials.js'),
    YahooStrategy = require('passport-yahoo').Strategy;


passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new YahooStrategy({
    returnURL: 'http://localhost:3000/auth/yahoo/return',
    realm: 'http://localhost:3000/'
  },
  function(identifier, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      // the user's Yahoo profile is returned to represent the logged-in user
      var user = {
        email: profile.emails[0].value,
        name: profile.displayName,
        identifier: identifier
      };
      return done(null, user);
    });
  }
));

var app = express();

app.configure(function(){
  app.engine('hbs', hbs.express3({partialsDir: __dirname + '/views/partials'}));
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hbs');
  app.set('port', process.env.PORT || 3000);
  app.set('db-uri', 'mongodb://localhost:27017/songRanker');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(express.methodOverride());
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.errorHandler({showStack: true, dumpExceptions: true}));
  app.use(partials());
  app.use(app.router);
});

app.configure('development', function(){
});


/**
 * setting up connection to mongo db
 */

dbmodel = dbmodel.init(app.set('db-uri'));



app.get('/', dbmodel.getSongRanking, routes.index);

app.get('/auth/yahoo', passport.authenticate('yahoo', { failureRedirect: '/' }), user.auth);

app.get('/auth/yahoo/return', passport.authenticate('yahoo', { failureRedirect: '/' }), user.authReturn);

app.get('/logout', user.logout);

app.post('/add_song', dbmodel.addSong, routes.json);

app.post('/vote_song', dbmodel.voteSong, routes.json);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

