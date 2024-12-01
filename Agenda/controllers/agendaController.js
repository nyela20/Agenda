const Agenda = require('../models/agenda');
const User = require('../models/user');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');
const RendezVous = require('../models/rendezvous');

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

exports.exportAgenda = async (req, res, next) => {
  try {
    const agendaId = req.params.id;

    const agenda = await Agenda.findById(agendaId).populate('rendezVous');
    if (!agenda) return res.status(404).send("Agenda not found.");

    const exportDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const csvFilePath = path.join(exportDir, `agenda_${agendaId}.csv`);

    const csvWriter = createCsvWriter({
      path: csvFilePath,
      header: [
        { id: 'key', title: 'Key' },
        { id: 'value', title: 'Value' },
      ],
    });

    //boucle pour l agenda
    const records = [
      { key: 'Nom', value: agenda.nom },
      { key: 'Description', value: agenda.description || '' },
      { key: 'Date de Création', value: agenda.dateCreation.toISOString() },
      { key: 'Participants', value: agenda.participants.join(', ') },
      { key: 'Créateur Email', value: agenda.createurEmail },
      { key: 'Couleur', value: agenda.couleur },
    ];

    //boucle pour les rdv
    for (const rdvId of agenda.rendezVous) {
      const rdv = await RendezVous.findById(rdvId);
      if (rdv) {
        records.push(
            { key: 'RendezVous - Nom', value: rdv.nom },
            { key: 'RendezVous - Description', value: rdv.description || '' },
            { key: 'RendezVous - Date', value: rdv.dateRendezVous.toISOString() },
            { key: 'RendezVous - Participants', value: rdv.participants.join(', ') },
            { key: 'RendezVous - Durée', value: `${rdv.duree.heures}h ${rdv.duree.minutes}m` }
        );
      }
    }

    await csvWriter.writeRecords(records);
    res.download(csvFilePath);
  } catch (err) {
    console.error(err);
    next(err);
  }
};


exports.importAgenda = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    const filePath = req.file.path;
    const agendaData = {};
    const rendezVousData = [];

    // Parse le CSV
    fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (row) => {
          if (row.Key === 'Nom') agendaData.nom = row.Value;
          else if (row.Key === 'Description') agendaData.description = row.Value || '';
          else if (row.Key === 'Participants') agendaData.participants = row.Value.split(',').map(p => p.trim());
          else if (row.Key === 'Créateur Email') agendaData.createurEmail = row.Value;
          else if (row.Key === 'Couleur') agendaData.couleur = parseInt(row.Value, 10);
          else if (row.Key.startsWith('RendezVous')) {
            const field = row.Key.split(' - ')[1];
            if (!rendezVousData[rendezVousData.length - 1] || field === 'Nom') {
              rendezVousData.push({});
            }
            const currentRdv = rendezVousData[rendezVousData.length - 1];
            if (field === 'Nom') currentRdv.nom = row.Value;
            if (field === 'Description') currentRdv.description = row.Value || '';
            if (field === 'Date') currentRdv.dateRendezVous = new Date(row.Value);
            if (field === 'Participants') {
              currentRdv.participants = row.Value ? row.Value.split(',').map(p => p.trim()) : [];
            }
            if (field === 'Durée') {
              const [heures, minutes] = row.Value.split('h').map(str => parseInt(str.trim(), 10));
              currentRdv.duree = { heures, minutes };
            }
          }
        })
        .on('end', async () => {
          const newAgenda = new Agenda(agendaData);
          await newAgenda.save();

          // ajoute les rdv a l agenda
          for (const rdv of rendezVousData) {
            //console.log(rdv);
            const newRdv = new RendezVous({
              ...rdv,
              agenda: newAgenda._id,
              createurEmail: newAgenda.createurEmail, // Set creator's email from the agenda
            });
            await newRdv.save();

            newAgenda.rendezVous.push(newRdv._id);
          }
          console.log('RendezVous Data:', rendezVousData);
          await newAgenda.save();

          fs.unlinkSync(filePath);

          res.status(201).send('Agenda and rendezvous imported successfully!');
        });
  } catch (err) {
    console.error(err);
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
