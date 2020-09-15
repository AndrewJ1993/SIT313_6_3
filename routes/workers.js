var express = require('express');
var router = express.Router();
var Workers = require('../models/workers')
var bcrypt = require('bcrypt');


// Add worker.
router.post('/', checkEmail, async (req, res) => {
    if (req.body.password == req.body.confirm) {
        var hash = bcrypt.hashSync(req.body.password, 10);
        var worker = new Workers({
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

            // This checks if the checkEmail function returned an object. If it's null, this means 
            // the email is not already in the database and a new account gets saved to the database 
            // and added to mail chimp.
            if (res.checkWorker == null) {
                var newWorker = await worker.save();
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


// Get all workers in database.
router.get('/', async (req, res) => {
    try {
        var workers = await Workers.find();
        res.json(workers);
    }
    catch (error) {
        res.status(500).json({message: error.message});
    }
})


// Delete all workers from database.
router.delete('/', async (req, res) => {
    try {
        await Workers.deleteMany({}, function (err, result) {
            if (err) {
                res.status(500).json({message: err.message});
            }
            else {
                res.status(200).json({message: "There is nothing currently in the database."});
            }
        });
    }
    catch {
        res.status(500).json({message: error.message});
    }
})


// Get a specific worker from the database.
router.get('/:id', async (req, res) => {
    try {
        var worker = await Workers.findById(req.params.id);
        res.json(worker);
    }
    catch (error) {
        return res.status(500).json({message: error.message});
    }
})


// Update a worker. Essentially works the same as post but updates an existing entry rather than create a new one.
// Any field will be updated if it is not null.
router.patch('/:id', async (req, res) => {
    try {
        var worker = await Workers.findById(req.params.id);
        // Checks that the new password is the same as confirm password.
        if (req.body.password != null || req.body.confirm != null) {
            if (req.body.password == req.body.confirm) {
                worker.password = bcrypt.hashSync(req.body.password, 10);
            }
            else {
                await res.status(400).json({message: "Password and confirm password do not match"});
                return;
            }
        }
        if (req.body.first_name != null) {
            worker.first_name = req.body.first_name;
        }
        if (req.body.last_name != null) {
            worker.last_name = req.body.last_name;
        }
        if (req.body.email != null) {
            worker.email = req.body.email;
        }
        if (req.body.address_line_1 != null) {
            worker.address_line_1 = req.body.address_line_1;
        }
        if (req.body.address_line_2 != null) {
            worker.address_line_2 = req.body.address_line_2;
        }
        if (req.body.city != null) {
            worker.city = req.body.city;
        }
        if (req.body.state != null) {
            worker.state = req.body.state;
        }
        if (req.body.country != null) {
            worker.country = req.body.country;
        }
        if (req.body.postal_code != null) {
            worker.postal_code = req.body.postal_code;
        }
        if (req.body.mobile_number != null) {
            worker.mobile_number = req.body.mobile_number;
        }
        
        var changedWorker = await worker.save();
        await res.status(201).json({message: "Success"});
    }
    catch (error) {
        await res.status(500).json({message: error.message});
    }
})


router.delete('/:id', async (req, res) => {
    try {
        await Workers.findByIdAndRemove(req.params.id, function (err, result) {
            if (err) {
                res.status(500).json({message: err.message});
            }
            else {
                res.status(200).json({message: "A worker with that id doesn't exist in the database."});
            }
        });
    }
    catch {
        res.status(500).json({message: error.message});
    }
})

// Ensures the email isn't already in the database. This helps prevent bad requests.
async function checkEmail(req, res, next) {
    try {
        var checkWorker = await Workers.findOne({email: req.body.email});
    }
    catch (error) {
        return res.status(500).json({message: error.message});
    }
    res.checkWorker = checkWorker;
    next();
}

module.exports = router;
