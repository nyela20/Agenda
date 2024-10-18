const express = require('express');
const router = express.Router();
const rendezVousController = require('../controllers/rendezvousController');

// afficher les rendez-vous de l'agenda
router.get('/:agendaId', rendezVousController.afficherRendezVous);

// afficher formulaire pour creer un rendez-vous
router.get('/:agendaId/creer', function(req, res) {
    const agendaId = req.params.agendaId; // récupérer l'ID de l'agenda
    res.render('creerrendezvous', { title: 'Création de Rendez-vous', agendaId, userEmailConnected: localStorage.getItem("userEmail") });
});

// affiche les paramètres d'un rendez-vous
router.get('/:agendaId/informations/:rendezvousId', async function(req, res, next) {
    const agendaId = req.params.agendaId; // récupérer l'ID de l'agenda
    const rendezvous = await rendezVousController.getRendezVousById(req, res, next);
    const dateRendezVous = new Date(rendezvous.dateRendezVous);
    dateRendezVous.setHours(dateRendezVous.getHours() + 2);
    const dateRendezVousFormatted = dateRendezVous.toISOString().slice(0, 16);  // Récupère YYYY-MM-DDTHH:MM
    res.render('rendezvousinfos', { title: 'Informations sur le Rendez-vous', rendezvous, dateRendezVousFormatted,  agendaId, userEmailConnected: localStorage.getItem("userEmail") });
});

// suppression d'un rendez-vous
router.post('/:agendaId/supprimer/:rendezvousId', async function(req, res, next) {
    await rendezVousController.supprimerRendezVous(req, res, next);
});

// modification d'un rendez-vous
router.post('/:agendaId/modifier/:rendezvousId', async function(req, res, next) {
    await rendezVousController.modifierRendezVous(req, res, next);
});


// création d'un nouveau rendez-vouS
router.post('/:agendaId/creer', async function(req, res, next) {
    await rendezVousController.creerRendezVous(req, res, next);
});

module.exports = router;
