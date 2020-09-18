var Requesters = require('./models/requesters');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt');

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  Requesters.findById(id, function(err, user) {
    done(err, user);
  });
});

// Use the GoogleStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Google
//   profile), and invoke a callback with a user object.
passport.use(new GoogleStrategy({
        clientID: '868565993431-ofumsp7s1peqt2i04p70mgruj58t64bc.apps.googleusercontent.com',
        clientSecret: 'rbhWocF3IMZ_H2YCRBvFcTC4',
        callbackURL: "https://icrowdtasker.herokuapp.com/requesters/google/auth"
    },
    function(accessToken, refreshToken, profile, done) {
        console.log(profile._json.email);
        var user = Requesters.findOne({ email: profile._json.email }, function (err, user) {
            return done(err, user);
        });
    }
));

// Sets up the local strategy for creating a session.
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
},
    function (email, password, done) {
        Requesters.findOne({email: email}, function (err, user) {
            if (err) {return done(err);}
            if (!user) {return done(null, false);}
            if (!bcrypt.compareSync(password, user.password)) {return done(null,  false);}
            return done(null,  user);
        });
    }
));

