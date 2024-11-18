const express = require('express');
const router = express.Router();
const rendezVousController = require('../controllers/rendezvousController');

// afficher les rendez-vous de l'agenda
router.get('/:agendaId', rendezVousController.afficherRendezVous);

// afficher les rendez-vous de l'agenda
router.get('/:agendaId/jour', rendezVousController.afficherRendezVousJour);

// afficher les rendez-vous de l'agenda
router.get('/:agendaId/mois', rendezVousController.afficherRendezVousMois);

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
    dateRendezVous.setHours(dateRendezVous.getHours() + 1); // Heure d'ete 
    const dateRendezVousFormatted = dateRendezVous.toISOString().slice(0, 16);  // Récupère YYYY-MM-DDTHH:MM
    res.render('rendezvousinfos', 
        { title: 'Informations sur le Rendez-vous', 
            rendezvous, dateRendezVousFormatted,  
            agendaId, 
            userEmailConnected: localStorage.getItem("userEmail") });
});

// Nouvelle route pour gérer la récurrence
// router.get('/:agendaId/recurrents/:rendezvousId', async function(req, res) {
//     try {
//         const rendezvous = await rendezVousController.getRendezVousById(req);
//         if (rendezvous.estRecurrent) {
//             // Obtenir tous les rendez-vous de la série
//             const serieRendezVous = await rendezVousController.getSerieRendezVous(rendezvous);
//             res.json(serieRendezVous);
//         } else {
//             res.status(400).json({ message: "Ce rendez-vous n'est pas récurrent" });
//         }
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// });

// // création d'un nouveau rendez-vous (mise à jour pour gérer la récurrence)
// router.post('/:agendaId/creer', async function(req, res, next) {
//     try {
//         await rendezVousController.creerRendezVous(req, res, next);
//     } catch (error) {
//         console.error('Erreur lors de la création du rendez-vous:', error);
//         res.status(500).json({ 
//             message: 'Erreur lors de la création du rendez-vous',
//             error: error.message 
//         });
//     }
// });

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
