const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/requesters", {useNewUrlParser: true});

const db = mongoose.connection;
db.on("error", console.error.bind(console,  "Connection error"));
db.once("open", function () {
    // We're connected.
    const requesters_schema = new mongoose.Schema(
        {
            first_name: String, 
            last_name: String,
            email: String, 
            password: String, 
            address_line_1: String, 
            city: String, 
            state: String, 
            country: String, 
            postal_code: String
        }
    )
    const requesters = mongoose.model(requesters, requesters_schema);
    const andrew = new requesters({ first_name: "Andrew", last_name: "Jarrett", email: "ajarrett@deakin.edu.au", 
        password: "test123", address_line_1: "123 test st", city: "Melbourne", state: "VIC", country: "Australia", 
        postal_code: "3133" })
    
    andrew.save(function (err,  andrew) {
        if (err) return console.error(err);
    })
    
    requesters.find(function (err, requests) {
        if (err) return console.error(err);
        console.log(requests);j
    })
})
