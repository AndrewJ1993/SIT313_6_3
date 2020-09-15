var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
require('dotenv').config()

// Google login imports
// var passport = require('passport');
// var session = require('express-session');

var app = express();


// Database connection.
mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true, useFindAndModify: false});
var database = mongoose.connection;

// app.use
app.use(express.static('public'));
app.use(express.json());
app.use('/bootstrap-select-country', express.static(__dirname + '/node_modules/bootstrap-select-country/dist/'));
app.use(bodyParser.urlencoded({ extended: false }))

// Google login app.uses
// app.use(session({
//     cookie:{MaxAge: 1200000,
//     resave: false,
//     saveUninitialized: false,
//     secret: 'SampleSecret'}
// }))
// app.use(passport.initialize());
// app.use(passport.session());


// Routes.
app.get('/', (req, res) => {
    res.sendFile('public/index.html');
});
var requestersRouter = require('./routes/requesters');
app.use('/requesters', requestersRouter);
var workersRouter = require('./routes/workers');
app.use('/workers', workersRouter);
app.get('*', function(req, res){
  res.status(400).json({message: "File not found."});
});


app.listen(3000, () => {
    console.log('listening');
});


module.exports = app;
