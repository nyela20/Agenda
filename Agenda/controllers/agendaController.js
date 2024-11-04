const Agenda = require('../models/agenda'); 

// creation/sauvegarde agenda dans bdd
exports.creerAgenda = async (req, res) => {
  try {
    const { nom, description, participants, createurEmail, rendezVous } = req.body;
    const nouvelAgenda = new Agenda({
      nom,
      description,
      participants,
      createurEmail,
      rendezVous
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
        const agendas = await Agenda.find({ createurEmail: userEmailConnected }); 
        // passer la liste des agendas dans la vue
        res.render('agenda', { title: 'Liste des Agendas', agendas, userEmailConnected });
    } catch (error) {
        res.status(500).send('Erreur lors de la récupération des agendas' + localStorage.getItem('userEmail'));
    }
};

