const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const utentiSchema = new Schema({
    nome: {
        type: String,
        require: true
    }, 
    cognome: {
        type: String,
        required: true
    },
    email: {
        type: String, 
        required: true
    },
    password: {
        type: String, 
        required: true
    }
});

mongoose.model('utenti', utentiSchema);