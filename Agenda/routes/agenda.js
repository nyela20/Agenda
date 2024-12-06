const express = require('express');
const router = express.Router();
const agendaController = require('../controllers/agendaController');
//multer pour importer et exporter
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // Make sure this directory exists
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/json') {
            cb(null, true);
        } else {
            cb(new Error('Only JSON files are allowed'));
        }
    }
});

// afficher la page principale
router.get('/', agendaController.afficherAgendas);

// afficher le formulaire agenda
router.get('/creer' , function(req ,res){
    res.render('creeragenda', { title : 'Creation agenda', userEmailConnected : req.session.email});
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
    res.render('agendainfos', { title : 'Modifier agenda', agenda, agendaId , userEmailConnected : req.session.email});
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
router.post('/import', upload.single('file'), async (req, res, next) => {
    //console.log('import');
    //console.log('fichier :', req.file);
    await agendaController.importAgenda(req, res, next);
});


module.exports = router;
