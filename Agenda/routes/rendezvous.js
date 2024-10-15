const express = require('express');
const router = express.Router();
const rendezVousController = require('../controllers/rendezvousController');

// afficher les rendez-vous de l'agenda
router.get('/:agendaId', rendezVousController.afficherRendezVous);

// afficher formulaire pour creer un rendez-vous
router.get('/:agendaId/creer', function(req, res) {
    const agendaId = req.params.agendaId; // récupérer l'ID de l'agenda
    res.render('creerRendezVous', { title: 'Création de Rendez-vous', agendaId, userEmailConnected: localStorage.getItem("userEmail") });
});

// création d'un nouveau rendez-vous
router.post('/:agendaId/creer', async function(req, res, next) {
    await rendezVousController.creerRendezVous(req, res, next);
});

module.exports = router;
