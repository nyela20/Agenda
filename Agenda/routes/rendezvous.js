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
    const options = { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    const dateRendezVousFormatted = new Date(rendezvous.dateRendezVous).toLocaleDateString('fr-FR', options).replace(',', '');
    res.render('rendezvousinfos', { title: 'Informations sur le Rendez-vous', rendezvous, dateRendezVousFormatted,  agendaId, userEmailConnected: localStorage.getItem("userEmail") });
});

// suppression d'un rendez-vous
router.post('/:agendaId/supprimer/:rendezvousId', async function(req, res, next) {
    await rendezVousController.supprimerRendezVous(req, res, next);
});


// création d'un nouveau rendez-vouS
router.post('/:agendaId/creer', async function(req, res, next) {
    await rendezVousController.creerRendezVous(req, res, next);
});

module.exports = router;
