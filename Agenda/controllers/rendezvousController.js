const RendezVous = require('../models/rendezvous.js'); 
const Agenda = require('../models/agenda.js'); 

// Fonction pour créer un rendez-vous et le sauvegarder dans la base de données
exports.creerRendezVous = async (req, res) => {
  try {
    const {
      nom,
      description,
      dateRendezVous,
      participants,
      createurEmail,
      dureeHeures,
      dureeMinutes,
      estRecurrent,
      typeRecurrence,
      finRecurrence
    } = req.body;
    
    const agenda = await Agenda.findById(req.params.agendaId);


    // creer un rdv Recurrence

    if(estRecurrent === 'on' && typeRecurrence !== 'aucun'){
      const dateDebut = new Date(dateRendezVous);
      const dateFin = new Date(finRecurrence + 'T23:59:59');
      // tableau qui contient tous les nouveaux rdv
      const renfezVousRecurrents = [];

      let dateActuelle = new Date(dateDebut);

      while(dateActuelle <= dateFin){
        const nouveauRendezVous = new RendezVous({
          nom,
          description,
          dateRendezVous : new Date(dateActuelle),
          participants,
          createurEmail,
          agenda: agenda ,
          duree: {
            heures: dureeHeures,
            minutes: dureeMinutes
          },
          couleur : agenda.couleur,
          estRecurrent: true,
          typeRecurrence,
          finRecurrence: dateFin

        });

        renfezVousRecurrents.push(nouveauRendezVous);

        let nextDate = new Date(dateActuelle) ;
        switch (typeRecurrence) {
          case 'quotidien':
            nextDate.setDate(dateActuelle.getDate() + 1);
            break;
          case 'semaine':
            nextDate.setDate(dateActuelle.getDate() + 7);
            break;
          case 'mensuel':
            nextDate.setMonth(dateActuelle.getMonth() + 1);
            break;
          default:
            throw new Error('Type de récurrence invalide');
        }
        dateActuelle = nextDate;
      }

      // sauvegarde les rdvs recurrents
      const rendezVousSauvegardes = await Promise.all(
        renfezVousRecurrents.map(rdv => rdv.save())
      );

      // ajoute les ids rdvs à l'agenda
      await Agenda.findByIdAndUpdate(agenda._id,{
        $push: {rendezVous: { $each: rendezVousSauvegardes.map(rdv => rdv._id) } }
      });

    }else{

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
        couleur : agenda.couleur
      });

      // sauvegarde
      const rendezVousSauvegarde = await nouveauRendezVous.save();

      // ajoute le rendez-vous à l'agenda correspondant
      await Agenda.findByIdAndUpdate(agenda._id, {
        $push: { rendezVous: rendezVousSauvegarde._id }
      });
    }

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

    const userConnected = localStorage.getItem("userEmail");
    const agendas = await Agenda.find({ createurEmail: userConnected });

    const agendasPartages = await Agenda.find({
      "partages.email": userConnected
    });

    if (!agenda) {
      return res.status(401).send('Agenda non trouvé : ' + agendaId);
    }

    // recuperer les rendezvous des autres agendas passer en parametre (s il y en a)
    let agendaIds = [agendaId]
    agendas.forEach(agenda => {
      if(req.query[agenda.nom]){
        agendaIds.push(agenda.id)
      }
    });
    
    agendasPartages.forEach(agenda => {
      if(req.query[agenda.nom]){
        agendaIds.push(agenda.id)
      }
    });

    //date de systeme actuelle
    const dateActuelle = new Date();

    let temp = req.query.weekDate;
    if(temp != undefined){
      temp2 = new Date(temp);
    }
    
    let moisParametre;
    let anneeParametre;
    let nbsemaine = 0;

    if(temp != undefined){

      let nbjours = 0;

      let annee2;
      let semaine2;
      let mois2 = 1;

      valeurs = temp.split('-W');
      annee2 = parseInt(valeurs[0]);
      semaine2 = parseInt(valeurs[1]);

      let dte = new Date(annee2, 1, 0).getDate();
      let premierJour = new Date(annee2, 0, 1).getDay();

      if(premierJour != 1){
        let missingWeekDays;
        if(premierJour == 0){
          missingWeekDays = 1 - 7 ;
        }else{
          missingWeekDays = 1 - premierJour;
        }
        nbjours = missingWeekDays;
        nbsemaine++;
      }

      for(i = 0; i < semaine2 && mois2 < 12;i++){
        nbsemaine++;
        nbjours = nbjours + 7;
        if( nbjours > dte){
          nbjours = nbjours - dte;
          mois2++;
          dte = new Date(annee2,mois2,0).getDate();
          nbsemaine = 1;
        }else if(nbjours == dte){
          nbjours = 0;
          mois2++;
          dte = new Date(annee2,mois2,0).getDate();
          nbsemaine = 0;
        }
      }

      moisParametre = mois2 - 1;
      anneeParametre = annee2;

    }else{
      // la date et l'heure a afficher
      moisParametre =  parseInt(req.query.moisParametre, 10);
      if(isNaN(moisParametre)){ 
        // moisParametre = 9; // octobre par defaut
        moisParametre = dateActuelle.getMonth() ;
      }
      anneeParametre = parseInt(req.query.anneeParametre, 10);
      if(isNaN(anneeParametre)){ 
        //anneeParametre = 2024; // par default
        anneeParametre = dateActuelle.getFullYear(); // année actuelle
      }
    }
    
    let jourActuel = dateActuelle.getDate();

    //  debut et fin mois afffiché
    const debutMois = new Date(anneeParametre , moisParametre , 1);
    const finMois = new Date(anneeParametre , moisParametre + 1 , 0 ,23,59,59);

    // appliquer les filtres
    const nomFiltre = req.query.nomFiltre;
    const emailFiltre = req.query.emailFiltre;

    // chercher les rdvs pour mois spécificque
    const rendezVousList = await RendezVous.find({
      agenda : {$in : agendaIds},
      $or: [
        // rdvs non récurrents
        {
          estRecurrent: false,
          dateRendezVous: {
            $gte: debutMois,
            $lte: finMois
          }
        },
        // rdv récurrents =
        {
          estRecurrent: true,
          dateRendezVous: { $lte: finMois },
          finRecurrence: { $gte: debutMois }
        }
      ],
      ...(nomFiltre ? { nom: { $regex: "^"+nomFiltre+"$", $options: "i" } } : {}), // i insensible a la case
      ...(emailFiltre ? { createurEmail : { $regex: "^"+emailFiltre+"$", $options: "i" } } : {}) // i insensible a la case
    });

    // filtrage les rdvs
    const rendezVousFiltered = rendezVousList.filter(rdv => {
      if (!rdv.estRecurrent) return true;

      const dateRdv = new Date(rdv.dateRendezVous);
      const dateFin = new Date(rdv.finRecurrence);

      // rdv récurrents, si la date correspond au motif
      if (dateRdv.getTime() <= dateFin.getTime()) {
        switch (rdv.typeRecurrence) {
          case 'quotidien':
            return true; // Déjà filtré par la requête MongoDB
          case 'semaine':
            const jourSemaine = dateRdv.getDay();
            // Vérifier si le jour de la semaine correspond
            return jourSemaine === dateRdv.getDay();
          case 'mensuel':
            const jourMois = dateRdv.getDate();
            // Vérifier si le jour du mois correspond
            return jourMois === dateRdv.getDate();
        }
      }
      return false;
    });

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
    const semaine = (temp != undefined) ? nbsemaine : parseInt(req.query.semaine, 10) || 1;

    res.render('rendezvous', {nomFiltre, emailFiltre, emailFiltre, nomFiltre, req, agenda, date, mois, nombreJours, caseDepart, semaine, moisParametre, anneeParametre, rendezVousList, agendas, agendasPartages });

  } catch (error) {
    res.status(500).send('Erreur lors de la récupération des rendez-vous : ' +  error.message + " " + JSON.stringify(req.params));
  }
};

// Fonction pour afficher les rendez-vous d'un agenda
exports.afficherRendezVousJour = async (req, res) => {
  try {
    const agendaId = req.params.agendaId;
    const agenda = await Agenda.findById(agendaId);
    //const rendezVousList = await RendezVous.find({ agenda: agendaId });  // les rendez-vous de cet agenda

    const agendas = await Agenda.find({ createurEmail: agenda.createurEmail });

    if (!agenda) {
      return res.status(401).send('Agenda non trouvé : ' + agendaId);
    }

    // recuperer les rendezvous des autres agendas passer en parametre (s il y en a)
    let agendaIds = [agendaId]
    agendas.forEach(agenda => {
      if(req.query[agenda.nom]){
        agendaIds.push(agenda.id)
      }
    });
    
    //date de systeme actuelle
    const dateActuelle = new Date();

    let temp = req.query.dayDate;
    let temp2;

    let moisParametre;
    let anneeParametre;
    let numJourActuel;
    let jourParametre2;

    if(temp != undefined){
      temp2 = new Date(temp);
      moisParametre = parseInt(temp2.getMonth());
      anneeParametre = parseInt(temp2.getFullYear());
      numJourActuel = parseInt(temp2.getDate());

    }else if(temp == undefined){
      // la date et l'heure a afficher
      moisParametre =  parseInt(req.query.moisParametre, 10);
      if(isNaN(moisParametre)){ 
        // moisParametre = 9; // octobre par defaut
        moisParametre = dateActuelle.getMonth() ;
      }
      anneeParametre = parseInt(req.query.anneeParametre, 10);
      if(isNaN(anneeParametre)){ 
        //anneeParametre = 2024; // par default
        anneeParametre = dateActuelle.getFullYear(); // année actuelle
      }
      jourParametre2 = parseInt(req.query.jourParametre2);
      numJourActuel = parseInt(req.query.numJourActuel);
    }

    let jourActuel = dateActuelle.getDate();

    //  debut et fin mois afffiché
    const debutMois = new Date(anneeParametre , moisParametre , 1);
    const finMois = new Date(anneeParametre , moisParametre + 1 , 0 ,23,59,59);

    // appliquer les filtres
    const nomFiltre = req.query.nomFiltre;
    const emailFiltre = req.query.emailFiltre;

    // chercher les rdvs pour mois spécificque
    const rendezVousList = await RendezVous.find({
      agenda : {$in : agendaIds},
      $or: [
        // rdvs non récurrents
        {
          estRecurrent: false,
          dateRendezVous: {
            $gte: debutMois,
            $lte: finMois
          }
        },
        // rdv récurrents =
        {
          estRecurrent: true,
          dateRendezVous: { $lte: finMois },
          finRecurrence: { $gte: debutMois }
        }
      ],
      ...(nomFiltre ? { nom: { $regex: "^"+nomFiltre+"$", $options: "i" } } : {}), // i insensible a la case
      ...(emailFiltre ? { createurEmail : { $regex: "^"+emailFiltre+"$", $options: "i" } } : {}) // i insensible a la case    
    });

    // filtrage les rdvs
    const rendezVousFiltered = rendezVousList.filter(rdv => {
      if (!rdv.estRecurrent) return true;

      const dateRdv = new Date(rdv.dateRendezVous);
      const dateFin = new Date(rdv.finRecurrence);

      // rdv récurrents, si la date correspond au motif
      if (dateRdv.getTime() <= dateFin.getTime()) {
        switch (rdv.typeRecurrence) {
          case 'quotidien':
            return true; // Déjà filtré par la requête MongoDB
          case 'semaine':
            const jourSemaine = dateRdv.getDay();
            // Vérifier si le jour de la semaine correspond
            return jourSemaine === dateRdv.getDay();
          case 'mensuel':
            const jourMois = dateRdv.getDate();
            // Vérifier si le jour du mois correspond
            return jourMois === dateRdv.getDate();
        }
      }
      return false;
    });






    const date = new Date(anneeParametre, moisParametre, 1);

    // le mois courant en français en utilisant le nom long du mois
    const mois = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(date);

    // le nombre total de jours dans le mois d'avant le mois courant
    const nombreJours = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

    // le nombre total de jours dans le mois courant
    const nombreJours2 = new Date(date.getFullYear(), date.getMonth(), 0).getDate();

    // le jour de la semaine du premier jour du mois courant (dimanche = 0, lundi = 1, mardi = 2, ... )
    const premierJour = new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    // le nombre de cellule vides avant le premier jour à afficher dans le calendrier
    //si le premier jour est dimanche (0), on commence à 6 pour décaler correctement
    const caseDepart = (premierJour === 0) ? 6 : premierJour - 1;

    // récupère le numéro de la semaine à partir des paramètres de requête, ou utilise 1 par défaut si aucun paramètre n'est fourni
    const semaine = (temp != undefined) ? ( ( parseInt(temp2.getDate()) ) / 7 ) : parseInt(req.query.semaine, 10) || 1;
    
    if(isNaN(numJourActuel)){
      numJourActuel = 1;
    }
    //gère la valeur de Parametre2 pour l'affichage du nom des jours lorsqu'on change avec la sélection de jours
    if(temp != undefined){
      jourParametre2 = parseInt(temp2.getDate());
      if(jourParametre2 > 6){
        jourParametre2 = ((jourParametre2 - caseDepart) % 7);
      }else{
        if( ( ((jourParametre2 + caseDepart) % 7) - 1 ) < 0){
          jourParametre2 = 7 + ( ((jourParametre2 + caseDepart) % 7) - 1 );
        }else{
          jourParametre2 = ( ((jourParametre2 + caseDepart) % 7) - 1 );
        }
      }
    }

    res.render('rendezvousjour', {nomFiltre, emailFiltre, req, agenda, date, mois, nombreJours, nombreJours2 , caseDepart, semaine, moisParametre, anneeParametre, rendezVousList, agendas , jourParametre2 , numJourActuel});

  } catch (error) {
    res.status(500).send('Erreur lors de la récupération des rendez-vous : ' +  error.message + " " + JSON.stringify(req.params));
  }
};

exports.afficherRendezVousMois = async (req, res) => {
  try {
    const agendaId = req.params.agendaId;
    const agenda = await Agenda.findById(agendaId);
    //const rendezVousList = await RendezVous.find({ agenda: agendaId });  // les rendez-vous de cet agenda

    const userConnected = localStorage.getItem("userEmail");
    const agendas = await Agenda.find({ createurEmail: agenda.createurEmail });

    const agendasPartages = await Agenda.find({ 
      "partages.email": userConnected 
    });

    if (!agenda) {
      return res.status(401).send('Agenda non trouvé : ' + agendaId);
    }

    // recuperer les rendezvous des autres agendas passer en parametre (s il y en a)
    let agendaIds = [agendaId]
    agendas.forEach(agenda => {
      if(req.query[agenda.nom]){
        agendaIds.push(agenda.id)
      }
    });

    agendasPartages.forEach(agenda => {
      if(req.query[agenda.nom]){
        agendaIds.push(agenda.id)
      }
    });

    //date de systeme actuelle
    const dateActuelle = new Date();

    let temp = req.query.monthDate;
    console.log(temp);

    let moisParametre;
    let anneeParametre;

    if(temp != undefined){
      valeurs = temp.split('-');
      console.log(valeurs);
      anneeParametre = parseInt(valeurs[0]);
      moisParametre = (parseInt(valeurs[1]) - 1);
    }else{
      // la date et l'heure a afficher
      moisParametre =  parseInt(req.query.moisParametre, 10);
      if(isNaN(moisParametre)){ 
        // moisParametre = 9; // octobre par defaut
        moisParametre = dateActuelle.getMonth() ;
      }
      anneeParametre = parseInt(req.query.anneeParametre, 10);
      if(isNaN(anneeParametre)){ 
        //anneeParametre = 2024; // par default
        anneeParametre = dateActuelle.getFullYear(); // année actuelle
      }
    }

    let jourActuel = dateActuelle.getDate();

    //  debut et fin mois afffiché
    const debutMois = new Date(anneeParametre , moisParametre , 1);
    const finMois = new Date(anneeParametre , moisParametre + 1 , 0 ,23,59,59);

    // appliquer les filtres
    const nomFiltre = req.query.nomFiltre;
    const emailFiltre = req.query.emailFiltre;

    // chercher les rdvs pour mois spécificque
    const rendezVousList = await RendezVous.find({
      agenda : {$in : agendaIds},
      $or: [
        // rdvs non récurrents
        {
          estRecurrent: false,
          dateRendezVous: {
            $gte: debutMois,
            $lte: finMois
          }
        },
        // rdv récurrents =
        {
          estRecurrent: true,
          dateRendezVous: { $lte: finMois },
          finRecurrence: { $gte: debutMois }
        }
      ],
      ...(nomFiltre ? { nom: { $regex: "^"+nomFiltre+"$", $options: "i" } } : {}), // i insensible a la case
      ...(emailFiltre ? { createurEmail : { $regex: "^"+emailFiltre+"$", $options: "i" } } : {}) // i insensible a la case    
    
    });

    // filtrage les rdvs
    const rendezVousFiltered = rendezVousList.filter(rdv => {
      if (!rdv.estRecurrent) return true;

      const dateRdv = new Date(rdv.dateRendezVous);
      const dateFin = new Date(rdv.finRecurrence);

      // rdv récurrents, si la date correspond au motif
      if (dateRdv.getTime() <= dateFin.getTime()) {
        switch (rdv.typeRecurrence) {
          case 'quotidien':
            return true; // Déjà filtré par la requête MongoDB
          case 'semaine':
            const jourSemaine = dateRdv.getDay();
            // Vérifier si le jour de la semaine correspond
            return jourSemaine === dateRdv.getDay();
          case 'mensuel':
            const jourMois = dateRdv.getDate();
            // Vérifier si le jour du mois correspond
            return jourMois === dateRdv.getDate();
        }
      }
      return false;
    });


    const date = new Date(anneeParametre, moisParametre, 1);

    // le mois courant en français en utilisant le nom long du mois
    const mois = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(date);

    // le nombre total de jours dans le mois d'avant le mois courant
    const nombreJours = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

    // le nombre total de jours dans le mois courant
    const nombreJours2 = new Date(date.getFullYear(), date.getMonth(), 0).getDate();

    // le jour de la semaine du premier jour du mois courant (dimanche = 0, lundi = 1, mardi = 2, ... )
    const premierJour = new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    // le nombre de cellule vides avant le premier jour à afficher dans le calendrier
    //si le premier jour est dimanche (0), on commence à 6 pour décaler correctement
    const caseDepart = (premierJour === 0) ? 6 : premierJour - 1;

    // récupère le numéro de la semaine à partir des paramètres de requête, ou utilise 1 par défaut si aucun paramètre n'est fourni
    const semaine = parseInt(req.query.semaine, 10) || 1;

    res.render('rendezvousmois', {nomFiltre, emailFiltre, req, agenda, date, mois, nombreJours, nombreJours2 , caseDepart, semaine, moisParametre, anneeParametre, rendezVousList, agendas, agendasPartages});

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
    const { nom, couleur, description,
          dateRendezVous, participants, createurEmail, dureeHeures,
          dureeMinutes,
          //param pour modifier un rdv recurrent
          modifierTousLesRecurrents
        } = req.body;

    // const rendezVous = await RendezVous.findById(req.params.rendezVousId);
    const rendezVous = await RendezVous.findById(req.params.rendezvousId);
    if (!rendezVous) {
      return res.status(404).json({ message: 'Rendez-vous non trouvé' });
    }

    
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

    if(rendezVous.estRecurrent ){
      // modifier tous les rdvs recu à partir de la date actuelle
      await RendezVous.updateMany(
        {
          agenda: rendezVous.agenda,
          estRecurrent: true,
          typeRecurrence: rendezVous.typeRecurrence,
          dateRendezVous: { $gte: rendezVous.dateRendezVous },
          finRecurrence: rendezVous.finRecurrence
        },
        {
          $set: {
            nom: champsModifies.nom,
            couleur: champsModifies.couleur,
            description: champsModifies.description,
            participants: champsModifies.participants,
            duree: champsModifies.duree
          }
        }
      );
    } else {
      // Mettre à jour le rendez-vous
      const rendezVousMisAJour = await RendezVous.findByIdAndUpdate(
        req.params.rendezvousId,
        { $set: champsModifies },
        { new: true }
      );

      if (!rendezVousMisAJour) {
        return res.status(404).json({ message: 'Rendez-vous non trouvé' });
      }

    }

    res.redirect('/rendezvous/' + req.params.agendaId);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la modification du rendez-vous', error: error.message });
  }
};