const mongoose = require('mongoose');

// schéma pour un agenda
const agendaSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,  
    trim: true
  },
  description: {
    type: String,
    trim: true 
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  participants: {
    type: [String], 
  },
  createurEmail: {
    type: String,
    required: true,
    trim: true,
    //match: [/.+@.+\..+/, 'Email invalide'] 
  },
  rendezVous: [{
    type: [String]
  }],
  // champ pour partager un agenda
  partages : [{
    email: {
      type: String,
      trim : true
    }
  }]
});

const Agenda = mongoose.model('Agenda', agendaSchema);
module.exports = Agenda;
