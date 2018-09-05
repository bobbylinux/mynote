const LocalStategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

//modello e schema per utenti
require("../models/utenti");
const Utenti = mongoose.model("utenti");

module.exports = function(passport) {
  passport.use(
    new LocalStategy({ usernameField: "email" }, (email, password, done) => {
      //verifica e-mail
      Utenti.findOne({
        email: email
      }).then(utente => {
        if (!utente) {
          return done(null, false, { message: "Utente non trovato" });
        }
        //verifica password
        bcrypt.compare(password, utente.password, (error, isMatch) => {
          if (error) {
            throw error;
          }

          if (isMatch) {
            return done(null, utente);
          } else {
            return done(null, false, { message: "password non corretta" });
          }
        });
      });
    })
  );

  passport.serializeUser(function(utente, done) {
    done(null, utente.id);
  });
  
  passport.deserializeUser(function(id, done) {
    Utenti.findById(id, function(err, utente) {
      done(err, utente);
    });
  });
};
