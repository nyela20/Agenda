const express = require('express');
const router = express.Router();
const agendaController = require('../controllers/agendaController');
//multer pour importer et exporter
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });


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

// suppression agenda
router.get('/supprimer/:id', async function(req, res, next) {
    await agendaController.supprimerAgenda(req, res, next);
});

// Routes pour le partage
router.post('/:agendaId/partager', agendaController.partagerAgenda);
router.post('/:agendaId/annuler-partage', agendaController.annulerPartage);

// route modifier formulaire
router.get('/:agendaId/modifier' , async function(req ,res, next){
    const agendaId = req.params.agendaId;
    const agenda = await agendaController.getAgenda(req, res,next,  agendaId)
    res.render('agendainfos', { title : 'Modifier agenda', agenda, agendaId , userEmailConnected : localStorage.getItem("userEmail")});
});

// route appliquer modif
router.post('/:agendaId/modifier' , async function(req ,res, next){
    await agendaController.modifierAgenda(req, res, next);
});


// route export agenda
router.get('/export/:id', async function (req, res, next) {
    await agendaController.exportAgenda(req, res, next);
});

// route import agenda
router.post('/import', upload.single('file'), async function (req, res, next) {
    await agendaController.importAgenda(req, res, next);
});


module.exports = router;
