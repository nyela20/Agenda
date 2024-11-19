const Agenda = require('../models/agenda'); 

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
exports.partagerAgenda = async(req , res) =>{
  try{

    const agendaId = req.params.agendaId;
    const { emailPartage } = req.body;
    
    // Vérifier si l'agenda existe
    const agenda = await Agenda.findById(agendaId);
    if (!agenda) {
      return res.status(404).json({ message: 'Agenda non trouvé' });
    }

    // Vérifier si l'utilisateur est le créateur
    if (agenda.createurEmail !== req.body.userEmailConnected) {
      return res.status(403).json({ message: 'Non autorisé à partager cet agenda' });
    }

    // Vérifier si l'agenda est déjà partagé avec cet utilisateur
    const partageExistant = agenda.partages.find(p => p.email === emailPartage);
    if (partageExistant) {
      return res.status(400).json({ message: 'Agenda déjà partagé avec cet utilisateur' });
    }

    // Ajouter le partage
    agenda.partages.push({ email: emailPartage });
    await agenda.save();

    res.redirect('/agenda');

  }catch(error){
    res.status(500).json({
      message: 'Erreur lors du partage de l\'agenda',
      error: error.message
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
