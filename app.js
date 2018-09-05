const express = require("express"); //importo express
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const override = require("method-override");
const flash = require("connect-flash");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const mongoose = require("mongoose");

const { accessoSicuro } = require("./helpers/accesso_privato");

const app = express();
const port = 3000;

//Cartelle per gestione delle risorse statiche.
app.use("/css", express.static(__dirname + "/assets/css"));
app.use("/img", express.static(__dirname + "/assets/img"));

//integrazione file configurazione passport
require("./config/passport")(passport);

//Connessione a Mongoose
mongoose.Promise = global.Promise;
mongoose
  .connect(
    "mongodb://127.0.0.1:27017/note",
    { useNewUrlParser: true }
  )
  .then(() => {
    console.log("database connesso");
  })
  .catch(error => {
    console.log(error);
  });

//Schema e modello
require("./models/note");
const Note = mongoose.model("note");
require("./models/utenti");
const Utenti = mongoose.model("utenti");

//Middleware per HandleBars
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

//Middleware per bodyParser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Middleware method-override
app.use(override("_method"));

//Middleware di express-session
app.use(
  session({
    secret: "keyboard cat",
    resave: true,
    saveUninitialized: true
  })
);

//Middleware per messaggi flash
app.use(flash());

//Middleware passportjs
app.use(passport.initialize());
app.use(passport.session());

//Variabili globali per messaggi flash
app.use((request, response, next) => {
  response.locals.msg_successo = request.flash("msg_successo");
  response.locals.msg_errore = request.flash("msg_errore");
  response.locals.error = request.flash("error");
  response.locals.user = request.user;
  next();
});

//Route per pagina index
app.get("/", (request, response) => {
  const titolo = "Benvenuto";
  response.render("index", { titolo });
});

//Route per pagina lista note
app.get("/lista_note", accessoSicuro, (request, response) => {
  Note.find({ utente: request.user.id })
    .sort({ date: "desc" })
    .then(note => {
      response.render("lista_note", { note: note });
    });
});

//Route per pagina modifica nota
app.get("/modifica_nota/:id", accessoSicuro, (request, response) => {
  Note.findOne({ _id: request.params.id }).then(nota => {
    if (nota.utente != request.user.id) {
      request.flash("msg_errore", "Non puoi vedere questi contenuti");
      response.redirect("/lista_note");
    } else {
      response.render("modifica_nota", { nota: nota });
    }
  });
});

//Route per pagina info
app.get("/info", (request, response) => {
  response.render("info");
});

//Route per pagina aggiungi nota
app.get("/aggiungi_nota", accessoSicuro, (request, response) => {
  response.render("aggiungi_nota");
});

//Route per pagina login
app.get("/login", (request, response) => {
  response.render("login");
});

//Route per pagina registrazione
app.get("/registrazione", (request, response) => {
  response.render("registrazione");
});

//Route per form aggiunta nota
app.post("/aggiungi_nota", accessoSicuro, (request, response) => {
  let errori = [];
  if (!request.body.titolo) {
    errori.push({ text: "Devi riempire questo campo titolo" });
  }

  if (!request.body.contenuto) {
    errori.push({ text: "Devi riempire questo campo contenuto" });
  }

  if (errori.length > 0) {
    response.render("aggiungi_nota", {
      errori: errori,
      titolo: request.body.titolo,
      contenuto: request.body.contenuto
    });
  } else {
    const nuovaNota = {
      titolo: request.body.titolo,
      contenuto: request.body.contenuto,
      utente: request.user.id
    };

    new Note(nuovaNota).save().then(note => {
      request.flash("msg_successo", "Nota aggiunta correttamente");
      response.redirect("/lista_note");
    });
  }
});

//gestione del form: aggiorna
app.post("/lista_note/:id", accessoSicuro, (request, response) => {
  Note.findOne({ _id: request.params.id }).then(nota => {
    nota.titolo = request.body.titolo;
    nota.contenuto = request.body.contenuto;

    nota.save().then(nota => {
      request.flash("msg_successo", "Nota aggiornata correttamente");
      response.redirect("/lista_note");
    });
  });
});

//gestione per eliminazione documento
app.delete("/lista_note/:id", accessoSicuro, (request, response) => {
  Note.deleteOne({
    _id: request.params.id
  }).then(nota => {
    request.flash("msg_successo", "Nota cancellata correttamente");
    response.redirect("/lista_note");
  });
});

//gestione form registrazione
app.post("/registrazione", (request, response) => {
  let errori = [];
  if (request.body.password != request.body.conferma_password) {
    errori.push({ text: "Le due password non corrispondono" });
  }

  if (request.body.password.length < 6) {
    errori.push({ text: "La password deve essere di almeno 6 caratteri" });
  }

  if (errori.length > 0) {
    response.render("registrazione", {
      errori: errori,
      nome: request.body.nome,
      cognome: request.body.cognome,
      email: request.body.email,
      password: request.body.password,
      conferma_password: request.body.conferma_password
    });
  } else {
    Utenti.findOne({ email: request.body.email }).then(utente => {
      if (utente) {
        request.flash(
          "msg_errore",
          "E' già presente un utente con questa e-mail all'interno del sistema"
        );
        response.redirect("/registrazione");
      } else {
        const nuovoUtente = new Utenti({
          nome: request.body.nome,
          cognome: request.body.cognome,
          email: request.body.email,
          password: request.body.password
        });
        bcrypt.genSalt(10, (error, salt) => {
          bcrypt.hash(nuovoUtente.password, salt, (error, hash) => {
            if (error) throw error;
            nuovoUtente.password = hash;
            nuovoUtente
              .save()
              .then(utente => {
                request.flash(
                  "msg_successo",
                  "Utente registrato correttamente."
                );
                response.redirect("/login");
              })
              .catch(error => {
                console.log(error);
                return;
              });
          });
        });
      }
    });
  }
});

//gestione form di login
app.post("/login", (request, response, next) => {
  passport.authenticate("local", {
    successRedirect: "/lista_note",
    failureRedirect: "/login",
    failureFlash: true
  })(request, response, next);
});

app.listen(port, () => {
  console.log(`server attivato sulla porta ${port}`);
});

//gestione logout
app.get("/logout", accessoSicuro, (request, response) => {
  request.logout();
  request.flash(
    "msg_successo",
    "Sei disconnesso. Ciao, alla prossima sessione"
  );
  response.redirect("/");
});

//uso di base di middleware
/*app.use((request, response, next) => {
    request.saluto = "io sono la prima app in node, ciao";
    next();
});

app.get('/', (request, response) => {
    response.send(request.saluto);
});*/
