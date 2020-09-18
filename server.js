var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
require('dotenv').config();
require('./passport-setup');
require('./routes/requesters');

// Session imports
var passport = require('passport');
var session = require('express-session');

var app = express();


// Database connection.
mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true});
var database = mongoose.connection;

// app.use

app.use(express.static('public'));

app.use(express.json());
app.use('/bootstrap-select-country', express.static(__dirname + '/node_modules/bootstrap-select-country/dist/'));
app.use(bodyParser.urlencoded({ extended: false }))


// Cookie info
app.use(session({
        resave: true,
        saveUninitialized: true,
        secret: '6969090010a401438be2960f0ff760c0',
        cookie: {
            maxAge: 30 * 60 * 1000 // Thirty minute session timers by default.
        },
        rolling: true
}))
app.use(passport.initialize());
app.use(passport.session());

// Google login app.uses
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /requesters/google/auth
app.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }));

// Checks if user is logged in.
var isLoggedIn = (req, res, next) => {
    if (req.user) {
        next();
    }
    else {
        res.status(401).json({message: 'You are not logged in'})
    }
}

// Routes.
app.get('/', (req, res) => {
    res.sendFile('public/index.html');
});

app.get('/requester-login', (req, res) => {
    if (req.user) {
        res.sendFile(__dirname + '/public/index.html');
    }
    else {
        res.sendFile(__dirname + '/public/requester-login.html')
    }
});
var requestersRouter = require('./routes/requesters');
app.use('/requesters', requestersRouter);
var workersRouter = require('./routes/workers');
app.use('/workers', workersRouter);

// Test route to see if logged in and all working properly.
app.get('/good', isLoggedIn,  (req, res) => {res.send({message: 'You are logged in'})});
// Logs the user out.
app.get('/logout', (req,  res) => {
    req.session.destroy();
    res.redirect('/');
})

app.get('*', function(req, res){
  res.status(400).json({message: "File not found."});
});




app.listen(process.env.PORT, () => {
    console.log('listening');
});


module.exports = app;
