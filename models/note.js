const mongoose = require('mongoose');

const noteSchema = mongoose.Schema({
    titolo: {
        type: String,
        require: true
    }, 
    contenuto: {
        type: String,
        required: true
    },
    utente: {
        type: String,
        required: true
    },
    data: {
        type: Date, 
        default: Date.now
    }
});

mongoose.model('note', noteSchema);