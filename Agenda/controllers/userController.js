const User = require('../models/user');
const RendezVous = require('../models/rendezvous.js'); 
const Agenda = require('../models/agenda.js'); 
const bcrypt = require('bcrypt'); // pour le mot de passe hasher
// pour reset password via mail
const nodemailer = require('nodemailer');
const crypto = require('crypto'); // token pour reset password
const { error } = require('console');
require('dotenv').config();
const rendezVousController = require('../controllers/rendezvousController');
const agendaController = require('../controllers/agendaController');

const SALT_ROUNDS = 10; // Nombre de tours de salage pour bcrypt

// Créer un utilisateur
exports.createUser = async (req, res) => {
  try {
    const { name, email, password , confirmPassword } = req.body;

    // validation mail 
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).render('register', { error: 'Adresse email invalide.' });
    }

    if(name.length < 4 ){
      return res.status(400).render('register', { error: 'le nom doit contenir au moins 4 caractères.' });
    }

    // validation password
    if(password.length < 6){
      return res.status(400).render('register', { error: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    if(password !== confirmPassword){
      return res.status(400).render('register', { error: 'Les mots de passe ne correspondent pas.' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    // const user = new User(req.body);
    const user = new User({
      name,
      email,
      password: hashedPassword // Sauvegarder le mot de passe hashé
    });
    await user.save();
    res.redirect('/users/login');
    //res.status(201).send(user);
  } catch (err) {
    //res.status(400).send(err);
    res.status(400).render('register', { error: err.message });
  }
};

// connecter un utilisateur
exports.loginUser = async (req , res) =>{
  try{
    const {email , password} = req.body;
    const user = await User.findOne({ email });
    
    if( !user ){
      return res.status(400).render('login' ,{error: 'Utilisateur non trouvé '});

    }
    const isMatch = await bcrypt.compare(password , user.password);
    if(!isMatch ){
      return res.status(400).render('login' ,{error: 'Mot de passe incorrect  '});
    }
    
    // enregistrer le mail de l utilisateur connecte
    req.session.email = email;
    
    res.redirect('/agenda'); // rediger vers la page principale
  }catch(err){
    res.status(500).render('login', { error: err.message });
  }
};

// Lire tous les utilisateurs
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).send(users);
  } catch (err) {
    res.status(500).send(err);
  }
};
// Déconnexion d'un utilisateur
exports.logoutUser = async (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Erreur lors de la déconnexion');
    }
    res.redirect('/');
  });
};

exports.getUserByMail = async (req, res) => {
  try {
    const users = req.session.email;
    const temp = await User.findOne({"email":users});
    return temp;
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.updateUserByMail = async (req, res) => {
  try {
    
    const{nom , email} = req.body;
    const oldMail = req.session.email;
    
    await User.updateOne({"email":oldMail},{$set:{"name":nom,"email":email}});
    
    temp = await Agenda.find({"partages.email":oldMail});
    
    for(let agenda of temp){
      await Agenda.updateOne({_id : agenda._id ,"partages.email":oldMail},{$set:{"partages.$.email":email}})
    }

    await RendezVous.updateMany({"createurEmail":oldMail},{$set:{"createurEmail":email}});

    await Agenda.updateMany({"createurEmail":oldMail},{$set:{"createurEmail":email}});

    req.session.email = email;
    res.redirect("/agenda");
    // res.status(200).send(temp);

  } catch (err) {
    res.status(500).send(err);
  }
};

const transporter = nodemailer.createTransport({
  host : process.env.MAIL_HOST ,
  port : process.env.MAIL_PORT,
  auth:{
    user: process.env.MAIL_USER, 
    pass: process.env.MAIL_PASS
  }
});


// mot de pass oblié
exports.forgotPassword = async (req , res) => {
  try {
    const email = req.body.email;

    // generer un token 
    const token = crypto.randomBytes(32).toString('hex');

    //chercher l'utilisateur et mettre à jour avec le token 
    const user = await User.findOne({ email: email });
    if(!user){
      return res.render('forgot-password' ,{
        error : 'Aucun compte associe à cette addresse mail.'
      });
    }

    user.resetPassWordToken = token;
    user.resetPassWordExpires =  Date.now() + ( 20 * 60 * 1000 ); // expirées dans 20 min
    //save dans la base de données 
    await user.save();
    
    
    // envoye le mail
    const resetURL = `http://localhost:3000/users/reset-password/${token}`;
    const mailOption = {
      to: user.email,
      from : 'agenda support <support@agenda.com>',
      subject: 'Réinitialisation mot de passe Agenda',
      text: `Bonjour \n\nPour votre demande de réinitialisation de mot de passe, veuillez cliquer sur le lien suivant\n\n
      ${resetURL}\n\n`
    };

    await transporter.sendMail(mailOption);
    res.render('forgot-password', { 
      error: 'Un email de réinitialisation a été envoyé à votre adresse.' 
    });

    
  } catch (err) {
    res.render('forgot-password', { error: err.message });
  }
}

// affiche formulaire resetPassword
exports.getResetPassword = async (req , res) =>{
  try {
    const user = await User.findOne({
      resetPassWordToken : req.params.token,
      resetPassWordExpires : {$gt : Date.now()}
    });
    if(!user || !req.params.token){
      return res.render('reset-password',{
        error : 'Le lien de réinitialisation est invalide ou a expiré.',
        token: null,
        linkExpired : true
      });
    }
    res.render('reset-password' , {
      error : null ,
      token : req.params.token,
      linkExpired : false
    });
    
  } catch (error) {
    res.render('reset-password', { error: err.message });
  }
}

// traite le nouveau mot de passe 
exports.postResetPassword = async (req , res ) =>{
  try {

    const password  = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if(password.length < 6 ){
      return res.render('reset-password' , 
        { 
          error: 'Le mot de passe doit contenir au moins 6 caractères.' 

        });
    } 

    if(password !==  confirmPassword ){
      return res.render('reset-password' , 
        { 
          error: 'Les mots de passe ne correspondent pas.' 

        });
    }

    const user = await User.findOne({
      resetPassWordToken :  req.params.token,
      resetPassWordExpires : {$gt: Date.now()}
    });

    if(!user){
      return res.render('reset-password' , 
        { 
          error: 'Le token a expiré.' 

        });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    user.password =  hashedPassword ;
    user.resetPassWordToken = undefined;
    user.resetPassWordExpires = undefined;
    await user.save();

    res.redirect('/users/login');
  } catch (error) {
    res.render('reset-password', { error: err.message });
  }
}

exports.bloquerEmailUtilisateur = async (req , res) =>{
  try {

    let noninsert = [];
    const email = req.session.email;
    userData = await User.findOne({"email" : email });

    const emails = req.body.emails;

    const emailsRegex = /([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$|^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4},)+/;

    emails2 = emails.split(",");
    userData = await User.findOne({"email" : email });
    allAgendas = await Agenda.find({"createurEmail" : email});

    for(let i = 0; i < emails2.length;i++){

      let user = await User.findOne({"email" : emails2[i] });
      // console.log(user);

      let nbreturn = await User.findOne({"email" : emails2[i] }).count();
      // console.log(nbreturn);
    
      if(nbreturn > 0 && emailsRegex.test(emails2[i]) && !userData.blocked.includes(emails2[i]) && emails2[i] != userData.email){
        // console.log(emails2[i]);
        await User.updateOne({"email":email},{$push:{"blocked":emails2[i]}});

        for(let agenda of allAgendas){
          let rendezvousagenda = await RendezVous.find({agenda : agenda._id , "createurEmail" : emails2[i]});
          // console.log(rendezvousagenda," ----rendezvous agenda");
          
          for(let rdv of rendezvousagenda){
            req.body.recurrence = false;
            req.params.rendezvousId = rdv._id;
            req.params.blocage = true;
            // console.log(req.body.recurrence,req.params.rendezvousId,req.params.blocage," ----req");
            await rendezVousController.supprimerRendezVous(req);
          }
          const partageExistant = agenda.partages.find(p => p.email === emails2[i]);
          if(partageExistant){
            req.params.agendaId = agenda._id;
            req.body.emailPartage = emails2[i];
            req.body.userEmailConnected = email;
            req.params.blocage = true;

            // console.log(req.params.agendaId, req.body.emailPartage, req.body.userEmailConnected, " ----req annuler partage")
            await agendaController.annulerPartage(req);
          }
        }

        //partie pour s'occuper des de nos occurences de rendezvous et d'agendas dans ceux de emails2[i]
        //allhisagenda recupere tous les agendas de emails2[i]
        allhisAgendas = await Agenda.find({"createurEmail" : emails2[i]});

        //parcours tous les agendas dans allhisagendas
        for(let agenda of allhisAgendas){
          //trouve tout nos rdv dans l'instance d'un agenda "agenda" de allhisagenda
          let rendezvousagenda = await RendezVous.find({agenda : agenda._id , "createurEmail" : email});

          //parcours les rdv qu'on as trouve et les supprimes de l'instance d'agenda
          for(let rdv of rendezvousagenda){
            req.body.recurrence = false;
            req.params.rendezvousId = rdv._id;
            req.params.blocage = true;
            // console.log(req.body.recurrence,req.params.rendezvousId,req.params.blocage," ----reqhis");
            await rendezVousController.supprimerRendezVous(req);
          }
          //annule le partage de l'instance d'agenda qui nous à été fait si il nous à été partagé
          const partageExistant = agenda.partages.find(p => p.email === email);
          if(partageExistant){
            req.params.agendaId = agenda._id;
            req.body.emailPartage = email;
            req.body.userEmailConnected = emails2[i];
            req.params.blocage = true;

            // console.log(req.params.agendaId, req.body.emailPartage, req.body.userEmailConnected, " ----req annuler partagehis")
            await agendaController.annulerPartage(req);
          }
        }



      }else{
          // console.log("lol emails2");
          noninsert.push(emails2[i]);
      }
    }
    if(noninsert.length > 0){
      return res.render('compte' , {title : 'Votre compte', userData, noninsert});
    }

    

    res.redirect('/users/compte');
    console.log("après render");
    
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
}

exports.unblockUser = async (req , res) =>{
  try {
    const userConnectedEmail = req.body.userConnectedEmail;
    const blockedUserEmail = req.body.blockedUserEmail;

    userConnected = await User.find({"email" : userConnectedEmail});
    console.log(userConnectedEmail,userConnected[0].blocked,blockedUserEmail);
    let index = userConnected[0].blocked.indexOf(blockedUserEmail);

    if(userConnected[0].blocked.includes(blockedUserEmail)){
      if(index != -1){
        userConnectedBlockedTab = userConnected[0].blocked;
        userConnectedBlockedTab.splice(index,1);
        await User.updateOne({"email" : userConnectedEmail},{$set:{"blocked":userConnectedBlockedTab}});
        res.redirect('/users/compte');
      }
    }

  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
}