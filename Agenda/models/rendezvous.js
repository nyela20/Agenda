const mongoose = require('mongoose');

// Schéma pour les rendez-vous
const rendezVousSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true,
    unique : true
  },
  description: {
    type: String,
    trim: true
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateRendezVous: {
    type: Date,  // format de date pour le rendez-vous
    required: true
  },
  participants: {
    type: [String],  //(emails)
  },
  createurEmail: {
    type: String,
    required: true,
    trim: true,
    //match: [/.+@.+\..+/, 'Email invalide
  },
  agenda: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agenda',  // référence à l'agenda
    required: true
  },
  duree: {
    heures: {
      type: Number,  // nombre d'heures
      required: true
    },
    minutes: {
      type: Number,  // nombre de minutes
      required: true
    }
  },
  couleur :{
    type : Number,
    required : true
  },
  // champs pour la récurrence , RDV
  estRecurrent :{
    type : Boolean,
    default: false 
  },
  typeRecurrence:{
    type : String,
    enum: ['aucun' , 'quotidien' , 'semaine' , 'mensuel'],
    default: 'aucun'
  },
  finRecurrence:{
    type: Date,
    required : function(){
      return this.estRecurrent;
    }
  }
});

const RendezVous = mongoose.model('RendezVous', rendezVousSchema);
module.exports = RendezVous;
