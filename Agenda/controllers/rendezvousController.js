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
    const agenda = await Agenda.findById(agendaId);
    const rendezVousList = await RendezVous.find({ agenda: agendaId });  // les rendez-vous de cet agenda

    if (!agenda) {
      return res.status(401).send('Agenda non trouvé : ' + agendaId);
    }

    // la date et l'heure a afficher
    let moisParametre =  parseInt(req.query.moisParametre, 10);
    if(isNaN(moisParametre)){ 
      moisParametre = 9; // octobre par default 
    }
    let anneeParametre = parseInt(req.query.anneeParametre, 10);
    if(isNaN(anneeParametre)){ 
      anneeParametre = 2024; // par default
    }

    const date = new Date(anneeParametre, moisParametre, 1);

    // le mois courant en français en utilisant le nom long du mois
    const mois = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(date);

    // le nombre total de jours dans le mois courant
    const nombreJours = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

    // le jour de la semaine du premier jour du mois courant (dimanche = 0, lundi = 1, mardi = 2, ... )
    const premierJour = new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    // le nombre de cellule vides avant le premier jour à afficher dans le calendrier
    //si le premier jour est dimanche (0), on commence à 6 pour décaler correctement
    const caseDepart = (premierJour === 0) ? 6 : premierJour - 1;

    // récupère le numéro de la semaine à partir des paramètres de requête, ou utilise 1 par défaut si aucun paramètre n'est fourni
    const semaine = parseInt(req.query.semaine, 10) || 1;

    res.render('rendezVous', { agenda, date, mois, nombreJours, caseDepart, semaine, moisParametre, anneeParametre, rendezVousList });

  } catch (error) {
    res.status(500).send('Erreur lors de la récupération des rendez-vous : ' +  error.message);
  }
};
