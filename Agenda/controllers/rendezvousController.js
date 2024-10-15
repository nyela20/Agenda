const RendezVous = require('../models/rendezvous.js'); 
const Agenda = require('../models/agenda.js'); 

// Fonction pour créer un rendez-vous et le sauvegarder dans la base de données
exports.creerRendezVous = async (req, res) => {
  try {
    const { nom, description, dateRendezVous, participants, createurEmail } = req.body;
    
    const agenda = await Agenda.findById(req.params.agendaId);

    // créer un nouveau rendez-vous
    const nouveauRendezVous = new RendezVous({
      nom,
      description,
      dateRendezVous,
      participants,
      createurEmail,
      agenda: agenda 
    });

    // sauvegarde
    const rendezVousSauvegarde = await nouveauRendezVous.save();

    // ajoute le rendez-vous à l'agenda correspondant
    await Agenda.findByIdAndUpdate(agenda._id, {
      $push: { rendezVous: rendezVousSauvegarde._id }
    });

    // redirection
    res.redirect('/rendezvous/'+agenda._id);
  } catch (error) {
    // Réponse erreur
    res.status(500).json({
      message: 'Erreur lors de la création du rendez-vous ' + JSON.stringify(req.params),
      error: error.message
    });
  }
};

// Fonction pour afficher les rendez-vous d'un agenda
exports.afficherRendezVous = async (req, res) => {
  try {
    const agendaId = req.params.agendaId;

    // Récupérer l'agenda
    const agenda = await Agenda.findById(agendaId);

    //TODO recuperer les rendez vous des agendas pour les afficher 

    if (!agenda) {
        return res.status(401).send('Agenda non trouvé : ' + agendaId + ' et req.params : ' + JSON.stringify(req.params));
    }

    // les parametres du mois courant
    const date = new Date();
    const mois = new Intl.DateTimeFormat('fr-FR',{ month: 'long' }).format(date);
    const nombreTotalDeJourMois = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(); // nombre total de jours dans le mois
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay(); // premier jour du mois (0 = dimanche, 1 = lundi, mardi = 2, ...)
    const startingCell = (firstDay === 0) ? 6 : firstDay - 1; // ajuster pour le calendrier (dimanche = 6)
   
    res.render('rendezVous', { agenda, date , mois, nombreTotalDeJourMois, startingCell}); // Render the view with the agenda and its rendez-vous
  } catch (error) {
    res.status(500).send('Erreur lors de la récupération des rendez-vous');
  }
};
