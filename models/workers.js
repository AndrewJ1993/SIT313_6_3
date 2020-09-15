var mongoose = require('mongoose');
var validator = require('validator');

var workersSchema = new mongoose.Schema({
    "first_name": {
        "type": "string",
        "required": "true"
    },
    "last_name": {
        "type": "string", 
        "required": true
    },
    "email": {
        "type": "string", 
        "required": true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is not valid');
            }
        }
    },
    "password": {
        "type": "string", 
        "required": true,
        validate(value) {
            if (!validator.isLength(value, 8)) {
                throw new Error('Password must be at least 8 characters');
            }
        }
    },
    "address_line_1": {
        "type": "string", 
        "required": true
    },
    "address_line_2": {
        "type": "string", 
        "required": false
    },
    "city": {
        "type": "string", 
        "required": true
    },
    "state": {
        "type": "string", 
        "required": true
    },
    "country": {
        "type": "string", 
        "required": true
    },
    "postal_code": {
        "type": "string", 
        "required": false,
    },
    "mobile_number": {
        "type": "string",
        "required": false,
        validate(value) {
            if (!validator.isMobilePhone(value)) {
                throw new Error('Mobile number is not valid');
            }
        }
    },
});

module.exports = mongoose.model('workers', workersSchema);