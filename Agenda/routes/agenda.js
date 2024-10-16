const express = require('express');
const router = express.Router();
const agendaController = require('../controllers/agendaController');

// afficher la page principale
router.get('/', agendaController.afficherAgendas);

// afficher le formulaire agenda
router.get('/creer' , function(req ,res){
    res.render('creeragenda', { title : 'Creation agenda', userEmailConnected : localStorage.getItem("userEmail")});
});

// creation agenda
router.post('/creer' , async function(req ,res, next){
    await agendaController.creerAgenda(req, res, next);
});

module.exports = router;
