var express = require('express');
var router = express.Router();
var Requesters = require('../models/requesters');
var mailchimp = require("@mailchimp/mailchimp_marketing");
var bcrypt = require('bcrypt');

var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuthStrategy;

// Use the GoogleStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a token, tokenSecret, and Google profile), and
//   invoke a callback with a user object.
passport.use(new GoogleStrategy({
    consumerKey: GOOGLE_CONSUMER_KEY,
    consumerSecret: GOOGLE_CONSUMER_SECRET,
    callbackURL: "http://www.example.com/auth/google/callback"
  },
  function(token, tokenSecret, profile, done) {
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return done(err, user);
      });
  }
));

mailchimp.setConfig({
  apiKey: "fac41340a0196786da6ef7c3ddc17a13-us17",
  server: "us17"
});

// Creating an item.
router.post('/', checkEmail, async (req, res) => {
    if (req.body.password == req.body.confirm) {
        var hash = bcrypt.hashSync(req.body.password, 10);
        var requester = new Requesters({
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email,
            password: hash,
            address_line_1: req.body.address_line_1,
            address_line_2: req.body.address_line_2,
            city: req.body.city,
            state: req.body.state,
            country: req.body.country,
            postal_code: req.body.postal_code,
            mobile_number: req.body.mobile_number
        })
        try {
            // Basic information for MailChimp.
            const listId = "0be15b2fdb";
            const subscribingUser = {
              firstName: req.body.first_name,
              lastName: req.body.last_name,
              email: req.body.email
            };
            
            // This checks if the checkEmail function returned an object. If it's null, this means 
            // the email is not already in the database and a new account gets saved to the database 
            // and added to mail chimp.
            if (res.checkRequester == null) {
                var newRequester = await requester.save();
                addToEmailList(listId,  subscribingUser);
                await res.status(201).json({message: "Success"});
            }
            else {
                res.status(400).json({message: "Email already has an account associated with it."});
            }

        } 
        catch (error) {
            await res.status(400).json({message: error.message});
        }
    }
    else {
        await res.status(400).json({message: "Password and confirm password do not match"});
    }
});

router.get('/', async (req, res) => {
    try {
        var requesters = await Requesters.find();
        res.json(requesters);
    }
    catch (error) {
        res.status(500).json({message: error.message});
    }
})

// Post function that is used to check whether the email and password combination exists in the
// mongo data base.
router.post('/:email', checkEmail, (req, res) => {
    if (bcrypt.compareSync(req.body.password, res.checkRequester.password)) {
        res.send("You are logged in");
    }
    else {
        res.send("Login failed.");
    }
})


async function addToEmailList(listId, subscribingUser) {
    const response = await mailchimp.lists.addListMember(listId, {
        email_address: subscribingUser.email,
        status: "subscribed",
        merge_fields: {
            FNAME: subscribingUser.firstName,
            LNAME: subscribingUser.lastName
        }
    }); 

    console.log(
        `Successfully added contact as an audience member. The contact's id is ${
            response.id
        }.`
    );
}

// Ensures the email isn't already in the database. This helps prevent bad requests to mail
// chimp and adding users to the database that already have an account.
async function checkEmail(req, res, next) {
    try {
        var checkRequester = await Requesters.findOne({email: req.body.email});
    }
    catch (error) {
        return res.status(500).json({message: error.message});
    }
    res.checkRequester = checkRequester;
    next();
}


module.exports = router;
