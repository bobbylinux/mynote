const LocalStategy = require('passport-local').Strategy;
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

//modello e schema per utenti
require("../models/utenti");
const Utenti = mongoose.model("utenti");

module.exports = function(passport) {
    passport.use(new LocalStategy({usernameField: 'email'}, (email, password, done) => {
        console.log(password);
    }));
}