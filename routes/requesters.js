var express = require('express');
var router = express.Router();
var Requesters = require('../models/requesters');
var mailchimp = require("@mailchimp/mailchimp_marketing");
var bcrypt = require('bcrypt');
var md5 = require('md5');
var crypto = require('crypto');
require('../passport-setup');
var passport = require('passport');


mailchimp.setConfig({
  apiKey: "fac41340a0196786da6ef7c3ddc17a13-us17",
  server: "us17"
});

const listId = "0be15b2fdb";


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
        await res.json(requesters);
    }
    catch (error) {
        res.status(500).json({message: error.message});
    }
})


// GET /google/auth
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
router.get('/google/auth',
    passport.authenticate('google', { failureRedirect: '/requester-login.html' }),
    function(req, res) {
        res.redirect('/index.html');
    });




router.post('/:email', passport.authenticate('local',  {
    failureRedirect: '/requester-login.html'

}), function (req, res) {
    if (req.body.save) {
        req.session.cookie.maxAge = 365 * 24 * 60 * 60 * 1000;
        console.log(req.session.cookie.maxAge);
    }
    res.redirect('/');
});

router.post('/reset-password/:email', checkEmail, async(req, res) => {
    if (res.checkRequester) {
        var subscriberEmail = res.checkRequester.email
        var token = crypto.randomBytes(20).toString('hex');
        var subscriberHash = md5(subscriberEmail.toLowerCase());
        var options = {
            name: "reset_password",
            properties: {
                subscriberEmail,
                token
        }
    };
        res.checkRequester.reset_email_token = token;
        console.log("token set: " + res.checkRequester.reset_email_token);
        
        var changedRequester = await res.checkRequester.save();
        resetPasswordEvent(subscriberHash, options);
        
    }
    res.send('Reset password email sent.<br><a href="/requester-login.html">Back to Login</a>');
})


router.post('/password-confirm/:email', async(req, res) => {
    try {
        var requester = await Requesters.findOne({email: req.params.email});
        if (requester.reset_email_token == req.body.token) {
            // Checks that the new password is the same as confirm password.
            if (req.body.password != null || req.body.confirm != null) {
                if (req.body.password == req.body.confirm) {
                    if (req.body.password.length >= 8) {
                        requester.password = bcrypt.hashSync(req.body.password, 10);
                        var changedRequester = await requester.save();
                        await res.redirect('/requester-login.html');
                    }
                    else {
                        await res.status(400).json({message: "Password must be at least 8 characters in length."})
                    }
                } else {
                    await res.status(400).json({message: "Password and confirm password do not match"});
                    return;
                }
            }
        }
        else {
            res.send("Token is out of date. Reset password again.");
        }
    }
    catch (error) {
        await res.status(500).json({message: error.message});
    }
})

async function resetPasswordEvent(subscriberHash, options) {
  var response = await mailchimp.lists.createListMemberEvent(
    listId,
    subscriberHash,
    options
  );
}



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
