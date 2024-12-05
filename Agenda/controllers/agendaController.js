const Agenda = require('../models/agenda');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');
const RendezVous = require('../models/rendezvous');
const User = require('../models/user');

// creation/sauvegarde agenda dans bdd
exports.creerAgenda = async (req, res) => {
  try {
    const { nom, description, couleur, participants, createurEmail, rendezVous } = req.body;
    const nouvelAgenda = new Agenda({
      nom,
      description,
      participants,
      createurEmail,
      rendezVous,
      couleur : couleur
    });
    const agendaSauvegarde = await nouvelAgenda.save();
    // réponse  réussie
    res.redirect('/agenda'); // rediger vers la page principale
  } catch (error) {
    // réponse erreurs
    res.status(500).json({
      message: 'Erreur lors de la création de l\'agenda',
      error: error.message
    });
  }
};

// pour afficher la page des agendas (Page principale)
exports.afficherAgendas = async (req, res) => {
    try {
        const userEmailConnected = localStorage.getItem('userEmail');

        // récuperer les agendas depuis la bdd
        const agendasCrees = await Agenda.find({ createurEmail: userEmailConnected }); 
        // Récupérer les agendas partagés avec l'utilisateur
        const agendasPartages = await Agenda.find({
          'partages.email': userEmailConnected
        });
        // Combiner les deux listes
        const agendas = [...agendasCrees, ...agendasPartages];


        // passer la liste des agendas dans la vue
        res.render('agenda', { 
          title: 'Liste des Agendas', 
          agendas, 
          userEmailConnected,
          agendasCrees,
          agendasPartages
        });
    } catch (error) {
        res.status(500).send('Erreur lors de la récupération des agendas' + localStorage.getItem('userEmail'));
    }
};



// partager agenda
exports.partagerAgenda = async(req, res) => {
  try {
    const agendaId = req.params.agendaId;
    const { emailPartage } = req.body;
    const userEmailConnected = req.body.userEmailConnected;

    // Vérifier si l'agenda existe
    const agenda = await Agenda.findById(agendaId);
    
    // Récupérer les agendas pour le rendu 
    const agendasCrees = await Agenda.find({ createurEmail: userEmailConnected });
    const agendasPartages = await Agenda.find({ 'partages.email': userEmailConnected });

    if (!agenda) {
      return res.render('agenda', {
        userEmailConnected,
        agendasCrees,
        agendasPartages,
        error: 'Agenda non trouvé'
      });
    }

    // Vérifier si l'utilisateur est le créateur
    if (agenda.createurEmail !== userEmailConnected) {
      return res.render('agenda', {
        userEmailConnected,
        agendasCrees,
        agendasPartages,
        error: 'Non autorisé à partager cet agenda'
      });
    }

    // Vérifier si l'utilisateur essaie de partager avec lui-même
    if(emailPartage === userEmailConnected) {
      return res.render('agenda', {
        userEmailConnected,
        agendasCrees,
        agendasPartages,
        error: 'Vous ne pouvez pas partager l\'agenda avec vous-même'
      });
    }

    // Vérifier si l'agenda est déjà partagé avec cet utilisateur
    const partageExistant = agenda.partages.find(p => p.email === emailPartage);
    if (partageExistant) {
      return res.render('agenda', {
        userEmailConnected,
        agendasCrees,
        agendasPartages,
        error: 'Agenda déjà partagé avec cet utilisateur'
      });
    }

    let userPartage = await User.findOne({"email": emailPartage });
    console.log(userPartage.blocked);
    //teste si l'utilisateur cible à bloqué l'utilisateur connecté avant le partage
    if(userPartage.blocked.includes(userEmailConnected)){
      return res.render('agenda', {
        userEmailConnected,
        agendasCrees,
        agendasPartages,
        error: 'Cet utilisateur vous à bloqué'
      });
    }
    
    let userConnected = await User.findOne({"email": userEmailConnected});
    //teste si l'utilisateur connecté à bloqué l'utilisateur
    if(userConnected.blocked.includes(emailPartage)){
      return res.render('agenda', {
        userEmailConnected,
        agendasCrees,
        agendasPartages,
        error: 'Vous avez bloqué cet utilisateur'
      });
    }
    

    // Ajouter le partage
    agenda.partages.push({ email: emailPartage });
    await agenda.save();

    res.redirect('/agenda');

  } catch(error) {
    
    return res.render('agenda', {
      userEmailConnected,
      agendasCrees,
      agendasPartages,
      error: 'Erreur lors du partage de l\'agenda'
    });
  }
};


// Annuler le partage d'un agenda
exports.annulerPartage = async (req, res) => {
  try {
    const agendaId = req.params.agendaId;
    const { emailPartage } = req.body;
    
    // Vérifier si l'agenda existe
    const agenda = await Agenda.findById(agendaId);
    if (!agenda) {
      return res.status(404).json({ message: 'Agenda non trouvé' });
    }

    // Vérifier si l'utilisateur est le créateur
    if (agenda.createurEmail !== req.body.userEmailConnected) {
      return res.status(403).json({ message: 'Non autorisé à modifier les partages' });
    }

    // Retirer le partage
    agenda.partages = agenda.partages.filter(p => p.email !== emailPartage);
    await agenda.save();

    if(req.params.blocage){
      return true;
    }

    res.redirect('/agenda');
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de l\'annulation du partage',
      error: error.message
    });
  }
};

// suppression d un agenda dans la BDD
exports.supprimerAgenda = async (req, res) => {
  try {
    const agendaId = req.params.id;

    const agenda = await Agenda.findById(agendaId);
    if (!agenda) {
      return res.status(404).json({
        message: 'Agenda non trouvé'
      });
    }

    const userEmail = localStorage.getItem('userEmail');
    if (agenda.createurEmail !== userEmail) {
      return res.status(403).json({
        message: 'Vous n\'avez pas les droits pour supprimer cet agenda'
      });
    }

    await Agenda.findByIdAndDelete(agendaId);
    res.redirect('/agenda');

  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la suppression de l\'agenda',
      error: error.message
    });
  }
};

// modifier un agenda 
exports.modifierAgenda = async (req, res) => {
  try {

    const { nom, description } = req.body;

    // recherche de l'agenda s
    const agenda = await Agenda.findById(req.params.agendaId);
    if (!agenda) {
      return res.status(404).json({ message: 'Agenda non trouvé' });
    }

    // maj des champs nom description
    const agendaMisAJour = await Agenda.findByIdAndUpdate(
      req.params.agendaId,
      { $set: { nom, description } },
      { new: true }
    );

    if (!agendaMisAJour) {
      return res.status(404).json({ message: 'Agenda non trouvé' });
    }

    // redirection si modification reussie
    res.redirect('/agenda'); // rediger vers la page principale
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la modification de l\'agenda', error: error.message });
  }
};


//Export de l agenda
exports.exportAgenda = async (req, res, next) => {
  try {
    const agendaId = req.params.id;
    const agenda = await Agenda.findById(agendaId);

    if (!agenda) {
      return res.status(404).send("Aucun agenda ne correspond a cet id");
    }

    // recuperation des rdv de l agenda a exporter
    const rendezVousList = await RendezVous.find({ agenda: agendaId });

    // creer l objet a exporter
    const exportData = {
      nom: agenda.nom,
      description: agenda.description,
      dateCreation: agenda.dateCreation,
      participants: agenda.participants,
      createurEmail: agenda.createurEmail,
      couleur: agenda.couleur,
      partages: agenda.partages,
      rendezVous: rendezVousList.map(rdv => ({
        nom: rdv.nom,
        description: rdv.description,
        dateCreation: rdv.dateCreation,
        dateRendezVous: rdv.dateRendezVous,
        participants: rdv.participants,
        createurEmail: rdv.createurEmail,
        duree: rdv.duree,
        couleur: rdv.couleur,
        estRecurrent: rdv.estRecurrent,
        typeRecurrence: rdv.typeRecurrence,
        accepte: rdv.accepte,
        refuse: rdv.refuse,
        finRecurrence: rdv.finRecurrence
      }))
    };

    // creer le dossier export s il n existe pas
    /*const exportDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }*/

    // enregistre le fichier en JSON
    const jsonFilePath = path.join(exportDir, `agenda_${agendaId}.json`);
    fs.writeFileSync(jsonFilePath, JSON.stringify(exportData, null, 2));

    // telecharge le fichier dans le navigateur
    res.download(jsonFilePath, `agenda_${agenda.nom}.json`, (err) => {
      // suppression du fichier apres envoi
      fs.unlinkSync(jsonFilePath);
      if (err) {
        next(err);
      }
    });

  } catch (err) {
    console.error(err);
    next(err);
  }
};


// Import de l agenda
exports.importAgenda = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).send('Pas de fichier selectionne');
    }

    // parse le json
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const importData = JSON.parse(fileContent);

    // creation de lagenda
    const newAgenda = new Agenda({
      nom: importData.nom,
      description: importData.description,
      participants: importData.participants,
      createurEmail: importData.createurEmail,
      couleur: importData.couleur,
      partages: importData.partages || [],
      rendezVous: []
    });

    const savedAgenda = await newAgenda.save();

    // creation des rdv
    const rendezVousPromises = importData.rendezVous.map(async rdvData => {
      const newRdv = new RendezVous({
        nom: rdvData.nom,
        description: rdvData.description,
        dateCreation: new Date(rdvData.dateCreation),
        dateRendezVous: new Date(rdvData.dateRendezVous),
        participants: rdvData.participants,
        createurEmail: rdvData.createurEmail,
        agenda: savedAgenda._id,
        duree: rdvData.duree,
        couleur: rdvData.couleur,
        estRecurrent: rdvData.estRecurrent,
        typeRecurrence: rdvData.typeRecurrence,
        accepte: rdvData.accepte,
        refuse: rdvData.refuse,
        finRecurrence: rdvData.finRecurrence ? new Date(rdvData.finRecurrence) : undefined
      });

      const savedRdv = await newRdv.save();
      return savedRdv._id;
    });
    const rendezVousIds = await Promise.all(rendezVousPromises);

    savedAgenda.rendezVous = rendezVousIds;
    await savedAgenda.save();

    // clean up du fichier upload
    fs.unlinkSync(req.file.path);

    return res.redirect('/agenda');

  } catch (err) {
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Echec de l import:', err);
    next(err);
  }
};


// getAgenda
exports.getAgenda = async (req, res, next, agendaId) => {
  try{
    const agenda = await Agenda.findById(agendaId);
    if (!agenda) {
      return res.status(404).json({ message: 'Agenda non trouvé' });
    }
    return agenda;
  } catch (err) {
    res.status(500).json({ message: 'Erreur agenda inexistant', error: error.message });
  }
}
