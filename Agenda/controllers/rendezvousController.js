const RendezVous = require('../models/rendezvous.js'); 
const Agenda = require('../models/agenda.js'); 

// Fonction pour créer un rendez-vous et le sauvegarder dans la base de données
exports.creerRendezVous = async (req, res) => {
  try {
    const { nom, couleur, description, dateRendezVous, participants, createurEmail, dureeHeures, dureeMinutes } = req.body;
    
    const agenda = await Agenda.findById(req.params.agendaId);

    // créer un nouveau rendez-vous
    const nouveauRendezVous = new RendezVous({
      nom,
      description,
      dateRendezVous,
      participants,
      createurEmail,
      agenda: agenda ,
      duree: {
        heures: dureeHeures,
        minutes: dureeMinutes
      },
      couleur
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

    // recuperer l id de l'agenda a afficher
    const agendaId = req.params.agendaId;

    // recuperer tout les agendas de la bdd
    const agendas = await Agenda.find();

    // recuperer l agenda a afficher
    const agenda = await Agenda.findById(agendaId);
    if (!agenda) {
      return res.status(401).send('Agenda non trouvé : ' + agendaId);
    }

    //date de systeme actuelle
    const dateActuelle = new Date();

    // recuperer les rendezvous des autres agendas passer en parametre (s il y en a)
    let agendaIds = [agendaId]
    agendas.forEach(agenda => {
      if(req.query[agenda.nom]){
        agendaIds.push(agenda.id)
      }
    });
    const rendezVousList = await RendezVous.find({ agenda: { $in : agendaIds }});  // les rendez-vous de cet agenda
    
    // la date a afficher
    let moisParametre =  parseInt(req.query.moisParametre, 10);
    if(isNaN(moisParametre)){ 
      // moisParametre = 9; // octobre par defaut
      moisParametre = dateActuelle.getMonth() ;
    }
    let anneeParametre = parseInt(req.query.anneeParametre, 10);
    if(isNaN(anneeParametre)){ 
      //anneeParametre = 2024; // par default
      anneeParametre = dateActuelle.getFullYear(); // année actuelle
    }

    let jourActuel = dateActuelle.getDate();

    const date = new Date(anneeParametre, moisParametre, 1);

    // le mois courant en français en utilisant le nom long du mois
    const mois = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(date);

    // le nombre total de jours dans le mois courant
    const nombreJours = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

    // le jour de la semaine du premier jour du mois courant (dimanche = 0, lundi = 1, mardi = 2, ... )
    const premierJour = new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    // le nombre de cellule vides avant le premier jour à afficher dans le calendrier
    // si le premier jour est dimanche (0), on commence à 6 pour décaler correctement
    const caseDepart = (premierJour === 0) ? 6 : premierJour - 1;

    // récupère le numéro de la semaine à partir des paramètres de requête, ou utilise 1 par défaut si aucun paramètre n'est fourni
    const semaine = parseInt(req.query.semaine, 10) || 1;

    res.render('rendezVous', { req, agenda, date, mois, nombreJours, caseDepart, semaine, moisParametre, anneeParametre, rendezVousList, agendas });

  } catch (error) {
    res.status(500).send('Erreur lors de la récupération des rendez-vous : ' +  error.message + " " + JSON.stringify(req.params));
  }
};

//supprimer un rendez vous
exports.supprimerRendezVous = async (req, res) => {
  try{
  
    await RendezVous.findByIdAndDelete(req.params.rendezvousId);
  
    res.redirect('/rendezvous/' + req.params.agendaId);

  } catch (error) {
    res.status(501).send('Erreur lors de la supression du rendez-vous : ' +  error.message);
  }

};

// Fonction pour obtenir un rendez-vous par ID
exports.getRendezVousById = async (req) => {
  try {
    const rendezVousId = req.params.rendezvousId;

    // Rechercher le rendez-vous par son ID
    const rendezVous = await RendezVous.findById(rendezVousId);

    // Vérifier si le rendez-vous existe
    if (!rendezVous) {
      return { error: 'Rendez-vous non trouvé' };  // Renvoie l'erreur
    }

    // Renvoie le rendez-vous trouvé
    return rendezVous;
  } catch (error) {
    console.error(error);
    return { error: 'Erreur serveur, veuillez réessayer plus tard.' };  // Renvoie l'erreur
  }
};

// fonction pour modifier un rendez-vous
exports.modifierRendezVous = async (req, res) => {
  try {
    const { nom, couleur, description, dateRendezVous, participants, createurEmail, dureeHeures, dureeMinutes } = req.body;

    // construction dynamique des champs à mettre à jour
    const champsModifies = {
      ...(nom && { nom }),
      ...(couleur && { couleur }),
      ...(description && { description }),
      ...(dateRendezVous && { dateRendezVous }),
      ...(participants && { participants }),
      ...(createurEmail && { createurEmail }),
      ...(dureeHeures || dureeMinutes) && { 
        duree: {
          heures: dureeHeures || 0,
          minutes: dureeMinutes || 0
        }
      }
    };

    // Mettre à jour le rendez-vous
    const rendezVousMisAJour = await RendezVous.findByIdAndUpdate(
      req.params.rendezvousId,
      { $set: champsModifies },
      { new: true }
    );

    if (!rendezVousMisAJour) {
      return res.status(404).json({ message: 'Rendez-vous non trouvé' });
    }

    res.redirect('/rendezvous/' + req.params.agendaId);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la modification du rendez-vous', error: error.message });
  }
};
